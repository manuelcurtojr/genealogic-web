/**
 * Test Nano Banana (Gemini 2.5 Flash Image) — generación pura desde texto.
 * Mismas razas y prompts que FLUX ultra para comparación justa.
 */
import { writeFile, mkdir } from 'fs/promises'

const REP = process.env.REPLICATE_API_TOKEN
await mkdir('/tmp/test-breeds/compare', { recursive: true })

const TESTS = [
  {
    slug: 'husky-nano',
    prompt:
      'FULL BODY photograph showing the ENTIRE Siberian Husky from head to all four paws. A candid documentary image of a young adult Siberian Husky in standing show stance on dewy summer grass at dawn. Thick double coat in black and white with classic facial mask, pale blue eyes, erect triangular ears, plumed tail curled over the back, all four legs straight and visible. Slightly windswept fur with natural texture and minor imperfections. Shot on Canon EOS R5 with 50mm f/2.8 lens, ISO 400, soft overcast natural light, real environmental depth NOT studio bokeh. Photojournalism style. Square 1:1 with the entire dog body visible.',
  },
  {
    slug: 'golden-nano',
    prompt:
      'FULL BODY photograph showing the ENTIRE Golden Retriever from head to all four paws. A candid documentary image of an adult Golden Retriever standing relaxed on autumn grass in a real meadow. Long flowing golden coat with natural shedding, leg and tail feathering, slightly damp from morning dew. Friendly intelligent expression, mouth slightly open. All four legs straight and visible. Shot on Canon EOS R5 with 50mm f/2.8 lens, ISO 400, soft overcast natural light, real depth of field. Photojournalism style. Square 1:1 with the entire dog body visible.',
  },
]

async function nanoBanana({ slug, prompt }) {
  const t0 = Date.now()
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
          // nano-banana acepta solo prompt + image_input opcional (para edición).
          // Para generación pura desde texto, dejamos image_input vacío.
          output_format: 'png',
        },
      }),
    },
  )
  if (!r.ok) return { slug, error: `HTTP ${r.status}: ${(await r.text()).slice(0, 400)}` }
  const j = await r.json()
  if (j.status !== 'succeeded') return { slug, error: `status=${j.status}, error=${j.error}` }
  const url = Array.isArray(j.output) ? j.output[0] : j.output
  if (!url) return { slug, error: `no output url: ${JSON.stringify(j.output)}` }
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  const path = `/tmp/test-breeds/compare/${slug}__nano-banana.png`
  await writeFile(path, buf)
  return { slug, path, kb: Math.round(buf.length / 1024), ms: Date.now() - t0 }
}

console.log('Generando 2 con Nano Banana (Gemini 2.5 Flash Image) — secuencial por rate limit...\n')
const results = []
for (const t of TESTS) {
  console.log(`  → ${t.slug}…`)
  const r = await nanoBanana(t)
  results.push(r)
  if (r.error) console.log(`    ✗ ${r.error}`)
  else console.log(`    ✓ ${r.kb} KB en ${(r.ms/1000).toFixed(1)}s → ${r.path}`)
  if (t !== TESTS[TESTS.length - 1]) await new Promise(r => setTimeout(r, 11000))
}
