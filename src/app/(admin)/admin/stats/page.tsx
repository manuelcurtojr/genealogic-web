/**
 * /admin/stats — panel completo de estadísticas de Genealogic.
 *
 * Diseño:
 *   1) Hero KPIs (users, dogs, kennels, plan pago, MRR estimado)
 *   2) Crecimiento mensual con delta % vs período anterior
 *   3) Conversion funnel del onboarding (signup → intent → kennel/dog → action)
 *   4) Planes & revenue
 *   5) Catálogo (dogs/kennels/breeds + estados de claim)
 *   6) Operaciones (claims & soporte: pending, resolved, tiempos)
 *   7) Engagement (Genos, page views, notifications, vet)
 *   8) Engagement por user (DAU/WAU/MAU)
 *   9) Top listas
 *
 * Usa admin client (service-role) para evitar RLS — esta página es admin-only
 * y necesita ver totales reales.
 */
import { createKennelAdminClient } from '@/lib/supabase/server'
import AdminStatsClient from '@/components/admin/admin-stats-client'

export const dynamic = 'force-dynamic'

// Precios mensuales asumidos (en EUR). Configurables aquí si cambian.
const PLAN_PRICES_EUR: Record<string, number> = {
  free: 0,
  starter: 19,
  pro: 49,
  premium: 99,
}

type Row = Record<string, unknown>

export default async function AdminStatsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const now = new Date()
  const iso30 = new Date(now.getTime() - 30 * 86400000).toISOString()
  const iso7 = new Date(now.getTime() - 7 * 86400000).toISOString()
  const iso1 = new Date(now.getTime() - 1 * 86400000).toISOString()

  // Disparamos TODO en paralelo — cada bloque es independiente y devuelve
  // counts o filas mínimas que agregamos en memoria.
  const fetchRows = async (table: string, select: string, gte?: { col: string; val: string }): Promise<Row[]> => {
    let q = admin.from(table).select(select)
    if (gte) q = q.gte(gte.col, gte.val)
    const { data } = await q
    return (data as Row[]) || []
  }

  const [
    profiles,
    dogs,
    kennels,
    litters,
    breeds,
    reservations,
    adminRequests,
    genosConvs,
    genosMsgs,
    notifications,
    pageViews30,
    kennelPages,
    vetRecords,
    emailbotThreads,
  ] = await Promise.all([
    fetchRows('profiles', 'id, role, plan, plan_is_founder, plan_started_at, country, onboarding_intent, last_sign_in_at, created_at'),
    fetchRows('dogs', 'id, sex, breed_id, kennel_id, owner_id, thumbnail_url, is_public, is_for_sale, is_reproductive, father_id, mother_id, imported_from, created_at'),
    fetchRows('kennels', 'id, owner_id, logo_url, custom_domain, country, default_public_view, created_at'),
    fetchRows('litters', 'id, status, created_at, owner_id'),
    fetchRows('breeds', 'id, name'),
    fetchRows('puppy_reservations', 'id, status, kennel_id, client_user_id, created_at'),
    fetchRows('admin_requests', 'id, type, status, priority, created_at, resolved_at'),
    fetchRows('genos_conversations', 'id, user_id, escalated_to_request_id, created_at'),
    fetchRows('genos_messages', 'id, role, tokens_in, tokens_out, created_at'),
    fetchRows('notifications', 'id, type, is_read, created_at'),
    fetchRows('page_views', 'id, created_at, kennel_id, dog_id', { col: 'created_at', val: iso30 }),
    fetchRows('kennel_pages', 'id, kennel_id, enabled'),
    fetchRows('vet_records', 'id, owner_id, created_at'),
    fetchRows('emailbot_threads', 'id, kennel_id, created_at'),
  ])

  // ─── HERO KPIs ───────────────────────────────────────────────────────────
  const usersTotal = profiles.length
  const usersLast30 = profiles.filter((p) => (p.created_at as string) >= iso30).length
  const usersPrev30 = profiles.filter((p) => {
    const c = p.created_at as string
    return c >= new Date(now.getTime() - 60 * 86400000).toISOString() && c < iso30
  }).length

  const dogsTotal = dogs.length
  const dogsLast30 = dogs.filter((d) => (d.created_at as string) >= iso30).length

  const kennelsTotal = kennels.length
  const kennelsClaimed = kennels.filter((k) => k.owner_id).length

  // Planes pagos (todo lo que no sea free)
  const paidUsers = profiles.filter((p) => p.plan && p.plan !== 'free')
  const planCounts: Record<string, number> = { free: 0, starter: 0, pro: 0, premium: 0 }
  for (const p of profiles) {
    const plan = (p.plan as string) || 'free'
    planCounts[plan] = (planCounts[plan] || 0) + 1
  }
  const mrrEur = Object.entries(planCounts).reduce(
    (acc, [plan, n]) => acc + n * (PLAN_PRICES_EUR[plan] || 0),
    0
  )

  // ─── CRECIMIENTO MENSUAL (12 meses) ──────────────────────────────────────
  function monthly(items: Row[], months: number) {
    const out: { month: string; count: number; cumulative: number }[] = []
    let cumulative = 0
    // Para acumulado correcto, contamos primero todo lo previo
    const cutoffStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
    cumulative = items.filter((it) => new Date(it.created_at as string) < cutoffStart).length
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const dNext = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const count = items.filter((it) => {
        const c = new Date(it.created_at as string)
        return c >= d && c < dNext
      }).length
      cumulative += count
      out.push({
        month: d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        count,
        cumulative,
      })
    }
    return out
  }
  const usersByMonth = monthly(profiles, 12)
  const dogsByMonth = monthly(dogs, 12)
  const kennelsByMonth = monthly(kennels, 12)
  const reservationsByMonth = monthly(reservations, 12)

  // ─── CONVERSION FUNNEL ───────────────────────────────────────────────────
  const funnelData = [
    { stage: 'Signup', value: usersTotal, pct: 100 },
    {
      stage: 'Eligió rol',
      value: profiles.filter((p) => p.onboarding_intent).length,
      pct: 0,
    },
    {
      stage: 'Con kennel o perro',
      value: new Set([
        ...kennels.filter((k) => k.owner_id).map((k) => k.owner_id),
        ...dogs.filter((d) => d.owner_id).map((d) => d.owner_id),
      ]).size,
      pct: 0,
    },
    {
      stage: 'Pago',
      value: paidUsers.length,
      pct: 0,
    },
  ].map((s) => ({ ...s, pct: usersTotal ? Math.round((s.value / usersTotal) * 100) : 0 }))

  // ─── DISTRIBUCIONES ──────────────────────────────────────────────────────
  const roleDistribution = [
    { name: 'Propietario', value: profiles.filter((p) => p.role === 'owner').length, color: '#6b7280' },
    { name: 'Criador', value: profiles.filter((p) => p.role === 'breeder').length, color: '#fb923c' },
    { name: 'Admin', value: profiles.filter((p) => p.role === 'admin').length, color: '#ef4444' },
  ]

  const intentDistribution = [
    { name: 'Criador', value: profiles.filter((p) => p.onboarding_intent === 'breeder').length, color: '#fb923c' },
    { name: 'Propietario', value: profiles.filter((p) => p.onboarding_intent === 'owner').length, color: '#3b82f6' },
    { name: 'Sin elegir', value: profiles.filter((p) => !p.onboarding_intent).length, color: '#d1d5db' },
  ]

  const planDistribution = [
    { name: 'Free', value: planCounts.free, color: '#d1d5db' },
    { name: 'Starter', value: planCounts.starter || 0, color: '#3b82f6' },
    { name: 'Pro', value: planCounts.pro || 0, color: '#fb923c' },
    { name: 'Premium', value: planCounts.premium || 0, color: '#8b5cf6' },
  ]

  const sexDistribution = [
    { name: 'Machos', value: dogs.filter((d) => d.sex === 'male').length, color: '#017DFA' },
    { name: 'Hembras', value: dogs.filter((d) => d.sex === 'female').length, color: '#e84393' },
    { name: 'Sin definir', value: dogs.filter((d) => !d.sex).length, color: '#9ca3af' },
  ]

  const litterStatus = [
    { name: 'Planificada', value: litters.filter((l) => l.status === 'planned').length, color: '#9ca3af' },
    { name: 'En gestación', value: litters.filter((l) => l.status === 'mated').length, color: '#f59e0b' },
    { name: 'Nacida', value: litters.filter((l) => l.status === 'born').length, color: '#34d399' },
    { name: 'Entregada', value: litters.filter((l) => l.status === 'delivered').length, color: '#22c55e' },
  ]

  // ─── CLAIMS & SOPORTE ────────────────────────────────────────────────────
  const supportStats = {
    total: adminRequests.length,
    pending: adminRequests.filter((r) => r.status === 'pending').length,
    reviewing: adminRequests.filter((r) => r.status === 'reviewing').length,
    approved: adminRequests.filter((r) => r.status === 'approved').length,
    rejected: adminRequests.filter((r) => r.status === 'rejected').length,
    typeSupport: adminRequests.filter((r) => r.type === 'support').length,
    typeClaimDog: adminRequests.filter((r) => r.type === 'claim_dog').length,
    typeClaimKennel: adminRequests.filter((r) => r.type === 'claim_kennel').length,
    urgent: adminRequests.filter((r) => r.priority === 'urgent' && !['approved', 'rejected', 'cancelled'].includes(r.status as string)).length,
  }

  const resolved = adminRequests.filter((r) => r.resolved_at)
  const avgResolutionHours = resolved.length
    ? Math.round(
        resolved.reduce((acc, r) => {
          const a = new Date(r.created_at as string).getTime()
          const b = new Date(r.resolved_at as string).getTime()
          return acc + (b - a) / 3600000
        }, 0) / resolved.length
      )
    : 0

  // ─── ENGAGEMENT ──────────────────────────────────────────────────────────
  const dogsWithPhoto = dogs.filter((d) => d.thumbnail_url).length
  const dogsWithParents = dogs.filter((d) => d.father_id || d.mother_id).length
  const dogsForSale = dogs.filter((d) => d.is_for_sale).length
  const dogsPublic = dogs.filter((d) => d.is_public).length
  const dogsReproductive = dogs.filter((d) => d.is_reproductive).length
  const dogsImported = dogs.filter((d) => d.imported_from).length
  const dogsUnclaimed = dogs.filter((d) => !d.owner_id).length
  const kennelsUnclaimed = kennels.filter((k) => !k.owner_id).length
  const kennelsWithLogo = kennels.filter((k) => k.logo_url).length
  const kennelsWithDomain = kennels.filter((k) => k.custom_domain).length
  const kennelsWithPublishedWeb = new Set(
    kennelPages.filter((p) => p.enabled).map((p) => p.kennel_id)
  ).size

  // Genos
  const genosUserMsgs = genosMsgs.filter((m) => m.role === 'user').length
  const genosAssistantMsgs = genosMsgs.filter((m) => m.role === 'assistant').length
  const genosEscalated = genosConvs.filter((c) => c.escalated_to_request_id).length
  const genosTotalTokens = genosMsgs.reduce(
    (a, m) => a + ((m.tokens_in as number) || 0) + ((m.tokens_out as number) || 0),
    0
  )

  // Page views (último mes)
  const pvByDay: { day: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const count = pageViews30.filter((p) => (p.created_at as string)?.startsWith(key)).length
    pvByDay.push({ day: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), count })
  }

  // Active users (DAU/WAU/MAU según last_sign_in_at)
  const dau = profiles.filter((p) => p.last_sign_in_at && (p.last_sign_in_at as string) >= iso1).length
  const wau = profiles.filter((p) => p.last_sign_in_at && (p.last_sign_in_at as string) >= iso7).length
  const mau = profiles.filter((p) => p.last_sign_in_at && (p.last_sign_in_at as string) >= iso30).length

  // ─── TOPS ────────────────────────────────────────────────────────────────
  const breedCounts: Record<string, number> = {}
  dogs.forEach((d) => {
    const bid = d.breed_id as string | null
    if (bid) breedCounts[bid] = (breedCounts[bid] || 0) + 1
  })
  const topBreeds: { name: string; value: number }[] = Object.entries(breedCounts)
    .map(([id, count]) => ({
      name: (breeds.find((b) => b.id === id)?.name as string) || '?',
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Países: profiles.country
  const countryCounts: Record<string, number> = {}
  profiles.forEach((p) => {
    const c = p.country as string | null
    if (c) countryCounts[c] = (countryCounts[c] || 0) + 1
  })
  const topCountries = Object.entries(countryCounts)
    .map(([c, n]) => ({ name: c, value: n }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Top kennels: por número de perros (kennel_id en dogs)
  const kennelDogCount: Record<string, number> = {}
  dogs.forEach((d) => {
    const kid = d.kennel_id as string | null
    if (kid) kennelDogCount[kid] = (kennelDogCount[kid] || 0) + 1
  })
  const topKennels = Object.entries(kennelDogCount)
    .map(([id, count]) => {
      const k = kennels.find((x) => x.id === id)
      return { name: (k as Row)?.name as string || '—', id, value: count }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Necesito el nombre del kennel — re-fetch con nombre incluido (no lo seleccioné antes)
  // Lo arreglo en una segunda pasada ligera solo para los IDs top
  if (topKennels.length > 0) {
    const topIds = topKennels.map((k) => k.id)
    const { data: kennelNames } = await admin
      .from('kennels')
      .select('id, name')
      .in('id', topIds)
    const nameMap = new Map<string, string>(
      ((kennelNames || []) as { id: string; name: string }[]).map((k) => [k.id, k.name] as [string, string])
    )
    topKennels.forEach((k) => { k.name = nameMap.get(k.id) || '—' })
  }

  return (
    <AdminStatsClient
      hero={{
        usersTotal,
        usersLast30,
        usersPrev30,
        dogsTotal,
        dogsLast30,
        kennelsTotal,
        kennelsClaimed,
        paidUsersCount: paidUsers.length,
        mrrEur,
      }}
      growth={{
        usersByMonth,
        dogsByMonth,
        kennelsByMonth,
        reservationsByMonth,
      }}
      funnel={funnelData}
      distributions={{
        role: roleDistribution,
        intent: intentDistribution,
        plan: planDistribution,
        sex: sexDistribution,
        litterStatus,
      }}
      catalog={{
        dogsWithPhoto, dogsWithParents, dogsForSale, dogsPublic, dogsReproductive,
        dogsImported, dogsUnclaimed,
        kennelsUnclaimed, kennelsWithLogo, kennelsWithDomain, kennelsWithPublishedWeb,
        dogsTotal, kennelsTotal,
        breedsTotal: breeds.length,
        littersTotal: litters.length,
      }}
      operations={{
        supportStats,
        avgResolutionHours,
      }}
      engagement={{
        genosConvs: genosConvs.length,
        genosUserMsgs,
        genosAssistantMsgs,
        genosEscalated,
        genosTotalTokens,
        pageViews30: pageViews30.length,
        pvByDay,
        notifications30: notifications.filter((n) => (n.created_at as string) >= iso30).length,
        notificationsUnread: notifications.filter((n) => !n.is_read).length,
        vetRecordsTotal: vetRecords.length,
        emailbotThreads: emailbotThreads.length,
        dau, wau, mau,
      }}
      tops={{
        topBreeds,
        topCountries,
        topKennels,
      }}
    />
  )
}
