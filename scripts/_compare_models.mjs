/**
 * Comparación A/B real: GPT-Image-1 vs FLUX 1.1 Pro.
 * Misma raza, mismo prompt fotográfico-pro mejorado.
 * 4 imágenes en /tmp/test-breeds/compare/ para que el usuario elija.
 */
import { writeFile, mkdir } from 'fs/promises'

const OAI = process.env.OPENAI_API_KEY
const REP = process.env.REPLICATE_API_TOKEN
if (!OAI || !REP) { console.error('Faltan OPENAI_API_KEY o REPLICATE_API_TOKEN'); process.exit(1) }

await mkdir('/tmp/test-breeds/compare', { recursive: true })

// Prompts mejorados con "lenguaje de fotógrafo" para romper el look IA.
// Clave: cámara real + lente + ISO + light natural + imperfecciones + photojournalism.
const TESTS = [
  {
    slug: 'husky',
    prompt:
      'A candid documentary photograph of a young adult Siberian Husky standing alert on dewy summer grass at dawn. Thick double coat in black and white with classic facial mask, piercing pale blue eyes, erect triangular ears, plumed tail curled gently over the back. Slightly windswept fur revealing natural texture and minor imperfections. Shot on Canon EOS R5 with 85mm f/1.4 lens at f/2.2, ISO 400, soft overcast natural light, real-world environment with subtle background depth, NOT studio bokeh. Asymmetric composition, slight grain. Photojournalism style, not stock photo. Square 1:1 frame.',
  },
  {
    slug: 'golden',
    prompt:
      'A candid documentary photograph of an adult Golden Retriever standing relaxed on autumn grass in a real meadow. Long flowing golden coat with natural shedding and visible texture, leg and tail feathering, slightly damp from morning dew. Friendly intelligent expression, mouth slightly open, eyes catching natural light. Shot on Canon EOS R5 with 85mm f/1.4 lens at f/2.2, ISO 400, soft overcast natural light, real depth of field. Subtle imperfections: loose hairs, blade of grass on muzzle. Photojournalism style, asymmetric framing, slight grain. Square 1:1.',
  },
]

// ── GPT-Image-1 ───────────────────────────────────────────────────────────
async function gptImage({ slug, prompt }) {
  const t0 = Date.now()
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size: '1024x1024', quality: 'high' }),
  })
  if (!r.ok) return { model: 'gpt-image-1', slug, error: `HTTP ${r.status}: ${(await r.text()).slice(0, 200)}` }
  const j = await r.json()
  const buf = Buffer.from(j.data[0].b64_json, 'base64')
  const path = `/tmp/test-breeds/compare/${slug}__gpt-image-1.png`
  await writeFile(path, buf)
  return { model: 'gpt-image-1', slug, path, kb: Math.round(buf.length / 1024), ms: Date.now() - t0 }
}

// ── FLUX 1.1 Pro vía Replicate ───────────────────────────────────────────
async function fluxPro({ slug, prompt }) {
  const t0 = Date.now()
  const r = await fetch(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REP}`,
        'Content-Type': 'application/json',
        Prefer: 'wait', // bloquea hasta que termine, sin polling manual
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: '1:1',
          output_format: 'png',
          output_quality: 95,
          safety_tolerance: 2,
          prompt_upsampling: false, // NO reescribir el prompt
        },
      }),
    },
  )
  if (!r.ok) return { model: 'flux-1.1-pro', slug, error: `HTTP ${r.status}: ${(await r.text()).slice(0, 300)}` }
  const j = await r.json()
  if (j.status !== 'succeeded') return { model: 'flux-1.1-pro', slug, error: `status=${j.status}, error=${j.error}` }
  const url = Array.isArray(j.output) ? j.output[0] : j.output
  const imgR = await fetch(url)
  const buf = Buffer.from(await imgR.arrayBuffer())
  const path = `/tmp/test-breeds/compare/${slug}__flux-1.1-pro.png`
  await writeFile(path, buf)
  return { model: 'flux-1.1-pro', slug, path, kb: Math.round(buf.length / 1024), ms: Date.now() - t0 }
}

console.log('Generando 4 imágenes (2 razas × 2 modelos) en paralelo...\n')
const all = TESTS.flatMap(t => [gptImage(t), fluxPro(t)])
const results = await Promise.all(all)

console.log('\nResultados:')
for (const r of results) {
  if (r.error) console.log(`  ✗ ${r.slug.padEnd(8)} ${r.model.padEnd(15)} ERROR: ${r.error}`)
  else console.log(`  ✓ ${r.slug.padEnd(8)} ${r.model.padEnd(15)} ${String(r.kb).padStart(5)} KB  ${(r.ms/1000).toFixed(1)}s  ${r.path}`)
}
const cost = TESTS.length * (0.167 + 0.04)
console.log(`\nCoste total: $${cost.toFixed(3)} (2 razas × $0.207 = gpt-image-1 high + flux-1.1-pro)`)
