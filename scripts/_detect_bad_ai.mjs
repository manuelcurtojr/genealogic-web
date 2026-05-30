/**
 * NUEVO criterio: por defecto reemplazamos TODAS las razas por la IA.
 * Solo MANTENEMOS las actuales cuando la imagen IA claramente NO representa la raza
 * (modelo confundió la raza, generó perro genérico, anatomía completamente equivocada).
 *
 * Output por raza: USE_AI (defecto) / KEEP_OLD (IA claramente mala) / REVIEW (dudoso)
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

async function checkAccuracy(breed) {
  const newPath = `${NEW_DIR}/${breed.slug}.png`
  if (!(await exists(newPath))) return { slug: breed.slug, skipped: 'no AI image yet' }

  const newImg = await imageToBase64(newPath)
  const synonyms = (breed.name && Array.isArray(breed.synonyms) && breed.synonyms.length)
    ? ` (también conocida como: ${breed.synonyms.join(', ')})` : ''

  const prompt = `Eres un experto en cinología (razas caninas). Te muestro UNA imagen generada por IA que pretende representar la raza "${breed.name}"${synonyms}.

Tu ÚNICA tarea: ¿el perro de la imagen se parece RAZONABLEMENTE a la raza ${breed.name}, o es claramente otro perro / un perro genérico / anatomía equivocada?

Sé permisivo: si el perro tiene las características principales de la raza (tamaño aproximado, tipo de manto, forma de cabeza, color típico), responde true aunque no sea estándar perfecto de show.

Sé estricto solo cuando la IA claramente:
- Generó un perro de raza completamente distinta (ej. te pedí Galgo y salió Bulldog)
- Inventó anatomía imposible
- El perro no tiene NINGUNA de las características distintivas de ${breed.name}

Responde EXACTAMENTE JSON sin markdown:
{"is_accurate": true|false, "confidence": "high|medium|low", "issue": "<si false, qué falla en 1 frase>"}`

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: newImg, detail: 'low' } },
        ],
      }],
      max_tokens: 150,
      temperature: 0,
    }),
  })
  if (!r.ok) return { slug: breed.slug, error: `HTTP ${r.status}: ${(await r.text()).slice(0, 150)}` }
  const j = await r.json()
  const content = j.choices?.[0]?.message?.content || ''
  try {
    const clean = content.replace(/```json\n?|```\n?/g, '').trim()
    const parsed = JSON.parse(clean)
    const decision = parsed.is_accurate
      ? 'USE_AI'
      : (parsed.confidence === 'high' ? 'KEEP_OLD' : 'REVIEW')
    return { slug: breed.slug, decision, ...parsed }
  } catch (e) {
    return { slug: breed.slug, error: `parse error: ${content.slice(0, 150)}` }
  }
}

const toProcess = []
for (const b of breeds) {
  if (await exists(`${NEW_DIR}/${b.slug}.png`)) toProcess.push(b)
}
console.log(`Razas con imagen IA: ${toProcess.length}/${breeds.length}`)
console.log(`Detectando IA mala con concurrencia 8...\n`)

let done = 0, useAi = 0, keepOld = 0, review = 0, errs = 0
const t0 = Date.now()
async function processItem(b) {
  const r = await checkAccuracy(b)
  done++
  if (r.error || r.skipped) errs++
  else if (r.decision === 'USE_AI') useAi++
  else if (r.decision === 'KEEP_OLD') keepOld++
  else if (r.decision === 'REVIEW') review++
  const elapsed = ((Date.now() - t0) / 1000).toFixed(0)
  const status = r.error ? `ERR ${r.error.slice(0,40)}` :
                 r.skipped ? `SKIP` :
                 `${r.decision} (${r.confidence}) ${(r.issue||'').slice(0,55)}`
  console.log(`[${String(done).padStart(3)}/${toProcess.length}] ${b.slug.padEnd(30)} ${status}  (✓${useAi} ✗${keepOld} ?${review})`)
  return r
}

const results = []
let idx = 0
async function runner() {
  while (idx < toProcess.length) {
    const i = idx++
    results.push(await processItem(toProcess[i]))
  }
}
await Promise.all(Array.from({ length: 8 }, runner))

await writeFile('/tmp/ai-accuracy-results.json', JSON.stringify(results, null, 2))
console.log(`\n═══ DONE (${((Date.now()-t0)/1000).toFixed(0)}s) ═══`)
console.log(`USE_AI:   ${useAi}   (reemplazaremos por la IA)`)
console.log(`KEEP_OLD: ${keepOld}  (IA mala, mantenemos actual)`)
console.log(`REVIEW:   ${review}  (revisar manualmente)`)
console.log(`Errors:   ${errs}`)
console.log(`\nResultados → /tmp/ai-accuracy-results.json`)
