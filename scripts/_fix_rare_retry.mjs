import { readFile, writeFile, stat, mkdir } from 'fs/promises'
const REP = process.env.REPLICATE_API_TOKEN

const accuracy = JSON.parse(await readFile('/tmp/ai-accuracy-results.json', 'utf-8'))
const breeds = JSON.parse(await readFile('/tmp/breeds-to-generate.json', 'utf-8'))
const breedBySlug = new Map(breeds.map(b => [b.slug, b]))
const OUT_DIR = '/tmp/new-breed-photos-v2'
await mkdir(OUT_DIR, { recursive: true })

async function exists(p) { try { await stat(p); return true } catch { return false } }
const todo = []
for (const r of accuracy.filter(x => x.decision === 'KEEP_OLD' || x.decision === 'REVIEW')) {
  const b = breedBySlug.get(r.slug)
  if (!b) continue
  if (await exists(`${OUT_DIR}/${b.slug}.png`)) continue
  todo.push(b)
}
console.log(`Pendientes retry: ${todo.length}`)

async function tryOne(b, attempt = 1) {
  const prompt = `Transform this photo into a professional full-body studio-style portrait of the exact same dog breed (${b.name}). CRITICAL: keep the dog's breed characteristics, anatomy, head shape, coat type, color and pattern IDENTICAL to the reference image. ONLY change setting: clean neutral outdoor background (grass meadow), ENTIRE dog visible standing in show stance, Canon EOS R5 50mm f/2.8, soft overcast natural light. NO people, leashes, collars or branding. Square 1:1.`
  const r = await fetch('https://api.replicate.com/v1/models/google/nano-banana/predictions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${REP}`, 'Content-Type': 'application/json', Prefer: 'wait' },
    body: JSON.stringify({ input: { prompt, image_input: [b.current_image_url], output_format: 'png' } }),
  })
  if (r.status === 429) {
    if (attempt > 8) return { error: '429 max retries' }
    const txt = await r.text()
    const m = txt.match(/resets in ~?(\d+)s/)
    const wait = (m ? parseInt(m[1]) : 11) * 1000 + 2000
    console.log(`  ⏸ ${b.slug}: 429, espero ${wait/1000}s (attempt ${attempt})`)
    await new Promise(r => setTimeout(r, wait))
    return tryOne(b, attempt + 1)
  }
  if (!r.ok) return { error: `HTTP ${r.status}` }
  const j = await r.json()
  if (j.status !== 'succeeded') return { error: `status=${j.status}` }
  const url = Array.isArray(j.output) ? j.output[0] : j.output
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  await writeFile(`${OUT_DIR}/${b.slug}.png`, buf)
  return { kb: Math.round(buf.length / 1024) }
}

for (const b of todo) {
  console.log(`→ ${b.name}…`)
  const r = await tryOne(b)
  if (r.error) console.log(`  ✗ ${r.error}`)
  else console.log(`  ✓ ${r.kb}KB`)
  // espera prudencial entre tareas
  await new Promise(r => setTimeout(r, 12000))
}
console.log('\nDone')
