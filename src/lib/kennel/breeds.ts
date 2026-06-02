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
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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
 * Devuelve los NOMBRES de las razas distintas que el kennel cría activamente
 * (reproductores públicos), ordenados alfabéticamente. A diferencia de
 * getKennelReproductiveBreeds NO filtra por promotional_content — aquí
 * queremos TODAS las razas de los reproductores para poblar el selector del
 * formulario de contacto público (así el criador sabe por qué raza preguntan
 * los leads).
 *
 * Acepta el cliente supabase por parámetro para reusar el que ya tenga el
 * server component que llama (createClient de @/lib/supabase/server).
 *
 * Filtra por:
 *   - dogs.kennel_id = X
 *   - dogs.is_reproductive = true
 *   - dogs.is_public = true
 *   - dogs.breed_id NOT NULL
 */
export async function getKennelReproductiveBreedNames(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  kennelId: string,
): Promise<string[]> {
  // 1. breed_id distintos de los reproductores públicos.
  const { data: dogs } = await supabase
    .from('dogs')
    .select('breed_id')
    .eq('kennel_id', kennelId)
    .eq('is_reproductive', true)
    .eq('is_public', true)
    .not('breed_id', 'is', null)

  const breedIds = Array.from(new Set((dogs || []).map((d) => d.breed_id))) as string[]
  if (breedIds.length === 0) return []

  // 2. Nombres de esas razas (SIN filtro de promotional_content), ordenados.
  const { data: breeds } = await supabase
    .from('breeds')
    .select('name')
    .in('id', breedIds)
    .order('name', { ascending: true })

  return (breeds || [])
    .map((b) => b.name as string | null)
    .filter((n): n is string => !!n)
}

/**
 * Devuelve la foto que debe representar a esta raza para este kennel.
 *
 * Orden de prioridad:
 *   1. Perro elegido manualmente por el criador en kennel_breed_hero
 *      (lo que configure en /dashboard/kennel/contenido/razas).
 *   2. Auto-fallback: un reproductor con foto (más representativo del
 *      programa de cría).
 *   3. Auto-fallback: cualquier perro del kennel de esa raza con foto.
 *   4. null → la página llamadora cae a la foto genérica de la raza.
 *
 * Solo devuelve perros con is_public=true (no exponemos perros ocultos
 * en el hero público del kennel).
 */
export async function pickKennelHeroPhotoForBreed(
  kennelId: string,
  breedId: string,
): Promise<{ url: string; dogName: string; dogSlug: string | null } | null> {
  const supabase = admin()

  // ── Prio 1: elección manual del criador ─────────────────────────────
  const { data: pick } = await supabase
    .from('kennel_breed_hero')
    .select('dog:dogs(name, slug, thumbnail_url, original_thumbnail_url, is_public)')
    .eq('kennel_id', kennelId)
    .eq('breed_id', breedId)
    .maybeSingle()
  type PickRow = { dog: { name: string; slug: string | null; thumbnail_url: string | null; original_thumbnail_url: string | null; is_public: boolean } | null }
  const pickedDog = (pick as PickRow | null)?.dog
  if (pickedDog && pickedDog.is_public && pickedDog.thumbnail_url) {
    return {
      url: pickedDog.original_thumbnail_url || pickedDog.thumbnail_url,
      dogName: pickedDog.name,
      dogSlug: pickedDog.slug,
    }
  }

  // ── Prio 2: reproductor con foto ────────────────────────────────────
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

  // ── Prio 3: cualquier perro del kennel de esa raza con foto ─────────
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
 * Lista los perros del kennel de una raza con foto, para el dropdown del
 * admin (UI donde el criador elige el hero). Devuelve solo públicos para
 * no ofrecer perros ocultos como hero visible.
 */
export async function listKennelDogsByBreedWithPhoto(
  kennelId: string,
  breedId: string,
): Promise<Array<{ id: string; name: string; sex: string | null; thumbnail_url: string; is_reproductive: boolean }>> {
  const supabase = admin()
  const { data } = await supabase
    .from('dogs')
    .select('id, name, sex, thumbnail_url, is_reproductive')
    .eq('kennel_id', kennelId)
    .eq('breed_id', breedId)
    .eq('is_public', true)
    .not('thumbnail_url', 'is', null)
    .order('is_reproductive', { ascending: false })
    .order('name', { ascending: true })
  type Row = { id: string; name: string; sex: string | null; thumbnail_url: string | null; is_reproductive: boolean }
  return ((data || []) as Row[])
    .filter((d): d is Row & { thumbnail_url: string } => !!d.thumbnail_url)
    .map((d) => ({
      id: d.id,
      name: d.name,
      sex: d.sex,
      thumbnail_url: d.thumbnail_url,
      is_reproductive: d.is_reproductive,
    }))
}

/**
 * Lee qué perro tiene marcado el kennel como hero de cada raza.
 * Devuelve un mapa breed_id → dog_id (o vacío si no hay registros).
 */
export async function getKennelBreedHeroMap(
  kennelId: string,
): Promise<Record<string, string>> {
  const supabase = admin()
  const { data } = await supabase
    .from('kennel_breed_hero')
    .select('breed_id, dog_id')
    .eq('kennel_id', kennelId)
  const map: Record<string, string> = {}
  for (const row of data || []) map[row.breed_id as string] = row.dog_id as string
  return map
}

/**
 * Guarda la elección del criador. Si dogId es null/undefined, borra el
 * registro y vuelve al fallback automático.
 */
export async function setKennelBreedHero(
  kennelId: string,
  breedId: string,
  dogId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = admin()

  if (!dogId) {
    const { error } = await supabase
      .from('kennel_breed_hero')
      .delete()
      .eq('kennel_id', kennelId)
      .eq('breed_id', breedId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  // Validar que el perro es realmente del kennel y de esa raza
  const { data: dog } = await supabase
    .from('dogs')
    .select('id')
    .eq('id', dogId)
    .eq('kennel_id', kennelId)
    .eq('breed_id', breedId)
    .maybeSingle()
  if (!dog) return { ok: false, error: 'El perro no pertenece a este kennel o no es de esa raza.' }

  const { error } = await supabase
    .from('kennel_breed_hero')
    .upsert(
      { kennel_id: kennelId, breed_id: breedId, dog_id: dogId, updated_at: new Date().toISOString() },
      { onConflict: 'kennel_id,breed_id' },
    )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
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
