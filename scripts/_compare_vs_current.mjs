/**
 * Compara cada nueva imagen IA contra la actual (Wikipedia) usando GPT-4o-mini con visión.
 * Output por raza: REPLACE / KEEP / REVIEW.
 *
 * Criterio: ¿cuál de las dos representa mejor el estándar de la raza?
 * - REPLACE: la nueva es claramente mejor o igualmente buena
 * - KEEP:    la actual es claramente mejor (raza rara que IA no reconoce)
 * - REVIEW:  no está claro, mostrar al usuario
 */
import { readFile, writeFile, stat } from 'fs/promises'

const OAI = process.env.OPENAI_API_KEY
if (!OAI) { console.error('Falta OPENAI_API_KEY'); process.exit(1) }

const NEW_DIR = '/tmp/new-breed-photos'
const breeds = JSON.parse(await readFile('/tmp/breeds-to-generate.json', 'utf-8'))

async function exists(p) { try { await stat(p); return true } catch { return false } }
async function imageToBase64(path) {
  const buf = await readFile(path)
  return `data:image/png;base64,${buf.toString('base64')}`
}

async function compare(breed) {
  const newPath = `${NEW_DIR}/${breed.slug}.png`
  if (!(await exists(newPath))) return { slug: breed.slug, skipped: 'no AI image generated yet' }
  if (!breed.current_image_url) return { slug: breed.slug, verdict: 'REPLACE', reason: 'no current image' }

  const newImg = await imageToBase64(newPath)

  const prompt = `Eres un experto en cinología y razas caninas. Te muestro DOS imágenes que pretenden representar a la raza "${breed.name}" (${breed.slug}).

IMAGE A (Wikipedia actual): la primera URL
IMAGE B (generada por IA, Nano Banana): la segunda imagen adjunta

Tu tarea: decidir cuál representa MEJOR el estándar oficial de la raza ${breed.name}. Criterios:
1. Fidelidad anatómica al estándar (proporciones, cabeza, cuerpo, manto)
2. Color/patrón típico de la raza
3. Calidad fotográfica y composición
4. Para razas raras: ¿la imagen A o B parece realmente esa raza o parece otro perro genérico?

Responde EXACTAMENTE con JSON válido sin markdown:
{"verdict":"REPLACE|KEEP|REVIEW","confidence":"high|medium|low","reason":"<una frase corta>"}

- REPLACE = la nueva (B) es claramente mejor o igual; reemplázala
- KEEP = la actual (A) es claramente mejor; no reemplazar
- REVIEW = es ambigua o ninguna se parece a la raza, requiere ojo humano`

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: breed.current_image_url, detail: 'low' } },
            { type: 'image_url', image_url: { url: newImg, detail: 'low' } },
          ],
        },
      ],
      max_tokens: 200,
      temperature: 0,
    }),
  })

  if (!r.ok) return { slug: breed.slug, error: `HTTP ${r.status}: ${(await r.text()).slice(0,200)}` }
  const j = await r.json()
  const content = j.choices?.[0]?.message?.content || ''
  try {
    const clean = content.replace(/```json\n?|```\n?/g, '').trim()
    const parsed = JSON.parse(clean)
    return { slug: breed.slug, ...parsed }
  } catch (e) {
    return { slug: breed.slug, error: `parse error: ${content.slice(0, 200)}` }
  }
}

// Solo procesar las que tienen imagen IA generada
const toProcess = []
for (const b of breeds) {
  if (await exists(`${NEW_DIR}/${b.slug}.png`)) toProcess.push(b)
}
console.log(`Razas con imagen IA disponible: ${toProcess.length}/${breeds.length}`)
console.log(`Comparando con concurrencia 8...\n`)

let done = 0, replace = 0, keep = 0, review = 0, errs = 0
const t0 = Date.now()
async function processItem(b) {
  const r = await compare(b)
  done++
  if (r.error || r.skipped) errs++
  else if (r.verdict === 'REPLACE') replace++
  else if (r.verdict === 'KEEP') keep++
  else if (r.verdict === 'REVIEW') review++
  const elapsed = ((Date.now() - t0) / 1000).toFixed(0)
  const status = r.error ? `ERR ${r.error.slice(0,40)}` :
                 r.skipped ? `SKIP ${r.skipped}` :
                 `${r.verdict} (${r.confidence}) ${(r.reason||'').slice(0,60)}`
  console.log(`[${String(done).padStart(3)}/${toProcess.length}] ${b.slug.padEnd(30)} ${status}  (${elapsed}s | R:${replace} K:${keep} ?:${review})`)
  return r
}

// Pool de 8 paralelos
const results = []
let idx = 0
async function runner() {
  while (idx < toProcess.length) {
    const i = idx++
    results.push(await processItem(toProcess[i]))
  }
}
await Promise.all(Array.from({ length: 8 }, runner))

await writeFile('/tmp/compare-results.json', JSON.stringify(results, null, 2))
console.log(`\n═══ DONE ═══`)
console.log(`REPLACE: ${replace}  (reemplazaremos por la IA)`)
console.log(`KEEP:    ${keep}     (mantenemos la actual)`)
console.log(`REVIEW:  ${review}   (revisar manualmente)`)
console.log(`Errors:  ${errs}`)
console.log(`\nResultados guardados en /tmp/compare-results.json`)
