/**
 * Cache de la home del kennel (`/kennels/[slug]`).
 *
 * Wrapping de las queries pesadas con `unstable_cache` para que se
 * reusen entre requests durante 120s. La página sigue siendo dinámica
 * (porque hace getUser() para detectar owner), pero la DATA pública
 * que pintamos se cachea en el edge → de ~1-2s a <50ms en visitas
 * repetidas.
 *
 * Usamos el admin client (service-role) porque:
 *  - `unstable_cache` no puede invocar `cookies()` (lo prohíbe Next).
 *  - Los datos servidos aquí son SIEMPRE públicos (web del criadero).
 *  - Acceso sin cookies → la response es realmente cacheable.
 *
 * Invalidación:
 *  - Tag `kennel-home:<id>` por kennel: revalidar al editar contenido.
 *  - Tag global `kennel-home` por seguridad.
 *
 * Si el admin client no está configurado (entornos sin
 * SUPABASE_SERVICE_ROLE_KEY) caemos al cliente normal pasado por
 * argumento. Necesario porque algunos entornos de dev sólo tienen anon.
 */
import { unstable_cache, revalidateTag } from 'next/cache'
import { createKennelAdminClient } from '@/lib/supabase/server'

/** Tag por kennel: usado para invalidar selectivamente el caché de UNA
 *  home cuando el dueño edita su contenido. Llamar a
 *  `revalidateKennelHome(kennelId)` desde cualquier server action que
 *  cambie about_md, dogs, photos, reviews, FAQ, posts… del kennel.
 *  Próxima visita ⇒ datos frescos de inmediato (no espera al TTL). */
export function kennelHomeTag(kennelId: string): string {
  return `kennel-home:${kennelId}`
}

/** Invalidación selectiva por kennel. Idempotente y barata. */
export function revalidateKennelHome(kennelId: string): void {
  revalidateTag(kennelHomeTag(kennelId))
}

export interface KennelHomeData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allDogs: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allLitters: any[]
  breedNames: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  faqEntries: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reviewsRaw: any[]
  ownerPlan: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentPosts: any[]
  // Set de user_ids que son "Cliente" (resuelto aquí para no
  // engordar el caller con otra query secuencial)
  clientUserIds: string[]
  // Kennel photos (galería + facilities) para los teasers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kennelPhotos: any[]
  // Conteo de fotos por dog_id — para el sort 3-tier de calidad de
  // presentación. Computado dentro del bloque cacheado para que la
  // query IN(dogIds) no penalice visitas repetidas.
  photoCount: Record<string, number>
}

/** Función pura que ejecuta TODAS las queries pesadas de la home del
 *  kennel. Se invoca dentro de `unstable_cache` con tag por-kennel. */
async function fetchKennelHomeData(
  kennelId: string,
  ownerId: string | null,
  breedIds: string[] | null,
): Promise<KennelHomeData> {
    const supabase = createKennelAdminClient()

    const [
      allDogsRes,
      allLittersRes,
      breedsRes,
      faqRes,
      ownerProfileRes,
      reviewsRes,
      postsRes,
      kennelPhotosRes,
    ] = await Promise.all([
      supabase
        .from('dogs')
        // Quitado dog_photos count — sort usa thumbnail_url binary check.
        // Incluimos DOS grupos: (1) perros NACIDOS aquí (kennel_id) visibles en la
        // web, y (2) perros que el DUEÑO posee y ha marcado como reproductores
        // (semental/hembra comprado a otro criadero). Sin el grupo (2), un
        // reproductor externo (kennel_id = criadero de origen) no salía en la web
        // pública —solo en /c—. Caso real: "Sirio de l'Argenteria" en El Nieto.
        .select('id, slug, name, sex, thumbnail_url, owner_id, kennel_id, is_reproductive, is_for_sale, sale_price, sale_currency, sale_location, featured_in_home, breed:breeds(name)')
        .or(
          ownerId
            ? `and(kennel_id.eq.${kennelId},or(show_in_kennel.is.null,show_in_kennel.eq.true)),and(owner_id.eq.${ownerId},is_reproductive.eq.true,show_in_kennel.eq.true)`
            : `and(kennel_id.eq.${kennelId},or(show_in_kennel.is.null,show_in_kennel.eq.true))`,
        )
        .order('name'),
      ownerId
        ? supabase
          .from('litters')
          .select('id, status, birth_date, mating_date, breed:breeds(name), father:dogs!litters_father_id_fkey(id, name, thumbnail_url), mother:dogs!litters_mother_id_fkey(id, name, thumbnail_url)')
          .eq('owner_id', ownerId)
          .eq('show_in_kennel', true)
          .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      breedIds && breedIds.length > 0
        ? supabase.from('breeds').select('id, name').in('id', breedIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from('knowledge_entries')
        .select('id, title, content, category')
        .eq('kennel_id', kennelId)
        .eq('is_active', true)
        .order('position', { ascending: true })
        .limit(20),
      ownerId
        ? supabase.from('profiles').select('plan').eq('id', ownerId).single()
        : Promise.resolve({ data: null }),
      supabase
        .from('kennel_reviews')
        .select('id, author_name, body, rating, author_avatar_url, submitted_by_user_id, is_manual')
        .eq('kennel_id', kennelId)
        .eq('is_visible', true)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('kennel_posts')
        .select('id, slug, title, excerpt, cover_image_url, published_at, reading_time_minutes')
        .eq('kennel_id', kennelId)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(6),
      // Kennel photos solo de galería (para teasers). Antes era una query
      // secuencial dentro del Pro path; ahora va en paralelo y se cachea.
      supabase
        .from('kennel_photos')
        .select('id, url, kind')
        .eq('kennel_id', kennelId)
        .eq('kind', 'gallery')
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
        .limit(20),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewsRaw = (reviewsRes.data || []) as any[]
    const submitterIds = Array.from(new Set(
      reviewsRaw
        .filter(r => !r.is_manual && r.submitted_by_user_id)
        .map(r => r.submitted_by_user_id as string),
    ))
    // Lookup secundario: reseñas → quién es Cliente (tiene reserva).
    // Solo se ejecuta si hay reseñas no-manual con submitter_id.
    // Paralelizado con el conteo de fotos para no encadenar awaits.
    const allDogs = allDogsRes.data || []
    const dogIds = (allDogs as Array<{ id: string }>).map(d => d.id)

    const [clientLookup, photosLookup] = await Promise.all([
      submitterIds.length > 0
        ? supabase
            .from('puppy_reservations')
            .select('owner_id')
            .eq('kennel_id', kennelId)
            .in('owner_id', submitterIds)
            .in('status', ['delivered', 'confirmed', 'paid', 'paid_in_full'])
        : Promise.resolve({ data: [] as Array<{ owner_id: string }> }),
      dogIds.length > 0
        ? supabase
            .from('dog_photos')
            .select('dog_id')
            .in('dog_id', dogIds)
        : Promise.resolve({ data: [] as Array<{ dog_id: string }> }),
    ])

    const clientUserIds: string[] = []
    const seen = new Set<string>()
    for (const r of (clientLookup.data || []) as Array<{ owner_id: string }>) {
      if (r.owner_id && !seen.has(r.owner_id)) {
        seen.add(r.owner_id)
        clientUserIds.push(r.owner_id)
      }
    }

    // Conteo de fotos por dog_id para el sort 3-tier de calidad
    const photoCount: Record<string, number> = {}
    for (const p of (photosLookup.data || []) as Array<{ dog_id: string }>) {
      photoCount[p.dog_id] = (photoCount[p.dog_id] || 0) + 1
    }

    return {
      allDogs,
      allLitters: allLittersRes.data || [],
      breedNames: (breedsRes.data || []).map((b: { name: string }) => b.name),
      faqEntries: faqRes.data || [],
      reviewsRaw,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ownerPlan: (ownerProfileRes.data as any)?.plan || null,
      recentPosts: postsRes.data || [],
      clientUserIds,
      kennelPhotos: kennelPhotosRes.data || [],
      photoCount,
    }
}

/** Wrapper público: envuelve `fetchKennelHomeData` en `unstable_cache`
 *  con tag por-kennel para invalidación selectiva.
 *
 *  Patrón: cada request construye su propio wrapper de cache. La
 *  caché underlying se reusa porque las `keyParts` incluyen el
 *  kennelId — peticiones distintas con mismo kennelId obtienen la
 *  misma entry. El overhead de crear el closure es despreciable.
 *
 *  Tag dinámico es necesario porque `unstable_cache.options.tags`
 *  no admite valores variables — los recibe del closure exterior. */
export async function getKennelHomeData(
  kennelId: string,
  ownerId: string | null,
  breedIds: string[] | null,
): Promise<KennelHomeData> {
  const cachedFn = unstable_cache(
    () => fetchKennelHomeData(kennelId, ownerId, breedIds),
    ['kennel-home-data-v2', kennelId],
    {
      revalidate: 120, // 2 min — TTL "por si acaso" (la invalidación
                       // por tag debería cubrir los cambios reales)
      tags: [kennelHomeTag(kennelId), 'kennel-home'],
    },
  )
  return cachedFn()
}
