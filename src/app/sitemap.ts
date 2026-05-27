import { createClient } from '@supabase/supabase-js'
import type { MetadataRoute } from 'next'
import { allPosts } from '@/content/blog'

// Sin esto, Next intenta prerender el sitemap en build time. Si las env
// vars de Supabase no están disponibles localmente (caso normal con
// .env.local ausente), `createClient` lanza "supabaseUrl is required" y
// el build falla en la fase Export. force-dynamic le dice a Next que se
// genere en runtime — en Vercel sí tiene las vars y funciona perfecto.
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // cachea 1h en CDN para no hammerizar la DB

// Sharding: cada sitemap-N.xml lleva hasta SHARD_SIZE URLs de dogs.
// Google permite 50k/sitemap; usamos 40k para dar margen. Con shards 0-9
// cubrimos hasta 400k dogs sin tocar nada.
const SHARD_SIZE = 40000
const MAX_SHARDS = 10

/** Detecta si estamos en la fase de build de Next.
 *  Durante "Collecting page data", Next invoca igualmente las rutas dinámicas
 *  para resolver metadata. Si la query a Supabase es lenta (caso real:
 *  tabla dogs con 70k+ filas), el build se va a SIGTERM por timeout de 60s
 *  por worker.
 *  Devolvemos respuestas vacías/mínimas durante el build y delegamos toda
 *  la generación al runtime — con force-dynamic + revalidate=3600 la
 *  primera request en producción regenera el sitemap real y queda en CDN. */
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

export async function generateSitemaps() {
  // En build devolvemos siempre los 10 shards sin consultar la BD.
  // Si algún shard queda vacío en runtime, Google se lo come bien.
  if (isBuildPhase) {
    return Array.from({ length: MAX_SHARDS }, (_, i) => ({ id: i }))
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [{ id: 0 }]
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
  const { count } = await supabase
    .from('dogs')
    .select('*', { count: 'exact', head: true })
    .not('slug', 'is', null)
  const total = count ?? 0
  // Shard 0 = static + blog + kennels + breeds + first SHARD_SIZE dogs.
  // Shards 1..N = remaining dogs in chunks of SHARD_SIZE.
  const dogShards = Math.min(MAX_SHARDS, Math.max(1, Math.ceil(total / SHARD_SIZE)))
  return Array.from({ length: dogShards }, (_, i) => ({ id: i }))
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  // Build: respuesta mínima (sólo static en shard 0) — todo lo demás se
  // resuelve en runtime para no bloquear el deploy.
  if (isBuildPhase) {
    return id === 0 ? staticEntries() : []
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return id === 0 ? staticEntries() : []
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const entries: MetadataRoute.Sitemap = []

  // Shard 0 carga estáticos + blog + breeds + kennels además del primer chunk de dogs
  if (id === 0) {
    entries.push(...staticEntries())

    // Blog posts
    for (const { meta } of allPosts) {
      entries.push({
        url: `https://genealogic.io/blog/${meta.slug}`,
        lastModified: new Date(meta.date),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }

    // NOTA: no incluimos /breeds/* porque esa ruta no existe en el frontend
    // (las razas se navegan vía /search?breed=X). Si en el futuro se añade
    // /breeds/[slug], descomentar la sección.

    // All kennels with slugs (~3500 hoy, cabe en un solo shard)
    const { data: kennels } = await supabase
      .from('kennels')
      .select('slug, updated_at')
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10000)
    for (const k of (kennels || [])) {
      entries.push({
        url: `https://genealogic.io/kennels/${k.slug}`,
        lastModified: k.updated_at ? new Date(k.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  }

  // Cada shard (incluido el 0) lleva su chunk de dogs
  const from = id * SHARD_SIZE
  const to = from + SHARD_SIZE - 1
  const { data: dogs } = await supabase
    .from('dogs')
    .select('slug, updated_at')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .range(from, to)

  for (const dog of (dogs || [])) {
    entries.push({
      url: `https://genealogic.io/dogs/${dog.slug}`,
      lastModified: dog.updated_at ? new Date(dog.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  return entries
}

function staticEntries(): MetadataRoute.Sitemap {
  return [
    { url: 'https://genealogic.io', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: 'https://genealogic.io/search', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://genealogic.io/kennels', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://genealogic.io/blog', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://genealogic.io/privacy', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: 'https://genealogic.io/terms', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: 'https://genealogic.io/legal', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]
}
