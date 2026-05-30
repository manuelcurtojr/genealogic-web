import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const [,, slug, filePath, attribution] = process.argv
if (!slug || !filePath) { console.error('uso: node _upload_breed_img.mjs <slug> <pathToImage> "<attribution>"'); process.exit(1) }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// El bucket de razas vimos que es "dog-photos" con path breeds/<slug>/main.jpg
// Mismo formato que el Presa Canario: dog-photos/breeds/presa-canario/main.jpg
const ext = filePath.toLowerCase().endsWith('.png') ? 'png' : 'jpg'
const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'
const objectPath = `breeds/${slug}/main.${ext}`

const fileBuf = readFileSync(filePath)
console.log(`Leído ${filePath} (${Math.round(fileBuf.length/1024)} KB), subiendo a dog-photos/${objectPath}…`)

const { error: upErr } = await supabase.storage
  .from('dog-photos')
  .upload(objectPath, fileBuf, { contentType, upsert: true, cacheControl: '31536000' })
if (upErr) { console.error('Upload error:', upErr); process.exit(1) }

const { data: pub } = supabase.storage.from('dog-photos').getPublicUrl(objectPath)
console.log(`✓ Subido: ${pub.publicUrl}`)

const { error: dbErr } = await supabase
  .from('breeds')
  .update({ image_url: pub.publicUrl, image_attribution: attribution || 'Imagen generada con IA — referencial' })
  .eq('slug', slug)
if (dbErr) { console.error('DB error:', dbErr); process.exit(1) }

console.log(`✓ breeds.image_url actualizado para slug=${slug}`)
console.log(`  attribution: ${attribution || 'Imagen generada con IA — referencial'}`)
