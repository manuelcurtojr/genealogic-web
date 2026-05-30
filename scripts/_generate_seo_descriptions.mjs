/**
 * Genera descriptions SEO-friendly para todas las razas sin description útil.
 *
 * Criterios meta description SEO:
 *   - 150-180 chars (Google trunca ~160 desktop, ~120 móvil)
 *   - Empieza con el nombre de la raza (keyword principal al inicio)
 *   - Menciona origen + 1-2 características distintivas
 *   - Tono natural, no listas robóticas
 *   - Termina con CTA implícito (estándar oficial, fotos, genealogía)
 *
 * Fuente: standard_data.origin + genealogic_standard.sections (apariencia,
 * temperamento, manto, tamaño).
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const OAI = process.env.OPENAI_API_KEY
if (!OAI) { console.error('Falta OPENAI_API_KEY'); process.exit(1) }
const APPLY = process.argv.includes('--apply')

const { data: breeds } = await supabase
  .from('breeds')
  .select('id, name, slug, description, standard_data, genealogic_standard')

const needsDesc = breeds.filter(b => !b.description || /^Imported from /i.test(b.description.trim()))
console.log(`Total razas: ${breeds.length}`)
console.log(`Sin description útil: ${needsDesc.length}\n`)

function extractContext(b) {
  const origin = b.standard_data?.origin || ''
  const fci = b.standard_data?.fci_number ? `FCI nº ${b.standard_data.fci_number}` : ''
  const sections = b.genealogic_standard?.sections || []
  const get = (k) => (sections.find(s => s.key === k)?.content || '').replace(/\*\*/g, '').replace(/\n+/g, ' ').slice(0, 250)
  return {
    origin, fci,
    apariencia: get('apariencia'),
    temperamento: get('temperamento'),
    manto: get('manto'),
    tamano: get('tamano-peso'),
  }
}

async function generateDesc(b) {
  const ctx = extractContext(b)
  const sys = `Eres un experto en cinología que escribe meta descriptions SEO para un directorio de razas caninas en español.

Reglas estrictas:
- Entre 150 y 180 caracteres (espacios incluidos). Cuenta antes de responder.
- Empieza con el nombre completo de la raza tal cual.
- Menciona el ORIGEN (país/región).
- Menciona 1-2 características distintivas (apariencia, temperamento, tamaño o función).
- NO uses palabras de relleno como "descubre", "conoce" o "todo sobre".
- NO uses comillas, listas, emojis, saltos de línea.
- Tono profesional pero natural, no robótico.
- Termina con un beneficio implícito ("estándar oficial", "genealogía completa", "fotos y ejemplares" o similar variable).

Devuelve SOLO la meta description, sin comillas ni nada más.`

  const user = `Raza: ${b.name}
Origen: ${ctx.origin}
${ctx.fci}
Apariencia: ${ctx.apariencia}
Temperamento: ${ctx.temperamento}
Manto: ${ctx.manto}
Tamaño: ${ctx.tamano}`

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      max_tokens: 100,
      temperature: 0.4,
    }),
  })
  if (!r.ok) return { slug: b.slug, error: `HTTP ${r.status}` }
  const j = await r.json()
  let desc = (j.choices?.[0]?.message?.content || '').trim()
  // Limpieza defensiva: quitar comillas externas si las hay
  desc = desc.replace(/^["'«]|["'»]$/g, '').trim()
  return { id: b.id, slug: b.slug, name: b.name, description: desc, len: desc.length }
}

// Pool concurrencia 10
let done = 0
const results = []
async function processItem(b) {
  const r = await generateDesc(b)
  done++
  if (r.error) console.log(`[${done}/${needsDesc.length}] ✗ ${b.slug}: ${r.error}`)
  else console.log(`[${done}/${needsDesc.length}] ✓ ${r.slug.padEnd(28)} (${r.len}c) ${r.description.slice(0, 80)}…`)
  return r
}

let idx = 0
async function runner() {
  while (idx < needsDesc.length) {
    const i = idx++
    results.push(await processItem(needsDesc[i]))
  }
}
await Promise.all(Array.from({ length: 10 }, runner))

const ok = results.filter(r => !r.error && r.description)
console.log(`\n═══ Generadas: ${ok.length} / ${needsDesc.length} ═══`)
console.log(`Longitud media: ${Math.round(ok.reduce((a,r)=>a+r.len,0) / ok.length)} chars`)
const tooLong = ok.filter(r => r.len > 200)
const tooShort = ok.filter(r => r.len < 130)
console.log(`Demasiado largas (>200): ${tooLong.length}`)
console.log(`Demasiado cortas (<130): ${tooShort.length}`)

if (!APPLY) {
  console.log(`\nDRY RUN. Para aplicar al DB: node scripts/_generate_seo_descriptions.mjs --apply`)
  console.log(`\nEjemplos:`)
  ok.slice(0, 5).forEach(r => console.log(`  ${r.slug}: ${r.description}`))
  process.exit(0)
}

console.log(`\nAplicando al DB...`)
let applied = 0
for (const r of ok) {
  const { error } = await supabase.from('breeds').update({ description: r.description }).eq('id', r.id)
  if (error) console.log(`  ✗ ${r.slug}: ${error.message}`)
  else applied++
}
console.log(`✓ Aplicadas ${applied} descriptions al DB`)
