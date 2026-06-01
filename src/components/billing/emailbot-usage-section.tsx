/**
 * Sección "Uso del Emailbot este mes" en /cuenta/facturacion.
 *
 * Server component — recibe los datos ya agregados desde la page.
 * No es interactivo: lectura + link al panel del bot.
 *
 * Muestra:
 *  - Stats: respuestas usadas / cuota plan, tokens totales, coste estimado USD
 *  - Barra de progreso con color según consumo
 *  - Desglose por scope (bot_replies / test / import_url / import_file)
 *  - Tabla de las últimas 20 llamadas
 */
import Link from 'next/link'
import { Bot, Beaker, Globe, FileText, AlertCircle, TrendingUp } from 'lucide-react'
import type { QuotaStatus } from '@/lib/ai/quotas'
import { getModel } from '@/lib/ai/models'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export type UsageRow = {
  id: string
  scope: string
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  status: string
  error_message: string | null
  created_at: string
}

export type ScopeBreakdown = {
  bot_replies_count: number
  bot_replies_cost_usd: number
  test_count: number
  test_cost_usd: number
  import_url_count: number
  import_url_cost_usd: number
  import_file_count: number
  import_file_cost_usd: number
  total_cost_usd: number
  total_tokens: number
}

const SCOPE_LABELS: Record<string, { label: string; icon: typeof Bot; color: string }> = {
  emailbot_reply:         { label: 'Respuesta del bot',     icon: Bot,      color: 'text-blue-700' },
  emailbot_test:          { label: 'Test (playground)',     icon: Beaker,   color: 'text-violet-700' },
  knowledge_import_url:   { label: 'Importar URL',          icon: Globe,    color: 'text-emerald-700' },
  knowledge_import_file:  { label: 'Importar archivo',      icon: FileText, color: 'text-amber-700' },
  other:                  { label: 'Otro',                  icon: AlertCircle, color: 'text-muted' },
}

export default async function EmailbotUsageSection({
  quota, breakdown, recentRows,
}: {
  quota: QuotaStatus
  breakdown: ScopeBreakdown
  recentRows: UsageRow[]
}) {
  const t = getTranslator(await getLocale())
  const isUnlimited = quota.limit < 0
  const isBlocked = !quota.allowed
  const pct = isUnlimited || quota.limit === 0
    ? 0
    : Math.min(100, Math.round((quota.used / quota.limit) * 100))
  let barColor = 'bg-emerald-500'
  if (isBlocked) barColor = 'bg-red-500'
  else if (pct >= 75) barColor = 'bg-amber-500'

  const planLabel = quota.plan.charAt(0).toUpperCase() + quota.plan.slice(1)

  return (
    <section className="rounded-2xl border border-hairline bg-canvas p-6 mb-6">
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="text-lg font-bold text-ink inline-flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {t('Uso del Emailbot este mes')}
        </h2>
        <Link
          href="/emailbot"
          className="text-xs font-semibold text-muted hover:text-ink"
        >
          {t('Ir al panel del bot →')}
        </Link>
      </div>
      <p className="text-sm text-muted mb-5">
        {t('Plan')} <strong className="text-ink">{planLabel}</strong>
        {isUnlimited ? ' · ' + t('respuestas ilimitadas') : ` · ${quota.limit.toLocaleString('es-ES')} ` + t('respuestas/mes incluidas')}
        {isBlocked && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
            {t('Cuota agotada')}
          </span>
        )}
      </p>

      {/* Big stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <StatBox
          label={t('Respuestas del bot')}
          value={quota.used.toLocaleString('es-ES')}
          sub={isUnlimited ? t('ilimitadas') : `${t('de')} ${quota.limit.toLocaleString('es-ES')} ${t('incluidas')}`}
        />
        <StatBox
          label={t('Tokens consumidos')}
          value={formatTokens(breakdown.total_tokens)}
          sub={t('todos los scopes')}
        />
        <StatBox
          label={t('Coste estimado')}
          value={`$${breakdown.total_cost_usd.toFixed(4)}`}
          sub={t('USD — incluido en tu plan')}
        />
      </div>

      {/* Barra de progreso (solo si hay tope) */}
      {!isUnlimited && quota.limit > 0 && (
        <div className="mb-5">
          <div className="h-2 rounded-full bg-surface-card overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-300`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-muted">
              {quota.remaining > 0
                ? `${quota.remaining.toLocaleString('es-ES')} ${t('respuestas restantes')}`
                : t('Sin respuestas restantes este mes')}
            </p>
            <p className="text-[11px] text-muted">{pct}%</p>
          </div>
        </div>
      )}

      {/* Desglose por scope */}
      <div className="rounded-xl border border-hairline overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead className="bg-surface-soft/50 border-b border-hairline">
            <tr>
              <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Tipo de uso')}</th>
              <th className="text-right px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Llamadas')}</th>
              <th className="text-right px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Coste')}</th>
              <th className="text-right px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted hidden sm:table-cell">{t('Cuenta cuota')}</th>
            </tr>
          </thead>
          <tbody>
            <ScopeRow scope="emailbot_reply" count={breakdown.bot_replies_count} cost={breakdown.bot_replies_cost_usd} countsQuota t={t} />
            <ScopeRow scope="emailbot_test" count={breakdown.test_count} cost={breakdown.test_cost_usd} t={t} />
            <ScopeRow scope="knowledge_import_url" count={breakdown.import_url_count} cost={breakdown.import_url_cost_usd} t={t} />
            <ScopeRow scope="knowledge_import_file" count={breakdown.import_file_count} cost={breakdown.import_file_cost_usd} t={t} />
          </tbody>
        </table>
      </div>

      {/* Últimas llamadas */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          {t('Últimas')} {recentRows.length} {t('llamadas')}
        </h3>
        {recentRows.length === 0 ? (
          <p className="text-sm text-muted text-center py-6 border border-dashed border-hairline rounded-lg">
            {t('Sin actividad todavía. Cuando el bot responda emails o uses los imports, aparecerá aquí.')}
          </p>
        ) : (
          <div className="rounded-xl border border-hairline overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-soft/50 border-b border-hairline">
                <tr>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Tipo')}</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted hidden md:table-cell">{t('Modelo')}</th>
                  <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Tokens')}</th>
                  <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Coste')}</th>
                  <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Fecha')}</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((r, i) => {
                  const meta = SCOPE_LABELS[r.scope] || SCOPE_LABELS.other
                  const Icon = meta.icon
                  const modelLabel = getModel(r.model).label
                  return (
                    <tr key={r.id} className={i > 0 ? 'border-t border-hairline-soft' : ''}>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1.5 ${meta.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-xs">{t(meta.label)}</span>
                        </span>
                        {r.status === 'error' && (
                          <span className="ml-1 text-[10px] font-bold text-red-700 uppercase">ERROR</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-body hidden md:table-cell">{modelLabel}</td>
                      <td className="px-3 py-2 text-xs text-body text-right tabular-nums">
                        {r.total_tokens.toLocaleString('es-ES')}
                      </td>
                      <td className="px-3 py-2 text-xs text-body text-right tabular-nums">
                        ${r.estimated_cost_usd.toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted text-right whitespace-nowrap">
                        {fmtDate(r.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function ScopeRow({
  scope, count, cost, countsQuota, t,
}: { scope: string; count: number; cost: number; countsQuota?: boolean; t: (k: string) => string }) {
  const meta = SCOPE_LABELS[scope] || SCOPE_LABELS.other
  const Icon = meta.icon
  return (
    <tr className="border-t border-hairline-soft first:border-t-0">
      <td className="px-4 py-2.5">
        <span className={`inline-flex items-center gap-2 ${meta.color}`}>
          <Icon className="w-4 h-4" />
          <span className="text-sm">{t(meta.label)}</span>
        </span>
      </td>
      <td className="px-4 py-2.5 text-right text-sm tabular-nums text-ink">
        {count.toLocaleString('es-ES')}
      </td>
      <td className="px-4 py-2.5 text-right text-sm tabular-nums text-body">
        ${cost.toFixed(4)}
      </td>
      <td className="px-4 py-2.5 text-right text-xs hidden sm:table-cell">
        {countsQuota ? (
          <span className="text-amber-700 font-semibold">{t('Sí')}</span>
        ) : (
          <span className="text-emerald-700 font-semibold">{t('No')}</span>
        )}
      </td>
    </tr>
  )
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-soft/40 p-4">
      <p className="text-2xl font-bold text-ink leading-none tabular-nums">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mt-2">{label}</p>
      {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

function formatTokens(n: number): string {
  if (n < 1000) return n.toString()
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`
  return `${(n / 1_000_000).toFixed(2)}M`
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}
