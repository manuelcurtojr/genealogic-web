import { NextRequest } from 'next/server'
import {
  authenticatePawdoqAdmin,
  getAdminSupabase,
  adminCorsHeaders,
  adminJsonResponse,
} from '@/lib/pawdoq-admin-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: adminCorsHeaders })
}

/**
 * GET /api/v1/admin/kennels
 *
 * Lista TODOS los kennels de Genealogic con métricas agregadas.
 * Usado por el super-admin de Pawdoq para descubrir leads B2B de
 * Pawdoq Breeders.
 *
 * Auth: shared secret PAWDOQ_ADMIN_API_KEY (Bearer header).
 *
 * Query params:
 *   - limit: number (default 100, max 500)
 *   - offset: number (default 0)
 *   - q: string (opcional, busca en name + slug)
 *   - country: string (opcional, ISO-3166)
 *
 * Respuesta:
 *   {
 *     data: Array<{
 *       id, slug, name, country, city, foundation_date,
 *       owner_email, owner_full_name, created_at,
 *       dog_count, litter_count, last_dog_added_at,
 *       has_pawdoq_api_key: boolean,
 *       last_api_used_at: string | null,
 *     }>,
 *     pagination: { total, limit, offset }
 *   }
 *
 * Notas de rendimiento: hacemos count exact en kennels (barato con
 * índice) y el resto de stats en una sola pasada agregada por kennel
 * con joins. Para >5k kennels habría que mover esto a una vista
 * materializada; para los primeros miles vale así.
 */
export async function GET(request: NextRequest) {
  const auth = authenticatePawdoqAdmin(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500)
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const q = (url.searchParams.get('q') || '').trim()
  const country = (url.searchParams.get('country') || '').trim().toUpperCase()

  const supabase = getAdminSupabase()

  // 1. Página de kennels con datos básicos
  let query = supabase
    .from('kennels')
    .select(
      `id, slug, name, country, city, foundation_date, created_at, owner_id`,
      { count: 'exact' }
    )

  if (q) {
    // ilike contra name OR slug — usamos `.or()` para combinar
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
  }
  if (country) {
    query = query.eq('country', country)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: kennels, error, count } = await query
  if (error) return adminJsonResponse({ error: error.message }, 500)

  const kennelIds = (kennels ?? []).map((k) => k.id as string)
  if (kennelIds.length === 0) {
    return adminJsonResponse({
      data: [],
      pagination: { total: count ?? 0, limit, offset },
    })
  }

  // 1b. Profiles de los owners. Email puede estar en profiles.email o solo en
  //     auth.users (depende de cómo se haya creado el user). Hacemos primero
  //     el lookup en profiles y rellenamos los huecos desde auth.admin.
  const ownerIds = Array.from(
    new Set((kennels ?? []).map((k) => k.owner_id as string).filter(Boolean))
  )
  const profileById = new Map<string, { email: string | null; full_name: string | null }>()
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .in('id', ownerIds)
    for (const p of profiles ?? []) {
      profileById.set(p.id as string, {
        email: (p.email as string | null) ?? null,
        full_name: (p.display_name as string | null) ?? null,
      })
    }
    // Para los que no tienen email en profiles, lo buscamos en auth.users
    const missingEmail = ownerIds.filter(
      (id) => !profileById.get(id)?.email,
    )
    for (const userId of missingEmail) {
      try {
        const { data: u } = await supabase.auth.admin.getUserById(userId)
        if (u?.user?.email) {
          const cur = profileById.get(userId) ?? { email: null, full_name: null }
          profileById.set(userId, { ...cur, email: u.user.email })
        }
      } catch {
        // ignore — sin email simplemente
      }
    }
  }

  // 2. Stats agregados en queries paralelas: dogs, litters, api keys.
  //    Usamos count: 'exact' con head: true para no traer las filas.
  type CountRow = { kennel_id: string; n: number }
  const [dogCounts, litterCounts, apiKeys, lastDogs] = await Promise.all([
    supabase
      .from('dogs')
      .select('kennel_id', { count: 'exact', head: false })
      .in('kennel_id', kennelIds)
      .then((r) => bucketize(r.data ?? [], 'kennel_id')),
    supabase
      .from('litters')
      .select('kennel_id', { count: 'exact', head: false })
      .in('kennel_id', kennelIds)
      .then((r) => bucketize(r.data ?? [], 'kennel_id')),
    supabase
      .from('kennel_api_keys')
      .select('kennel_id, last_used_at, revoked_at')
      .in('kennel_id', kennelIds)
      .is('revoked_at', null)
      .then((r) => {
        const out = new Map<string, { has: boolean; last: string | null }>()
        for (const row of r.data ?? []) {
          const id = row.kennel_id as string
          const cur = out.get(id) ?? { has: false, last: null }
          cur.has = true
          const last = row.last_used_at as string | null
          if (last && (!cur.last || last > cur.last)) cur.last = last
          out.set(id, cur)
        }
        return out
      }),
    supabase
      .from('dogs')
      .select('kennel_id, created_at')
      .in('kennel_id', kennelIds)
      .order('created_at', { ascending: false })
      .then((r) => {
        const out = new Map<string, string>()
        for (const row of r.data ?? []) {
          const id = row.kennel_id as string
          if (!out.has(id)) out.set(id, row.created_at as string)
        }
        return out
      }),
  ])

  // 3. Combinamos
  const result = (kennels ?? []).map((k) => {
    const kennelId = k.id as string
    const owner = profileById.get(k.owner_id as string) ?? { email: null, full_name: null }
    const apiKeyInfo = apiKeys.get(kennelId)
    return {
      id: kennelId,
      slug: k.slug,
      name: k.name,
      country: k.country ?? null,
      city: k.city ?? null,
      foundation_date: k.foundation_date ?? null,
      owner_id: k.owner_id,
      owner_email: owner.email,
      owner_full_name: owner.full_name,
      created_at: k.created_at,
      dog_count: dogCounts.get(kennelId) ?? 0,
      litter_count: litterCounts.get(kennelId) ?? 0,
      last_dog_added_at: lastDogs.get(kennelId) ?? null,
      has_pawdoq_api_key: apiKeyInfo?.has ?? false,
      last_api_used_at: apiKeyInfo?.last ?? null,
    }
  })

  return adminJsonResponse({
    data: result,
    pagination: { total: count ?? 0, limit, offset },
  })
}

function bucketize<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T
): Map<string, number> {
  const out = new Map<string, number>()
  for (const r of rows) {
    const k = r[key] as string
    out.set(k, (out.get(k) ?? 0) + 1)
  }
  return out
}
