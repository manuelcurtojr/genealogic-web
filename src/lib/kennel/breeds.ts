/**
 * Helpers para detectar las razas que cría un kennel.
 *
 * Las razas se infieren dinámicamente desde los perros marcados como
 * `is_reproductive = true` y `is_public = true`. El criador no necesita
 * configurar nada — basta con que tenga sus reproductores marcados.
 *
 * El filtro `promotional_content NOT NULL` evita listar razas para las
 * que aún no hemos redactado contenido marketing (sin él, la ficha
 * individual no tiene nada que enseñar).
 */
import { createClient } from '@supabase/supabase-js'

export type KennelBreedSummary = {
  id: string
  slug: string
  name: string
  image_url: string | null
  /** tagline del promotional_content (1 frase emocional) */
  tagline: string | null
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * Devuelve las razas únicas que el kennel está criando activamente.
 * Filtra por:
 *   - dogs.kennel_id = X
 *   - dogs.is_reproductive = true
 *   - dogs.is_public = true
 *   - breeds.promotional_content NOT NULL (sin contenido no se lista)
 */
export async function getKennelReproductiveBreeds(
  kennelId: string,
): Promise<KennelBreedSummary[]> {
  const supabase = admin()

  // 1. Obtenemos los breed_id distintos de los reproductores públicos.
  //    Usar SELECT con dedupe en memoria es más simple que un RPC dedicado
  //    para los volúmenes esperados (un kennel típico cría 1-3 razas).
  const { data: dogs } = await supabase
    .from('dogs')
    .select('breed_id')
    .eq('kennel_id', kennelId)
    .eq('is_reproductive', true)
    .eq('is_public', true)
    .not('breed_id', 'is', null)

  const breedIds = Array.from(new Set((dogs || []).map((d) => d.breed_id))) as string[]
  if (breedIds.length === 0) return []

  // 2. Cargar info de cada raza, SOLO las que tienen promotional_content.
  const { data: breeds } = await supabase
    .from('breeds')
    .select('id, slug, name, image_url, promotional_content')
    .in('id', breedIds)
    .not('promotional_content', 'is', null)
    .order('name', { ascending: true })

  return (breeds || []).map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    image_url: b.image_url,
    tagline: (b.promotional_content as { tagline?: string } | null)?.tagline || null,
  }))
}

/**
 * Devuelve la primera foto disponible de un perro del kennel de la raza
 * indicada (cualquier perro, no necesariamente reproductor — para tener
 * más material). Si el kennel no tiene fotos propias de esa raza, devuelve
 * null y la página debe caer a la foto genérica de la raza.
 *
 * Priorizamos perros con foto registrada por:
 *   1. Reproductores primero (más representativos del programa de cría)
 *   2. Públicos siempre
 *   3. Más recientes primero (la última foto subida suele ser la mejor)
 */
export async function pickKennelHeroPhotoForBreed(
  kennelId: string,
  breedId: string,
): Promise<{ url: string; dogName: string; dogSlug: string | null } | null> {
  const supabase = admin()

  // Pasada 1: reproductor con foto
  const { data: repro } = await supabase
    .from('dogs')
    .select('name, slug, thumbnail_url, original_thumbnail_url')
    .eq('kennel_id', kennelId)
    .eq('breed_id', breedId)
    .eq('is_reproductive', true)
    .eq('is_public', true)
    .not('thumbnail_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (repro && repro.thumbnail_url) {
    return {
      url: repro.original_thumbnail_url || repro.thumbnail_url,
      dogName: repro.name,
      dogSlug: repro.slug,
    }
  }

  // Pasada 2: cualquier perro del kennel de esa raza con foto
  const { data: anyDog } = await supabase
    .from('dogs')
    .select('name, slug, thumbnail_url, original_thumbnail_url')
    .eq('kennel_id', kennelId)
    .eq('breed_id', breedId)
    .eq('is_public', true)
    .not('thumbnail_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (anyDog && anyDog.thumbnail_url) {
    return {
      url: anyDog.original_thumbnail_url || anyDog.thumbnail_url,
      dogName: anyDog.name,
      dogSlug: anyDog.slug,
    }
  }

  return null
}

/**
 * ¿Este breed_id es realmente uno de los reproductores del kennel?
 * Usado para autorizar la ficha individual `/kennels/X/razas/[breed]` —
 * evita que cualquier persona genere URLs de razas que el kennel no cría.
 */
export async function isReproductiveBreedOfKennel(
  kennelId: string,
  breedSlug: string,
): Promise<boolean> {
  const supabase = admin()
  const { data: breed } = await supabase
    .from('breeds')
    .select('id')
    .eq('slug', breedSlug)
    .maybeSingle()
  if (!breed) return false

  const { count } = await supabase
    .from('dogs')
    .select('id', { count: 'exact', head: true })
    .eq('kennel_id', kennelId)
    .eq('breed_id', breed.id)
    .eq('is_reproductive', true)
    .eq('is_public', true)
  return (count || 0) > 0
}
