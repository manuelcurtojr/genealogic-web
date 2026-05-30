/**
 * Genera 5 fotos de razas famosas con GPT-Image-1 (OpenAI Images API).
 * Las guarda en /tmp/test-breeds/{slug}.png para que el usuario las valide
 * ANTES de subir a Supabase y reemplazar las fotos actuales.
 */
import { writeFile } from 'fs/promises'

const KEY = process.env.OPENAI_API_KEY
if (!KEY) { console.error('Falta OPENAI_API_KEY'); process.exit(1) }

const TESTS = [
  {
    slug: 'pastor-aleman',
    prompt:
      'Foto cuadrada hiper realista de un Pastor Aleman adulto en postura de exposicion canina. Capa color negro y fuego (black & tan) clasica, orejas erguidas grandes, expresion alerta y noble, cuerpo musculoso y elegante con linea superior ligeramente descendente caracteristica de la raza. Fondo de pradera verde con arboles desenfocados. Luz natural dia nublado, profundidad de campo poca, fotografia profesional de perro.',
  },
  {
    slug: 'bulldog-frances',
    prompt:
      'Foto cuadrada hiper realista de un Bulldog Frances adulto de pie sobre cesped. Pelaje color atigrado oscuro, orejas de murcielago erguidas y redondeadas, cara braquicefalica caracteristica, cuerpo compacto y musculoso. Expresion alegre y curiosa. Fondo de parque urbano desenfocado. Luz natural dia nublado, fotografia profesional de perro.',
  },
  {
    slug: 'golden-retriever',
    prompt:
      'Foto cuadrada hiper realista de un Golden Retriever adulto de pie en postura natural. Pelaje dorado largo y sedoso, abundantes plumas en patas y cola, expresion amistosa caracteristica de la raza. Cuerpo atletico y elegante. Fondo de campo con arboles desenfocados. Luz natural dia nublado, profundidad de campo poca, fotografia profesional de perro.',
  },
  {
    slug: 'labrador-retriever',
    prompt:
      'Foto cuadrada hiper realista de un Labrador Retriever adulto color negro azabache, de pie en postura natural. Pelaje corto, denso y brillante, cola de nutria caracteristica, expresion inteligente y noble. Cuerpo atletico musculoso. Fondo de bosque desenfocado. Luz natural dia nublado, fotografia profesional de perro.',
  },
  {
    slug: 'husky-siberiano',
    prompt:
      'Foto cuadrada hiper realista de un Husky Siberiano adulto de pie en postura natural alerta. Capa doble densa color blanco y gris lobo con mascara facial caracteristica, ojos azul brillante, orejas triangulares erguidas, cola peluda enroscada. Fondo de pradera con vegetacion desenfocada. Luz natural dia nublado, fotografia profesional de perro.',
  },
]

async function generateOne({ slug, prompt }) {
  const t0 = Date.now()
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    }),
  })
  if (!r.ok) {
    const body = await r.text()
    return { slug, error: `HTTP ${r.status}: ${body.slice(0, 300)}`, ms: Date.now() - t0 }
  }
  const j = await r.json()
  const b64 = j.data?.[0]?.b64_json
  if (!b64) return { slug, error: 'no b64_json in response', ms: Date.now() - t0 }
  const buf = Buffer.from(b64, 'base64')
  const path = `/tmp/test-breeds/${slug}.png`
  await writeFile(path, buf)
  return { slug, path, kb: Math.round(buf.length / 1024), ms: Date.now() - t0 }
}

console.log(`Generando ${TESTS.length} imagenes en paralelo (GPT-Image-1 high quality)...\n`)
const results = await Promise.all(TESTS.map(generateOne))

console.log('\nResultados:')
let totalKb = 0
for (const r of results) {
  if (r.error) console.log(`  ✗ ${r.slug.padEnd(22)} ERROR: ${r.error}`)
  else {
    console.log(`  ✓ ${r.slug.padEnd(22)} ${String(r.kb).padStart(5)} KB  ${r.ms / 1000}s  ${r.path}`)
    totalKb += r.kb
  }
}
console.log(`\nTotal: ${(totalKb / 1024).toFixed(1)} MB`)
console.log(`Coste estimado: $${(TESTS.length * 0.167).toFixed(2)} (5 imgs × $0.167 high quality)`)
