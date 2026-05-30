/**
 * Para las razas que Nano Banana falló (raras/locales), reintentar
 * pasándole la foto de Wikipedia como REFERENCIA visual.
 *
 * Nano Banana es principalmente modelo de EDICIÓN: con image_input
 * mantiene anatomía/color del original y solo cambia estilo a foto pro.
 */
import { readFile, writeFile, mkdir } from 'fs/promises'

const REP = process.env.REPLICATE_API_TOKEN
if (!REP) { console.error('Falta REPLICATE_API_TOKEN'); process.exit(1) }

const OUT_DIR = '/tmp/new-breed-photos-v2'
await mkdir(OUT_DIR, { recursive: true })

// Lista de razas a reintentar: las KEEP_OLD + REVIEW del detector
const accuracy = JSON.parse(await readFile('/tmp/ai-accuracy-results.json', 'utf-8'))
const breeds = JSON.parse(await readFile('/tmp/breeds-to-generate.json', 'utf-8'))
const breedBySlug = new Map(breeds.map(b => [b.slug, b]))

const toFix = accuracy
  .filter(r => r.decision === 'KEEP_OLD' || r.decision === 'REVIEW')
  .map(r => breedBySlug.get(r.slug))
  .filter(Boolean)

console.log(`Razas a reintentar con imagen referencia: ${toFix.length}\n`)
toFix.forEach(b => console.log(`  · ${b.name} (${b.slug})`))
console.log()

async function fixOne(b) {
  const t0 = Date.now()
  // Prompt de "transferencia de estilo": mantén raza/anatomía, cambia presentación
  const prompt = `Transform this photo into a professional full-body studio-style portrait of the exact same dog breed (${b.name}). CRITICAL: keep the dog's breed characteristics, anatomy, head shape, coat type, color and pattern IDENTICAL to the reference image. ONLY change the setting and presentation: clean neutral outdoor background (grass meadow or simple natural ground), the ENTIRE dog visible standing in show stance from head to all four paws, professional Canon EOS R5 photography with 50mm f/2.8 lens, soft overcast natural light, real environmental depth. NO people, NO leashes, NO collars, NO urban elements, NO branding. Just the dog. Square 1:1 composition.`

  const r = await fetch(
    'https://api.replicate.com/v1/models/google/nano-banana/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REP}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt,
          image_input: [b.current_image_url], // ← clave: imagen de referencia
          output_format: 'png',
        },
      }),
    },
  )
  if (!r.ok) return { slug: b.slug, error: `HTTP ${r.status}: ${(await r.text()).slice(0, 200)}` }
  const j = await r.json()
  if (j.status !== 'succeeded') return { slug: b.slug, error: `status=${j.status} ${(j.error||'').slice(0,80)}` }
  const url = Array.isArray(j.output) ? j.output[0] : j.output
  if (!url) return { slug: b.slug, error: 'no output url' }
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  const path = `${OUT_DIR}/${b.slug}.png`
  await writeFile(path, buf)
  return { slug: b.slug, kb: Math.round(buf.length / 1024), ms: Date.now() - t0, path }
}

// Secuencial (solo 7 razas, no merece la pena paralelo)
console.log('Procesando secuencialmente...\n')
for (const b of toFix) {
  console.log(`→ ${b.name}…`)
  const r = await fixOne(b)
  if (r.error) console.log(`  ✗ ${r.error}`)
  else console.log(`  ✓ ${r.kb}KB en ${(r.ms/1000).toFixed(1)}s → ${r.path}`)
}
console.log(`\nDone. Resultados en ${OUT_DIR}/`)
