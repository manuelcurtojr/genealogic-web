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
 * GET /api/v1/admin/users
 *
 * Lista TODOS los usuarios de Genealogic con datos cruzados:
 *   - profile (display_name, email, role, country, status, created_at)
 *   - kennel asociado si lo tiene (un usuario puede ser owner de 1 kennel)
 *   - last_sign_in_at desde auth.users (para detectar usuarios activos vs latentes)
 *
 * Auth: PAWDOQ_ADMIN_API_KEY (Bearer).
 *
 * Query params:
 *   - limit: default 100, max 500
 *   - offset: default 0
 *   - q: busca en display_name, email
 *   - role: filtrar por rol (owner, breeder, admin)
 *   - country: ISO-3166
 */
export async function GET(request: NextRequest) {
  const auth = authenticatePawdoqAdmin(request)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500)
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const q = (url.searchParams.get('q') || '').trim()
  const role = (url.searchParams.get('role') || '').trim()
  const country = (url.searchParams.get('country') || '').trim().toUpperCase()

  const supabase = getAdminSupabase()

  // 1. Profiles paginados
  let query = supabase
    .from('profiles')
    .select(
      `id, display_name, email, role, country, status, created_at, updated_at`,
      { count: 'exact' }
    )

  if (q) {
    query = query.or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
  }
  if (role) query = query.eq('role', role)
  if (country) query = query.eq('country', country)

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: profiles, error, count } = await query
  if (error) return adminJsonResponse({ error: error.message }, 500)

  const userIds = (profiles ?? []).map((p) => p.id as string)
  if (userIds.length === 0) {
    return adminJsonResponse({
      data: [],
      pagination: { total: count ?? 0, limit, offset },
    })
  }

  // 2. Kennels asociados a estos owners (un user puede ser owner de varios
  //    kennels en teoría, pero típicamente uno).
  const { data: kennels } = await supabase
    .from('kennels')
    .select('id, slug, name, owner_id, country')
    .in('owner_id', userIds)

  const kennelsByOwner = new Map<string, Array<{ id: string; slug: string; name: string; country: string | null }>>()
  for (const k of (kennels ?? []) as Array<{ id: string; slug: string; name: string; owner_id: string; country: string | null }>) {
    const list = kennelsByOwner.get(k.owner_id) ?? []
    list.push({ id: k.id, slug: k.slug, name: k.name, country: k.country })
    kennelsByOwner.set(k.owner_id, list)
  }

  // 3. last_sign_in_at desde auth.users (paralelo, fire-and-forget si falla
  //    no rompemos la respuesta)
  const lastSignInById = new Map<string, string | null>()
  const lookups = userIds.map(async (id) => {
    try {
      const { data } = await supabase.auth.admin.getUserById(id)
      lastSignInById.set(id, data?.user?.last_sign_in_at ?? null)
    } catch {
      lastSignInById.set(id, null)
    }
  })
  await Promise.all(lookups)

  // 4. Email fallback desde auth si profiles.email está vacío
  for (const id of userIds) {
    const profile = profiles?.find((p) => p.id === id)
    if (!profile?.email) {
      try {
        const { data } = await supabase.auth.admin.getUserById(id)
        if (data?.user?.email && profile) {
          profile.email = data.user.email
        }
      } catch {
        // ignore
      }
    }
  }

  // 5. Combinamos
  const result = (profiles ?? []).map((p) => ({
    id: p.id,
    display_name: (p.display_name as string | null) ?? null,
    email: (p.email as string | null) ?? null,
    role: (p.role as string | null) ?? null,
    country: (p.country as string | null) ?? null,
    status: (p.status as string | null) ?? null,
    created_at: p.created_at,
    updated_at: p.updated_at ?? null,
    last_sign_in_at: lastSignInById.get(p.id as string) ?? null,
    kennels: kennelsByOwner.get(p.id as string) ?? [],
  }))

  return adminJsonResponse({
    data: result,
    pagination: { total: count ?? 0, limit, offset },
  })
}
