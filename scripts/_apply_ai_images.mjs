/**
 * Aplica los reemplazos aprobados:
 *  - USE_AI:   sube la nueva imagen IA a dog-photos/breeds/{slug}/main.png + actualiza BD
 *  - KEEP_OLD: no toca nada (deja Wikipedia)
 *  - REVIEW:   reporta para que el usuario decida manualmente
 *
 * Actualiza también image_attribution con la fuente correcta:
 *  "Imagen generada con IA (Nano Banana / Gemini 2.5 Flash Image) — referencial. Mayo 2026."
 */
import { readFile, stat } from 'fs/promises'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const NEW_DIR = '/tmp/new-breed-photos'
const ATTRIBUTION = 'Imagen generada con IA (Nano Banana / Gemini 2.5 Flash Image) — referencial. Mayo 2026.'

const accuracy = JSON.parse(await readFile('/tmp/ai-accuracy-results.json', 'utf-8'))
const breeds = JSON.parse(await readFile('/tmp/breeds-to-generate.json', 'utf-8'))
const breedById = new Map(breeds.map(b => [b.slug, b]))

const useAi = accuracy.filter(r => r.decision === 'USE_AI')
const keepOld = accuracy.filter(r => r.decision === 'KEEP_OLD')
const review = accuracy.filter(r => r.decision === 'REVIEW')
const errs = accuracy.filter(r => r.error || r.skipped)

console.log(`USE_AI:   ${useAi.length}   ← se aplica reemplazo`)
console.log(`KEEP_OLD: ${keepOld.length}   ← no se toca`)
console.log(`REVIEW:   ${review.length}   ← decisión manual`)
console.log(`Errors:   ${errs.length}\n`)

if (process.argv[2] !== '--apply') {
  console.log('DRY RUN. Para aplicar, ejecuta:  node scripts/_apply_ai_images.mjs --apply\n')
  console.log('Lista de KEEP_OLD (razas donde la IA no acertó):')
  keepOld.forEach(r => console.log(`  ${r.slug}: ${r.issue || '?'}`))
  console.log('\nLista de REVIEW (dudosas, requieren ojo humano):')
  review.forEach(r => console.log(`  ${r.slug}: ${r.issue || '?'}`))
  process.exit(0)
}

console.log('Aplicando reemplazos...\n')
let ok = 0, fail = 0
async function applyOne(r) {
  const slug = r.slug
  const newPath = `${NEW_DIR}/${slug}.png`
  try {
    const buf = await readFile(newPath)
    const objectPath = `breeds/${slug}/main.png`
    const { error: upErr } = await supabase.storage
      .from('dog-photos')
      .upload(objectPath, buf, { contentType: 'image/png', upsert: true, cacheControl: '31536000' })
    if (upErr) throw upErr
    const { data: pub } = supabase.storage.from('dog-photos').getPublicUrl(objectPath)
    const { error: dbErr } = await supabase
      .from('breeds')
      .update({ image_url: pub.publicUrl, image_attribution: ATTRIBUTION })
      .eq('slug', slug)
    if (dbErr) throw dbErr
    ok++
    if (ok % 10 === 0) console.log(`  [${ok}/${useAi.length}] ${slug}`)
  } catch (e) {
    fail++
    console.log(`  ✗ ${slug}: ${e.message}`)
  }
}

// Pool de 5 paralelos (uploads son rápidos, no saturamos)
let idx = 0
async function runner() {
  while (idx < useAi.length) {
    const i = idx++
    await applyOne(useAi[i])
  }
}
await Promise.all(Array.from({ length: 5 }, runner))

console.log(`\n═══ DONE ═══`)
console.log(`✓ Aplicadas: ${ok}`)
console.log(`✗ Fallidas:  ${fail}`)
console.log(`\nLas KEEP_OLD (${keepOld.length}) y REVIEW (${review.length}) quedan con su image_url actual.`)
console.log(`Las páginas /razas/[slug] usarán las nuevas en la próxima revalidación ISR (1h) o instantáneo con deploy.`)
