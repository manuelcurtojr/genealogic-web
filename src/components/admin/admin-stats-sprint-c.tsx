/**
 * Sección extendida del panel /admin/stats — Sprint C.
 *
 * 3 bloques nuevos que complementan al `admin-stats-client` original:
 *   1. Funnel detallado (8 stages con conversion %).
 *   2. Cohort retention por mes (signups × D7/D30/D60/D90 %).
 *   3. Revenue snapshot (paying users, MRR estimado, ARPU, churn).
 *
 * Server component — recibe los datos como props desde la page.
 */
import { TrendingUp, Activity, DollarSign, Users } from 'lucide-react'

interface FunnelStage {
  key: string
  label: string
  count: number
}

interface CohortRow {
  month: string
  signups: number
  d7: number
  d30: number
  d60: number
  d90: number
  d7_pct: number
  d30_pct: number
  d60_pct: number
  d90_pct: number
}

interface RevenueSnap {
  paying: { pro_count: number; kennel_count: number; paying_total: number }
  mrr_estimated_eur: number
  arpu_estimated_eur: number
  payments_30d: number
  payments_90d: number
  churn_30d: number
  churn_90d: number
  subscription_changes_30d: number
  mix_pct: { free: number; kennel: number; kennel_pro: number }
}

interface FunnelDetailed {
  stages: FunnelStage[]
  time_to: {
    first_kennel_hours: number | null
    first_dog_hours: number | null
    first_litter_hours: number | null
    first_paid_hours: number | null
  }
}

interface Props {
  funnel: FunnelDetailed | null
  cohort: CohortRow[]
  revenue: RevenueSnap | null
}

function pct(n: number, base: number): number {
  return base > 0 ? Math.round((n / base) * 1000) / 10 : 0
}

function hoursToHuman(h: number | null): string {
  if (h === null || h === undefined) return '—'
  if (h < 1) return `${Math.round(h * 60)} min`
  if (h < 48) return `${Math.round(h)} h`
  const days = h / 24
  if (days < 30) return `${Math.round(days)} d`
  const months = days / 30
  return `${months.toFixed(1)} m`
}

// Color de cell del cohort según % (heatmap muy básico)
function cohortCellBg(pct: number): string {
  if (pct >= 60) return 'bg-emerald-100 text-emerald-900'
  if (pct >= 40) return 'bg-emerald-50 text-emerald-700'
  if (pct >= 20) return 'bg-amber-50 text-amber-800'
  if (pct >= 5) return 'bg-rose-50 text-rose-700'
  return 'bg-surface-soft text-muted'
}

export default function AdminStatsSprintC({ funnel, cohort, revenue }: Props) {
  return (
    <div className="space-y-8 mt-12">
      {/* ─── Funnel detallado ─────────────────────────────────────────── */}
      {funnel && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-ink" />
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
              Funnel detallado
            </h2>
            <span className="text-[11px] text-muted">
              · 8 stages desde signup hasta primer pago
            </span>
          </div>

          {/* Stages */}
          <div className="rounded-xl border border-hairline bg-canvas overflow-hidden">
            {(() => {
              const stages = funnel.stages || []
              const top = stages[0]?.count || 0
              return stages.map((s, i) => {
                const prevCount = i > 0 ? (stages[i - 1].count || 0) : top
                const pctTotal = pct(s.count, top)
                const pctFromPrev = i > 0 ? pct(s.count, prevCount) : 100
                return (
                  <div key={s.key} className="flex items-center gap-3 px-4 py-3 border-b border-hairline last:border-b-0">
                    <span className="w-6 text-[11px] font-semibold text-muted tabular-nums">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13.5px] font-medium text-ink">{s.label}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[14px] font-semibold text-ink tabular-nums">
                            {s.count.toLocaleString('es-ES')}
                          </span>
                          <span className="text-[11px] text-muted tabular-nums">{pctTotal}%</span>
                          {i > 0 && (
                            <span className={`text-[10.5px] font-medium tabular-nums ${pctFromPrev >= 50 ? 'text-emerald-600' : pctFromPrev >= 25 ? 'text-amber-600' : 'text-rose-600'}`}>
                              ↓ {pctFromPrev}% del anterior
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-surface-soft overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FE6620] to-[#fbbf24] transition-all"
                          style={{ width: `${pctTotal}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>

          {/* Tiempos medianos */}
          {funnel.time_to && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
              <TimeCard label="Mediana hasta 1er kennel" value={hoursToHuman(funnel.time_to.first_kennel_hours)} />
              <TimeCard label="Mediana hasta 1er perro" value={hoursToHuman(funnel.time_to.first_dog_hours)} />
              <TimeCard label="Mediana hasta 1ª camada" value={hoursToHuman(funnel.time_to.first_litter_hours)} />
              <TimeCard label="Mediana hasta 1er pago" value={hoursToHuman(funnel.time_to.first_paid_hours)} />
            </div>
          )}
        </section>
      )}

      {/* ─── Cohort retention ─────────────────────────────────────────── */}
      {cohort && cohort.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-ink" />
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
              Cohort retention
            </h2>
            <span className="text-[11px] text-muted">
              · % activos D7/D30/D60/D90 por mes de signup
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-hairline bg-canvas">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="px-3 py-2.5 text-left font-semibold text-muted uppercase text-[10.5px] tracking-wider">Mes</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-muted uppercase text-[10.5px] tracking-wider">Signups</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-muted uppercase text-[10.5px] tracking-wider">D7</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-muted uppercase text-[10.5px] tracking-wider">D30</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-muted uppercase text-[10.5px] tracking-wider">D60</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-muted uppercase text-[10.5px] tracking-wider">D90</th>
                </tr>
              </thead>
              <tbody>
                {cohort.map((r) => (
                  <tr key={r.month} className="border-b border-hairline last:border-b-0">
                    <td className="px-3 py-2 text-ink font-medium whitespace-nowrap">{r.month}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-body">{r.signups}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold tabular-nums ${cohortCellBg(r.d7_pct)}`}>
                        {r.d7_pct}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold tabular-nums ${cohortCellBg(r.d30_pct)}`}>
                        {r.d30_pct}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold tabular-nums ${cohortCellBg(r.d60_pct)}`}>
                        {r.d60_pct}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold tabular-nums ${cohortCellBg(r.d90_pct)}`}>
                        {r.d90_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10.5px] text-muted">
            Verde &gt;60% / 40-60% · Amber 20-40% · Rosa &lt;20%. Basado en last_sign_in_at — un user que no entra en X días no se cuenta retenido.
          </p>
        </section>
      )}

      {/* ─── Revenue snapshot ─────────────────────────────────────────── */}
      {revenue && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4 text-ink" />
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
              Revenue
            </h2>
            <span className="text-[11px] text-muted">
              · Estimado a precios fijos + eventos Stripe procesados
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              icon={DollarSign}
              label="MRR estimado"
              value={`${(revenue.mrr_estimated_eur || 0).toLocaleString('es-ES')} €`}
              accent="text-emerald-600"
            />
            <KpiCard
              icon={Users}
              label="Pagando"
              value={`${revenue.paying.paying_total}`}
              sub={`${revenue.paying.pro_count} Pro · ${revenue.paying.kennel_count} Kennel`}
              accent="text-blue-600"
            />
            <KpiCard
              icon={Activity}
              label="ARPU"
              value={`${revenue.arpu_estimated_eur || 0} €`}
              accent="text-purple-600"
            />
            <KpiCard
              icon={TrendingUp}
              label="Pagos 30d"
              value={`${revenue.payments_30d}`}
              sub={`90d: ${revenue.payments_90d}`}
              accent="text-amber-600"
            />
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard
              icon={Activity}
              label="Churn 30d"
              value={`${revenue.churn_30d}`}
              sub={`90d: ${revenue.churn_90d}`}
              accent="text-rose-600"
            />
            <KpiCard
              icon={Activity}
              label="Cambios sub 30d"
              value={`${revenue.subscription_changes_30d}`}
              sub="upgrades + downgrades"
              accent="text-indigo-600"
            />
            <KpiCard
              icon={Users}
              label="Mix de planes"
              value={`${revenue.mix_pct.free}% / ${revenue.mix_pct.kennel}% / ${revenue.mix_pct.kennel_pro}%`}
              sub="free / kennel / pro"
              accent="text-ink"
            />
          </div>
          <p className="mt-3 text-[10.5px] text-muted">
            MRR calculado a precios fijos (49€ Kennel Pro · 149€ Kennel Enterprise). Para precisión total usar Stripe API real — pendiente de iteración.
          </p>
        </section>
      )}
    </div>
  )
}

function TimeCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted truncate">{label}</p>
      <p className="mt-1 text-[14px] font-semibold tabular-nums text-ink">{value}</p>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'text-ink',
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-3">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted truncate">{label}</span>
      </div>
      <p className={`mt-2 text-[20px] font-semibold tabular-nums tracking-[-0.03em] ${accent} leading-none truncate`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[10.5px] text-muted truncate">{sub}</p>}
    </div>
  )
}
