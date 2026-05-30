/**
 * Genera promotional_content para TODAS las razas que aún no lo tienen.
 *
 * Usa GPT-4o-mini con standard_data + genealogic_standard como contexto.
 * Tono: cálido pero técnico — equilibra seducción con datos reales.
 * EVITA: tópicos cursi, frases vacías ("amigo fiel", "mejor compañero"),
 *         claims sin base, listas robóticas.
 *
 * Estructura JSON estricta — el modelo devuelve JSON parseable:
 *   {
 *     tagline:       string (1 frase emocional pero precisa),
 *     intro:         string (2-3 párrafos de contexto, con datos reales),
 *     virtues:       Array<{title, body}> (4 puntos distintivos),
 *     temperament:   string (descripción de carácter, sin tópicos),
 *     ideal_for:     string (a qué tipo de persona/hogar le pega),
 *     daily_life:    string (cómo es vivir con un ejemplar),
 *     considerations:string (lo honesto que hay que saber antes),
 *     closing:       string (frase de cierre que invita a contactar al criador)
 *   }
 *
 * Concurrencia: 10 en paralelo (OpenAI tier 2 permite mucho más).
 * Coste estimado: ~$0.003-0.005 por raza × 243 = $0.70-1.20 total.
 *
 * Resumable: si una raza ya tiene promotional_content, se salta.
 * Para forzar re-generación pasar --force.
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const OAI = process.env.OPENAI_API_KEY
if (!OAI) { console.error('Falta OPENAI_API_KEY'); process.exit(1) }
const FORCE = process.argv.includes('--force')
const APPLY = !process.argv.includes('--dry')

console.log(FORCE ? '═══ FORCE: regenera todas ═══' : '═══ Solo genera las que no tienen ═══')
console.log(APPLY ? '═══ Aplica a BD ═══' : '═══ DRY RUN (no aplica) ═══\n')

// Cargar razas
const { data: breeds } = await supabase
  .from('breeds')
  .select('id, slug, name, synonyms, standard_data, genealogic_standard, promotional_content')

const pending = breeds.filter((b) => FORCE || !b.promotional_content)
console.log(`Total razas: ${breeds.length}`)
console.log(`Pendientes: ${pending.length}\n`)

function ctx(b) {
  const origin = b.standard_data?.origin || ''
  const fci = b.standard_data?.fci_number ? `FCI nº ${b.standard_data.fci_number}` : ''
  const sections = b.genealogic_standard?.sections || []
  const get = (k) => (sections.find((s) => s.key === k)?.content || '').replace(/\*\*/g, '').replace(/\n+/g, ' ').slice(0, 500)
  return {
    name: b.name,
    synonyms: (b.synonyms || []).filter(Boolean).slice(0, 3),
    origin,
    fci,
    apariencia: get('apariencia'),
    temperamento: get('temperamento'),
    manto: get('manto'),
    tamano: get('tamano-peso'),
    cabeza: get('cabeza'),
    info: get('info-general'),
  }
}

async function generate(b) {
  const c = ctx(b)
  const sys = `Eres un experto en cinología que redacta contenido promocional para razas caninas en español.

Reglas estrictas:
- Tono CÁLIDO PERO TÉCNICO. Equilibra seducción con datos reales del estándar.
- PROHIBIDO: tópicos cursi-pet ("mejor amigo", "compañero leal", "amor incondicional"), exageraciones vacías ("perro perfecto", "ideal para cualquier familia"), claims sin base.
- Cuando puedas, ANCLA en datos del estándar (origen, peso, función, FCI nº) — eso es lo que distingue el tono "criador serio" del "blog genérico".
- Sé HONESTO en "considerations" — si una raza requiere experiencia, mucho ejercicio, o tiene riesgos de salud, dilo. Eso da credibilidad a todo lo demás.

Estructura — devuelve EXACTAMENTE este JSON sin markdown ni explicaciones:
{
  "tagline": "1 frase emocional pero precisa (15-25 palabras, sin signos de exclamación)",
  "intro": "2-3 párrafos separados por \\n\\n. Contexto histórico/funcional + posición actual de la raza. Datos reales cuando sea posible. 400-650 caracteres totales.",
  "virtues": [
    { "title": "Título corto (3-6 palabras)", "body": "1-2 frases. Algo distintivo de esta raza, no genérico." },
    ... 4 elementos totales
  ],
  "temperament": "1 párrafo cálido pero preciso. 200-350 chars.",
  "ideal_for": "1 párrafo de a qué tipo de persona/hogar le pega. Concreto. 200-350 chars.",
  "daily_life": "1 párrafo de cómo es vivir con un ejemplar. Necesidades de ejercicio, climáticas, pelaje. 200-400 chars.",
  "considerations": "1 párrafo honesto de lo que conviene saber antes (salud, legislación, exigencia, tamaño). 200-400 chars.",
  "closing": "1 frase de cierre que invite a contactar al criador. 15-30 palabras."
}`

  const user = `Raza: ${c.name}${c.synonyms.length ? ` (también: ${c.synonyms.join(', ')})` : ''}
Origen: ${c.origin}
${c.fci}

Apariencia: ${c.apariencia}
Cabeza: ${c.cabeza}
Manto: ${c.manto}
Tamaño/peso: ${c.tamano}
Temperamento: ${c.temperamento}
Info general: ${c.info}

Devuelve el JSON con el contenido promocional.`

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.6,
    }),
  })
  if (!r.ok) return { slug: b.slug, error: `HTTP ${r.status}: ${(await r.text()).slice(0, 150)}` }
  const j = await r.json()
  const content = j.choices?.[0]?.message?.content || ''
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    return { slug: b.slug, error: `JSON parse: ${content.slice(0, 200)}` }
  }
  // Validación básica
  const required = ['tagline', 'intro', 'virtues', 'temperament', 'ideal_for', 'daily_life', 'considerations', 'closing']
  for (const k of required) {
    if (!parsed[k]) return { slug: b.slug, error: `missing field: ${k}` }
  }
  if (!Array.isArray(parsed.virtues) || parsed.virtues.length === 0) {
    return { slug: b.slug, error: 'virtues must be array with at least 1 item' }
  }
  return { slug: b.slug, id: b.id, content: parsed }
}

let done = 0, ok = 0, errs = 0
const t0 = Date.now()
const errors = []
async function processItem(b) {
  const r = await generate(b)
  done++
  const elapsed = ((Date.now() - t0) / 1000).toFixed(0)
  if (r.error) {
    errs++
    errors.push(r)
    console.log(`[${String(done).padStart(3)}/${pending.length}] ✗ ${b.slug.padEnd(30)} ${r.error.slice(0, 80)}`)
    return r
  }
  if (APPLY) {
    const { error } = await supabase
      .from('breeds')
      .update({ promotional_content: r.content })
      .eq('id', r.id)
    if (error) {
      errs++
      console.log(`[${String(done).padStart(3)}/${pending.length}] ✗ ${b.slug.padEnd(30)} DB: ${error.message}`)
      return { slug: b.slug, error: error.message }
    }
  }
  ok++
  const taglineSlice = r.content.tagline.slice(0, 70)
  console.log(`[${String(done).padStart(3)}/${pending.length}] ✓ ${b.slug.padEnd(30)} (${r.content.virtues.length}v) ${taglineSlice}…  [${elapsed}s]`)
  return r
}

// Pool concurrencia 10
let idx = 0
async function runner() {
  while (idx < pending.length) {
    const i = idx++
    await processItem(pending[i])
  }
}
await Promise.all(Array.from({ length: 10 }, runner))

console.log(`\n═══ DONE ═══`)
console.log(`✓ Generadas: ${ok}`)
console.log(`✗ Errores:   ${errs}`)
console.log(`Tiempo total: ${((Date.now() - t0) / 1000).toFixed(0)}s`)
if (errors.length) {
  console.log(`\nErrores detallados:`)
  errors.forEach((e) => console.log(`  · ${e.slug}: ${e.error}`))
}
console.log(`\nCoste estimado: ~$${(ok * 0.004).toFixed(2)} (gpt-4o-mini)`)
