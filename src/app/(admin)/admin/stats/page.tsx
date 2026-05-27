/**
 * /admin/stats — usa la RPC admin_stats_snapshot() que agrega TODO server-side.
 *
 * Antes cargábamos arrays completos y contábamos en memoria → el cliente
 * Supabase trunca a 1000 filas, así que tablas grandes (dogs > 16k) daban
 * counts erróneos. Ahora toda la agregación es SQL — el cliente solo recibe
 * un JSON con números ya calculados.
 */
import { createClient } from '@/lib/supabase/server'
import AdminStatsClient from '@/components/admin/admin-stats-client'
import AdminStatsSprintC from '@/components/admin/admin-stats-sprint-c'

export const dynamic = 'force-dynamic'

// Precios mensuales asumidos (EUR). Configurables aquí si cambian.
// Nuevos planes (2026-05): kennel 29, kennel_pro 49 (Founder).
// Legacy aliases (starter/pro/premium) mapean al precio del plan equivalente.
const PLAN_PRICES_EUR: Record<string, number> = {
  free: 0,
  kennel: 29,
  kennel_pro: 49,
  starter: 29,   // legacy → kennel
  pro: 29,       // legacy → kennel
  premium: 49,   // legacy → kennel_pro (Founder)
}

type Snapshot = {
  hero: {
    users_total: number; users_last30: number; users_prev30: number
    dogs_total: number; dogs_last30: number
    kennels_total: number; kennels_claimed: number
    paid_users_count: number
  }
  plan_counts: { free: number; starter: number; pro: number; premium: number; kennel?: number; kennel_pro?: number }
  role: { owner: number; breeder: number; admin: number }
  intent: { breeder: number; owner: number; null_intent: number }
  sex: { male: number; female: number; unknown: number }
  litter: { planned: number; mated: number; born: number; delivered: number; total: number }
  catalog: {
    dogs_total: number; dogs_with_photo: number; dogs_with_parents: number
    dogs_for_sale: number; dogs_public: number; dogs_reproductive: number
    dogs_imported: number; dogs_unclaimed: number
    kennels_total: number; kennels_unclaimed: number
    kennels_with_logo: number; kennels_with_domain: number; kennels_with_published_web: number
    breeds_total: number; litters_total: number
  }
  ops: {
    total: number; pending: number; reviewing: number; approved: number; rejected: number
    type_support: number; type_claim_dog: number; type_claim_kennel: number
    urgent: number; avg_resolution_hours: number
  }
  engagement: {
    genos_convs: number; genos_user_msgs: number; genos_assistant_msgs: number
    genos_escalated: number; genos_total_tokens: number
    page_views_30: number; notifications_30: number; notifications_unread: number
    vet_records_total: number; emailbot_threads: number
    dau: number; wau: number; mau: number
  }
  funnel: { signup: number; chose_role: number; has_kennel_or_dog: number; paid: number }
  users_monthly: { month: string; count: number; cumulative: number }[]
  dogs_monthly: { month: string; count: number; cumulative: number }[]
  kennels_monthly: { month: string; count: number; cumulative: number }[]
  reservations_monthly: { month: string; count: number; cumulative: number }[]
  pv_daily: { day: string; count: number }[]
  top_breeds: { name: string; value: number }[] | null
  top_countries: { name: string; value: number }[] | null
  top_kennels: { name: string; value: number }[] | null
}

export default async function AdminStatsPage() {
  const supabase = await createClient()
  // Sprint C: cargamos las 4 RPC en paralelo (la original + las nuevas).
  // Si las nuevas fallan, no rompemos la page — degradamos a null.
  const [snapshotRes, funnelRes, cohortRes, revenueRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc('admin_stats_snapshot'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc('admin_funnel_detailed'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc('admin_cohort_retention'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc('admin_revenue_snapshot'),
  ])

  if (snapshotRes.error || !snapshotRes.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6">
        <p className="text-sm font-semibold text-red-900">No se pudieron cargar las estadísticas</p>
        <p className="text-xs text-red-700 mt-1">{snapshotRes.error?.message || 'Sin datos'}</p>
      </div>
    )
  }

  const s = snapshotRes.data as Snapshot
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const funnelDetailed = (funnelRes.data || null) as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cohortRetention = (cohortRes.data || []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const revenueSnap = (revenueRes.data || null) as any

  // MRR estimado a partir de plan_counts (incluye nuevos + legacy)
  const mrrEur =
    (s.plan_counts.kennel ?? 0) * PLAN_PRICES_EUR.kennel +
    (s.plan_counts.kennel_pro ?? 0) * PLAN_PRICES_EUR.kennel_pro +
    s.plan_counts.starter * PLAN_PRICES_EUR.starter +
    s.plan_counts.pro * PLAN_PRICES_EUR.pro +
    s.plan_counts.premium * PLAN_PRICES_EUR.premium

  // Funnel con %
  const funnelData = [
    { stage: 'Signup', value: s.funnel.signup, pct: 100 },
    { stage: 'Eligió rol', value: s.funnel.chose_role, pct: 0 },
    { stage: 'Con kennel o perro', value: s.funnel.has_kennel_or_dog, pct: 0 },
    { stage: 'Pago', value: s.funnel.paid, pct: 0 },
  ].map((row) => ({
    ...row,
    pct: s.funnel.signup > 0 ? Math.round((row.value / s.funnel.signup) * 100) : 0,
  }))

  const snapshotClient = (
    <AdminStatsClient
      hero={{
        usersTotal: s.hero.users_total,
        usersLast30: s.hero.users_last30,
        usersPrev30: s.hero.users_prev30,
        dogsTotal: s.hero.dogs_total,
        dogsLast30: s.hero.dogs_last30,
        kennelsTotal: s.hero.kennels_total,
        kennelsClaimed: s.hero.kennels_claimed,
        paidUsersCount: s.hero.paid_users_count,
        mrrEur,
      }}
      growth={{
        usersByMonth: s.users_monthly || [],
        dogsByMonth: s.dogs_monthly || [],
        kennelsByMonth: s.kennels_monthly || [],
        reservationsByMonth: s.reservations_monthly || [],
      }}
      funnel={funnelData}
      distributions={{
        role: [
          { name: 'Propietario', value: s.role.owner, color: '#6b7280' },
          { name: 'Criador', value: s.role.breeder, color: '#fb923c' },
          { name: 'Admin', value: s.role.admin, color: '#ef4444' },
        ],
        intent: [
          { name: 'Criador', value: s.intent.breeder, color: '#fb923c' },
          { name: 'Propietario', value: s.intent.owner, color: '#3b82f6' },
          { name: 'Sin elegir', value: s.intent.null_intent, color: '#d1d5db' },
        ],
        plan: [
          { name: 'Free', value: s.plan_counts.free, color: '#d1d5db' },
          { name: 'Kennel', value: (s.plan_counts.kennel ?? 0) + s.plan_counts.starter + s.plan_counts.pro, color: '#fb923c' },
          { name: 'Kennel Pro', value: (s.plan_counts.kennel_pro ?? 0) + s.plan_counts.premium, color: '#8b5cf6' },
        ],
        sex: [
          { name: 'Machos', value: s.sex.male, color: '#017DFA' },
          { name: 'Hembras', value: s.sex.female, color: '#e84393' },
          { name: 'Sin definir', value: s.sex.unknown, color: '#9ca3af' },
        ],
        litterStatus: [
          { name: 'Planificada', value: s.litter.planned, color: '#9ca3af' },
          { name: 'En gestación', value: s.litter.mated, color: '#f59e0b' },
          { name: 'Nacida', value: s.litter.born, color: '#34d399' },
          { name: 'Entregada', value: s.litter.delivered, color: '#22c55e' },
        ],
      }}
      catalog={{
        dogsTotal: s.catalog.dogs_total,
        dogsWithPhoto: s.catalog.dogs_with_photo,
        dogsWithParents: s.catalog.dogs_with_parents,
        dogsForSale: s.catalog.dogs_for_sale,
        dogsPublic: s.catalog.dogs_public,
        dogsReproductive: s.catalog.dogs_reproductive,
        dogsImported: s.catalog.dogs_imported,
        dogsUnclaimed: s.catalog.dogs_unclaimed,
        kennelsTotal: s.catalog.kennels_total,
        kennelsUnclaimed: s.catalog.kennels_unclaimed,
        kennelsWithLogo: s.catalog.kennels_with_logo,
        kennelsWithDomain: s.catalog.kennels_with_domain,
        kennelsWithPublishedWeb: s.catalog.kennels_with_published_web,
        breedsTotal: s.catalog.breeds_total,
        littersTotal: s.catalog.litters_total,
      }}
      operations={{
        supportStats: {
          total: s.ops.total,
          pending: s.ops.pending,
          reviewing: s.ops.reviewing,
          approved: s.ops.approved,
          rejected: s.ops.rejected,
          typeSupport: s.ops.type_support,
          typeClaimDog: s.ops.type_claim_dog,
          typeClaimKennel: s.ops.type_claim_kennel,
          urgent: s.ops.urgent,
        },
        avgResolutionHours: s.ops.avg_resolution_hours,
      }}
      engagement={{
        genosConvs: s.engagement.genos_convs,
        genosUserMsgs: s.engagement.genos_user_msgs,
        genosAssistantMsgs: s.engagement.genos_assistant_msgs,
        genosEscalated: s.engagement.genos_escalated,
        genosTotalTokens: s.engagement.genos_total_tokens,
        pageViews30: s.engagement.page_views_30,
        pvByDay: s.pv_daily || [],
        notifications30: s.engagement.notifications_30,
        notificationsUnread: s.engagement.notifications_unread,
        vetRecordsTotal: s.engagement.vet_records_total,
        emailbotThreads: s.engagement.emailbot_threads,
        dau: s.engagement.dau,
        wau: s.engagement.wau,
        mau: s.engagement.mau,
      }}
      tops={{
        topBreeds: s.top_breeds || [],
        topCountries: s.top_countries || [],
        topKennels: s.top_kennels || [],
      }}
    />
  )

  // Cuando exista contenido del Sprint C, lo renderizamos debajo de la
  // vista existente (no reemplaza nada — extiende). Funnel detallado +
  // cohort retention + revenue snapshot. Si las RPC nuevas fallan, los
  // sub-bloques se ocultan individualmente sin romper la página.
  return (
    <>
      {snapshotClient}
      <AdminStatsSprintC
        funnel={funnelDetailed}
        cohort={cohortRetention}
        revenue={revenueSnap}
      />
    </>
  )
}
