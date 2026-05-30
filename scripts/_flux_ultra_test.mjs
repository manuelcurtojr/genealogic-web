/**
 * FLUX 1.1 Pro Ultra (4MP) con prompt enforcement de FULL BODY.
 * Misma raza, calidad y composición para directorio de razas.
 */
import { writeFile, mkdir } from 'fs/promises'

const REP = process.env.REPLICATE_API_TOKEN
if (!REP) { console.error('Falta REPLICATE_API_TOKEN'); process.exit(1) }
await mkdir('/tmp/test-breeds/compare', { recursive: true })

// Prompt enforcement de FULL BODY al máximo:
// - Frase explícita repetida varias veces
// - Capitalized en partes clave (FLUX presta atención)
// - Negación clara de portrait/closeup
// - Estructura: composition + dog + photography spec
const TESTS = [
  {
    slug: 'husky-ultra',
    prompt:
      'FULL BODY photograph showing the ENTIRE Siberian Husky from head to all four paws. The whole dog is visible standing in profile or three-quarter view on grass. Wide shot composition with the complete animal in frame, NOT a portrait, NOT a headshot, NOT cropped. ' +
      'A candid documentary image of a young adult Siberian Husky in standing show stance on dewy summer grass at dawn. Thick double coat in black and white with classic facial mask, pale blue eyes, erect triangular ears, plumed tail curled over the back, all four legs straight and visible. Slightly windswept fur with natural texture and minor imperfections. ' +
      'Shot on Canon EOS R5 with 50mm f/2.8 lens, ISO 400, soft overcast natural light, real environmental depth NOT studio bokeh. Slight grain, asymmetric framing. Photojournalism style. Square 1:1 composition with the entire dog body visible.',
  },
  {
    slug: 'golden-ultra',
    prompt:
      'FULL BODY photograph showing the ENTIRE Golden Retriever from head to all four paws. The whole dog is visible standing in profile or three-quarter view on grass. Wide shot composition with the complete animal in frame, NOT a portrait, NOT a headshot, NOT cropped. ' +
      'A candid documentary image of an adult Golden Retriever standing relaxed on autumn grass in a real meadow. Long flowing golden coat with natural shedding, leg and tail feathering, slightly damp from morning dew. Friendly intelligent expression, mouth slightly open. All four legs straight and visible. ' +
      'Shot on Canon EOS R5 with 50mm f/2.8 lens, ISO 400, soft overcast natural light, real depth of field. Subtle imperfections: loose hairs, blade of grass on muzzle. Photojournalism style, asymmetric framing, slight grain. Square 1:1 composition with the entire dog body visible.',
  },
]

async function fluxUltra({ slug, prompt }) {
  const t0 = Date.now()
  const r = await fetch(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro-ultra/predictions',
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
          aspect_ratio: '1:1',
          output_format: 'png',
          safety_tolerance: 2,
          raw: false, // raw=true es más "estilo cámara raw" pero menos vistoso
        },
      }),
    },
  )
  if (!r.ok) return { slug, error: `HTTP ${r.status}: ${(await r.text()).slice(0, 300)}` }
  const j = await r.json()
  if (j.status !== 'succeeded') return { slug, error: `status=${j.status}, error=${j.error}` }
  const url = Array.isArray(j.output) ? j.output[0] : j.output
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  const path = `/tmp/test-breeds/compare/${slug}__flux-pro-ultra.png`
  await writeFile(path, buf)
  return { slug, path, kb: Math.round(buf.length / 1024), ms: Date.now() - t0 }
}

console.log('Generando 2 con FLUX 1.1 Pro Ultra (secuencial por rate limit de cuenta nueva)...\n')
const results = []
for (const t of TESTS) {
  console.log(`  → ${t.slug}…`)
  const r = await fluxUltra(t)
  results.push(r)
  if (r.error) console.log(`    ✗ ${r.error}`)
  else console.log(`    ✓ ${r.kb} KB en ${(r.ms/1000).toFixed(1)}s → ${r.path}`)
  // Pequeña espera por rate limit (cuenta <$5)
  if (t !== TESTS[TESTS.length - 1]) await new Promise(r => setTimeout(r, 11000))
}
console.log(`\nCoste: $${(TESTS.length * 0.06).toFixed(2)} (2 × $0.06 flux-1.1-pro-ultra)`)
