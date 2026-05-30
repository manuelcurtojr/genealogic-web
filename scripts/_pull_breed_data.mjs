import { createClient } from '@supabase/supabase-js'
import { writeFile } from 'fs/promises'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = await supabase
  .from('breeds')
  .select('id, slug, name, synonyms, standard_data, genealogic_standard, image_url')
  .order('name')

console.log(`Total razas: ${data.length}`)
console.log(`Con foto actual: ${data.filter(b => b.image_url).length}`)
console.log(`Sin foto actual: ${data.filter(b => !b.image_url).length}`)
console.log(`Con genealogic_standard: ${data.filter(b => b.genealogic_standard?.sections?.length).length}`)

// Construir prompt por raza
function buildPrompt(b) {
  const origin = b.standard_data?.origin || 'unknown origin'
  const sections = b.genealogic_standard?.sections || []
  const apariencia = sections.find(s => s.key === 'apariencia')?.content || ''
  const manto = sections.find(s => s.key === 'manto')?.content || ''
  const tamano = sections.find(s => s.key === 'tamano-peso')?.content || ''

  // Limpiar markdown y limitar longitud
  const clean = (s) => s.replace(/\*\*/g, '').replace(/\n+/g, ' ').slice(0, 300)

  const breedDesc = [apariencia, manto, tamano].filter(Boolean).map(clean).join(' ')

  return `FULL BODY photograph showing the ENTIRE ${b.name} dog from head to all four paws standing in profile or three-quarter view on natural ground. The whole dog is visible in frame, NOT a portrait, NOT cropped, NOT a headshot. A candid documentary image of an adult ${b.name} (${origin}) in standing show stance. ${breedDesc ? 'Breed characteristics: ' + breedDesc + ' ' : ''}Shot on Canon EOS R5 with 50mm f/2.8 lens, ISO 400, soft overcast natural light, real environmental depth NOT studio bokeh. Photojournalism style. Square 1:1 composition with the entire dog body visible from nose to tail to paws.`
}

const out = data.map(b => ({
  id: b.id,
  slug: b.slug,
  name: b.name,
  current_image_url: b.image_url,
  prompt: buildPrompt(b),
}))

await writeFile('/tmp/breeds-to-generate.json', JSON.stringify(out, null, 2))
console.log(`\n✓ Guardado /tmp/breeds-to-generate.json con ${out.length} entries`)
console.log('\nEjemplos de prompts:')
for (const s of ['presa-canario', 'pastor-aleman', 'lobo-herreno', 'galgo-italiano']) {
  const b = out.find(x => x.slug === s)
  if (b) console.log(`\n[${b.name}]\n${b.prompt.slice(0, 400)}...`)
}
