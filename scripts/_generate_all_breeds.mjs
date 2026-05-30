/**
 * Genera 246 imágenes de razas con Nano Banana en paralelo (o throttled si rate limit bajo).
 * - Resumable: skip las que ya existen
 * - Auto-throttle si 429: pausa y reintenta
 * - Log de progreso por raza
 */
import { readFile, writeFile, mkdir, stat } from 'fs/promises'

const REP = process.env.REPLICATE_API_TOKEN
if (!REP) { console.error('Falta REPLICATE_API_TOKEN'); process.exit(1) }
const OUT_DIR = '/tmp/new-breed-photos'
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '1', 10) // por defecto safe
const DELAY_MS = parseInt(process.env.DELAY_MS || '11000', 10)  // 11s entre requests si CONCURRENCY=1
await mkdir(OUT_DIR, { recursive: true })

const breeds = JSON.parse(await readFile('/tmp/breeds-to-generate.json', 'utf-8'))
async function exists(p) { try { await stat(p); return true } catch { return false } }

const pending = []
for (const b of breeds) {
  if (await exists(`${OUT_DIR}/${b.slug}.png`)) continue
  pending.push(b)
}
console.log(`Total: ${breeds.length}  Ya hechas: ${breeds.length - pending.length}  Pendientes: ${pending.length}`)
console.log(`Concurrencia: ${CONCURRENCY}, delay entre tareas si 1: ${DELAY_MS}ms\n`)

async function generateOne(b, attempt = 1) {
  try {
    const r = await fetch(
      'https://api.replicate.com/v1/models/google/nano-banana/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${REP}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({ input: { prompt: b.prompt, output_format: 'png' } }),
      },
    )
    if (r.status === 429) {
      const body = await r.text()
      const match = body.match(/resets in ~?(\d+)s/)
      const wait = match ? parseInt(match[1]) * 1000 + 1000 : 15000
      if (attempt > 5) return { slug: b.slug, error: `429 después de 5 reintentos` }
      console.log(`  ⏸ ${b.slug}: 429, esperando ${wait/1000}s (attempt ${attempt})`)
      await new Promise(r => setTimeout(r, wait))
      return generateOne(b, attempt + 1)
    }
    if (!r.ok) return { slug: b.slug, error: `HTTP ${r.status}: ${(await r.text()).slice(0, 100)}` }
    const j = await r.json()
    if (j.status !== 'succeeded') return { slug: b.slug, error: `status=${j.status}` }
    const url = Array.isArray(j.output) ? j.output[0] : j.output
    if (!url) return { slug: b.slug, error: 'no output url' }
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
    await writeFile(`${OUT_DIR}/${b.slug}.png`, buf)
    return { slug: b.slug, kb: Math.round(buf.length / 1024) }
  } catch (e) {
    return { slug: b.slug, error: e.message }
  }
}

let done = 0
const t0 = Date.now()
async function processItem(b) {
  const r = await generateOne(b)
  done++
  const elapsed = ((Date.now() - t0) / 1000).toFixed(0)
  const rate = (done / (elapsed || 1)).toFixed(2)
  const eta = Math.round((pending.length - done) / Math.max(0.01, parseFloat(rate)))
  const status = r.error ? `✗ ${r.error.slice(0, 50)}` : `✓ ${r.kb}KB`
  console.log(`[${String(done).padStart(3)}/${pending.length}] ${r.slug.padEnd(30)} ${status}  (${elapsed}s, ${rate}/s, ~${eta}s left)`)
  return r
}

const results = []
if (CONCURRENCY === 1) {
  // throttled secuencial con delay fijo
  for (const b of pending) {
    results.push(await processItem(b))
    await new Promise(r => setTimeout(r, DELAY_MS))
  }
} else {
  // pool paralelo
  let idx = 0
  async function runner() {
    while (idx < pending.length) {
      const i = idx++
      results.push(await processItem(pending[i]))
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, runner))
}

const ok = results.filter(r => !r.error)
const err = results.filter(r => r.error)
console.log(`\n═══ DONE ═══`)
console.log(`✓ Exitosas: ${ok.length}`)
console.log(`✗ Fallidas: ${err.length}`)
console.log(`Coste estimado: $${(ok.length * 0.039).toFixed(2)}`)
if (err.length) {
  console.log(`\nFallidas:`)
  err.forEach(e => console.log(`  ${e.slug}: ${e.error}`))
}
