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
 * GET /api/v1/admin/overview
 *
 * Replica el dashboard admin de genealogic.io/admin (totales + últimos
 * usuarios + distribuciones por rol/sexo/país/raza/status) en una sola
 * llamada para que el super-admin de Pawdoq pueda renderizarlo sin
 * dispersar la lógica.
 *
 * Auth: PAWDOQ_ADMIN_API_KEY (Bearer).
 */
export async function GET(request: NextRequest) {
  const auth = authenticatePawdoqAdmin(request)
  if (!auth.ok) return auth.response

  const supabase = getAdminSupabase()

  // Totales (head:true → solo cuenta, sin traer filas)
  const [
    profilesCount,
    dogsCount,
    kennelsCount,
    littersCount,
    breedsCount,
    vetCount,
    apiKeysCount,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('dogs').select('id', { count: 'exact', head: true }),
    supabase.from('kennels').select('id', { count: 'exact', head: true }),
    supabase.from('litters').select('id', { count: 'exact', head: true }),
    supabase.from('breeds').select('id', { count: 'exact', head: true }),
    supabase.from('vet_reminders').select('id', { count: 'exact', head: true }).then(
      (r) => r,
      () => ({ count: 0 }),
    ),
    supabase
      .from('kennel_api_keys')
      .select('id', { count: 'exact', head: true })
      .is('revoked_at', null),
  ])

  // Últimos usuarios — para el panel "Recent users"
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, display_name, email, role, country, created_at')
    .order('created_at', { ascending: false })
    .limit(15)

  // Datos para distribuciones (full data — son agregados pequeños)
  const [profilesAll, dogsAll, littersAll] = await Promise.all([
    supabase.from('profiles').select('id, role, created_at, country'),
    supabase.from('dogs').select('id, sex, breed_id, created_at, is_public, is_for_sale'),
    supabase.from('litters').select('id, status, created_at'),
  ])

  const profiles = profilesAll.data ?? []
  const dogs = dogsAll.data ?? []
  const litters = littersAll.data ?? []

  // Distribución por rol
  const roleDistribution = countBy(profiles, 'role')
  // Distribución por sexo
  const sexDistribution = countBy(dogs, 'sex')
  // Distribución por país
  const countryDistribution = topN(countBy(profiles, 'country'), 10)
  // Status de camadas
  const litterStatusDistribution = countBy(litters, 'status')

  // Top razas (necesita lookup de nombres)
  const breedCounts: Record<string, number> = {}
  for (const d of dogs) {
    if (d.breed_id) breedCounts[d.breed_id as string] = (breedCounts[d.breed_id as string] ?? 0) + 1
  }
  const topBreedIds = Object.entries(breedCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)
  const { data: breedsData } = topBreedIds.length
    ? await supabase.from('breeds').select('id, name').in('id', topBreedIds)
    : { data: [] }
  const breedNameById: Record<string, string> = {}
  for (const b of (breedsData ?? []) as { id: string; name: string }[]) {
    breedNameById[b.id] = b.name
  }
  const topBreeds = topBreedIds.map((id) => ({
    breed_id: id,
    name: breedNameById[id] ?? 'Sin raza',
    count: breedCounts[id],
  }))

  // Series temporales — últimos 12 meses
  const usersByMonth = monthlyData(profiles, 12)
  const dogsByMonth = monthlyData(dogs, 12)
  const littersByMonth = monthlyData(litters, 12)

  // Activity stats: dogs created in last 7 / 30 days
  const now = Date.now()
  const last7 = now - 7 * 86400000
  const last30 = now - 30 * 86400000
  const dogsLast7 = dogs.filter((d) => new Date(d.created_at as string).getTime() > last7).length
  const dogsLast30 = dogs.filter((d) => new Date(d.created_at as string).getTime() > last30).length
  const usersLast7 = profiles.filter((p) => new Date(p.created_at as string).getTime() > last7).length
  const usersLast30 = profiles.filter((p) => new Date(p.created_at as string).getTime() > last30).length

  return adminJsonResponse({
    totals: {
      users: profilesCount.count ?? 0,
      dogs: dogsCount.count ?? 0,
      kennels: kennelsCount.count ?? 0,
      litters: littersCount.count ?? 0,
      breeds: breedsCount.count ?? 0,
      vet_reminders: vetCount.count ?? 0,
      pawdoq_api_keys: apiKeysCount.count ?? 0,
    },
    recent: {
      users_last_7d: usersLast7,
      users_last_30d: usersLast30,
      dogs_last_7d: dogsLast7,
      dogs_last_30d: dogsLast30,
    },
    recent_users: (recentUsers ?? []).map((u) => ({
      id: u.id,
      display_name: u.display_name ?? null,
      email: u.email ?? null,
      role: u.role ?? null,
      country: u.country ?? null,
      created_at: u.created_at,
    })),
    distributions: {
      roles: roleDistribution,
      dog_sex: sexDistribution,
      countries: countryDistribution,
      litter_status: litterStatusDistribution,
      top_breeds: topBreeds,
    },
    series: {
      users_by_month: usersByMonth,
      dogs_by_month: dogsByMonth,
      litters_by_month: littersByMonth,
    },
  })
}

// ── helpers ────────────────────────────────────────────────────────────

function countBy<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T,
): Array<{ value: string; count: number }> {
  const map: Record<string, number> = {}
  for (const r of rows) {
    const v = r[key]
    const k = (v == null || v === '') ? '—' : String(v)
    map[k] = (map[k] ?? 0) + 1
  }
  return Object.entries(map)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
}

function topN(arr: Array<{ value: string; count: number }>, n: number) {
  return arr.slice(0, n)
}

/**
 * Devuelve [{month: 'YYYY-MM', count}] de los últimos `months` meses
 * (incluyendo el actual), rellenando huecos con 0.
 */
function monthlyData<T extends { created_at: unknown }>(
  rows: T[],
  months: number,
): Array<{ month: string; count: number }> {
  const map: Record<string, number> = {}
  for (const r of rows) {
    const d = new Date(r.created_at as string)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    map[key] = (map[key] ?? 0) + 1
  }
  const out: Array<{ month: string; count: number }> = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    out.push({ month: key, count: map[key] ?? 0 })
  }
  return out
}
