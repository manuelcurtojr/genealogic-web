/**
 * /admin/reports — bandeja de reportes de contenido (notice-and-action).
 *
 * Mismo diseño que /admin/solicitudes: stats arriba + filtros + tabla.
 * Cumple SLA legal de 72h (art. 17 LSSI).
 */
import Link from 'next/link'
import { createKennelAdminClient } from '@/lib/supabase/server'
import {
  type ContentReport,
  REPORT_REASON_LABELS,
  REPORT_TARGET_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  OPEN_STATUSES,
  RESOLVED_STATUSES,
  SLA_HOURS,
} from '@/lib/content-reports/types'
import {
  Flag, Filter, ArrowRight, Clock, AlertTriangle,
  Image as ImageIcon, Dog, Store, FileText, MessageSquare,
  User, Copyright, ShieldAlert, Copy,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

type SearchParams = {
  reason?: string
  target_type?: string
  scope?: 'open' | 'all' | 'resolved' | 'overdue'
}

const REASON_ICONS: Record<string, typeof Flag> = {
  copyright: Copyright,
  personal_data: ShieldAlert,
  inaccurate: AlertTriangle,
  inappropriate: AlertTriangle,
  impersonation: User,
  animal_welfare: AlertTriangle,
  duplicate: Copy,
  other: Flag,
}

const TARGET_ICONS: Record<string, typeof Dog> = {
  dog: Dog,
  photo: ImageIcon,
  kennel: Store,
  user: User,
  litter: FileText,
  comment: MessageSquare,
  message: MessageSquare,
  other: Flag,
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const scope = sp.scope || 'open'

  let query = admin
    .from('content_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (sp.reason) query = query.eq('reason', sp.reason)
  if (sp.target_type) query = query.eq('target_type', sp.target_type)
  if (scope === 'open') query = query.in('status', OPEN_STATUSES)
  if (scope === 'resolved') query = query.in('status', RESOLVED_STATUSES)
  if (scope === 'overdue') {
    // Reportes con > 72h sin resolver (incumplimiento de SLA)
    const cutoff = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000).toISOString()
    query = query.in('status', OPEN_STATUSES).lt('created_at', cutoff)
  }

  const { data: reports } = await query

  // Stats globales (todas, sin filtros)
  const { data: statsRaw } = await admin
    .from('content_reports')
    .select('status, reason, created_at')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (statsRaw || []) as any[]
  const cutoffSLA = Date.now() - SLA_HOURS * 60 * 60 * 1000
  const stats = {
    total: rows.length,
    open: rows.filter((r) => r.status === 'open').length,
    reviewing: rows.filter((r) => r.status === 'reviewing').length,
    overdue: rows.filter(
      (r) => OPEN_STATUSES.includes(r.status) && new Date(r.created_at).getTime() < cutoffSLA,
    ).length,
    copyright: rows.filter((r) => r.reason === 'copyright').length,
    gdpr: rows.filter((r) => r.reason === 'personal_data').length,
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Flag className="w-6 h-6 text-ink" />
        <div>
          <h1 className="text-2xl font-bold text-ink">Reportes de contenido</h1>
          <p className="text-sm text-muted">
            Notice-and-action conforme al art. 17 LSSI / art. 14 DSA. SLA legal: {SLA_HOURS}h.
          </p>
        </div>
      </div>

      {/* Aviso si hay overdue */}
      {stats.overdue > 0 && (
        <div className="mb-4 mt-4 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-700 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-red-900">
              {stats.overdue} reporte{stats.overdue === 1 ? '' : 's'} fuera de SLA ({SLA_HOURS}h)
            </p>
            <p className="text-red-800">
              Resuelve cuanto antes — el incumplimiento del plazo de respuesta puede agravar
              la responsabilidad como prestador de alojamiento.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6 mt-6">
        <StatPill label="Total" value={stats.total} />
        <StatPill label="Abiertos" value={stats.open} accent="amber" />
        <StatPill label="En revisión" value={stats.reviewing} accent="blue" />
        <StatPill label="Fuera de SLA" value={stats.overdue} accent="red" icon={Clock} />
        <StatPill label="Copyright" value={stats.copyright} icon={Copyright} />
        <StatPill label="RGPD" value={stats.gdpr} icon={ShieldAlert} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        <Filter className="w-3.5 h-3.5 text-muted" />
        <ScopeTab current={scope} value="open" label="Abiertos" sp={sp} />
        <ScopeTab current={scope} value="overdue" label={`Fuera SLA (${stats.overdue})`} sp={sp} />
        <ScopeTab current={scope} value="resolved" label="Resueltos" sp={sp} />
        <ScopeTab current={scope} value="all" label="Todos" sp={sp} />
        <span className="mx-2 text-muted">|</span>
        <ReasonTab current={sp.reason} value="" label="Todos los motivos" sp={sp} />
        <ReasonTab current={sp.reason} value="copyright" label="Copyright" sp={sp} />
        <ReasonTab current={sp.reason} value="personal_data" label="RGPD" sp={sp} />
        <ReasonTab current={sp.reason} value="inaccurate" label="Inexacto" sp={sp} />
        <ReasonTab current={sp.reason} value="inappropriate" label="Inapropiado" sp={sp} />
        <ReasonTab current={sp.reason} value="impersonation" label="Suplantación" sp={sp} />
      </div>

      {/* Lista */}
      {!reports || reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft py-16 text-center">
          <Flag className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-sm text-body">No hay reportes que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="text-left py-2.5 px-4 font-semibold">Motivo</th>
                <th className="text-left py-2.5 px-4 font-semibold">Contenido</th>
                <th className="text-left py-2.5 px-4 font-semibold">Reportante</th>
                <th className="text-left py-2.5 px-4 font-semibold">Estado</th>
                <th className="text-right py-2.5 px-4 font-semibold">SLA</th>
                <th className="text-right py-2.5 px-4 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {(reports as ContentReport[]).map((r) => {
                const ReasonIcon = REASON_ICONS[r.reason] || Flag
                const TargetIcon = TARGET_ICONS[r.target_type] || Flag
                const ageMs = Date.now() - new Date(r.created_at).getTime()
                const ageHours = ageMs / 1000 / 60 / 60
                const isOpen = OPEN_STATUSES.includes(r.status)
                const overdue = isOpen && ageHours > SLA_HOURS
                const urgent = isOpen && ageHours > SLA_HOURS / 2 && !overdue
                return (
                  <tr key={r.id} className="hover:bg-surface-soft">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <ReasonIcon className={`w-4 h-4 ${
                          r.reason === 'copyright' ? 'text-amber-700' :
                          r.reason === 'personal_data' ? 'text-blue-700' :
                          'text-ink'
                        }`} />
                        <span className="text-xs font-medium text-body">
                          {REPORT_REASON_LABELS[r.reason]}
                        </span>
                        {r.is_rights_holder && (
                          <span className="text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-900">
                            Titular
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/admin/reports/${r.id}`} className="block">
                        <div className="flex items-center gap-2">
                          <TargetIcon className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                            {REPORT_TARGET_LABELS[r.target_type]}
                          </span>
                        </div>
                        <p className="text-sm text-ink truncate max-w-md mt-0.5">
                          {r.description.slice(0, 90)}{r.description.length > 90 ? '…' : ''}
                        </p>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-medium text-ink truncate max-w-[180px]">
                        {r.reporter_name || (r.reporter_user_id ? 'Usuario' : 'Anónimo')}
                      </p>
                      <p className="text-[11px] text-muted truncate max-w-[180px]">
                        {r.reporter_email || '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${REPORT_STATUS_COLORS[r.status]}`}>
                        {REPORT_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isOpen ? (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          overdue ? 'bg-red-100 text-red-900' :
                          urgent ? 'bg-amber-100 text-amber-900' :
                          'bg-emerald-50 text-emerald-800'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {ageHours < 1
                            ? `${Math.round(ageMs / 1000 / 60)}m`
                            : `${Math.round(ageHours)}h`}
                          {overdue && ' ⚠'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/reports/${r.id}`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
                        {new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value, accent, icon: Icon }: {
  label: string
  value: number
  accent?: 'amber' | 'blue' | 'red'
  icon?: typeof Flag
}) {
  const color =
    accent === 'amber' ? 'text-amber-700 bg-amber-50' :
    accent === 'blue' ? 'text-blue-700 bg-blue-50' :
    accent === 'red' ? 'text-red-700 bg-red-50' :
    'text-ink bg-surface-card'
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-3">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted" />}
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted">{label}</p>
      </div>
      <p className={`text-2xl font-bold tabular-nums px-2 py-0.5 rounded inline-block ${color}`}>
        {value}
      </p>
    </div>
  )
}

function ScopeTab({ current, value, label, sp }: {
  current: string
  value: 'open' | 'all' | 'resolved' | 'overdue'
  label: string
  sp: SearchParams
}) {
  const qs = new URLSearchParams()
  if (sp.reason) qs.set('reason', sp.reason)
  if (sp.target_type) qs.set('target_type', sp.target_type)
  qs.set('scope', value)
  const active = current === value
  return (
    <Link
      href={`/admin/reports?${qs.toString()}`}
      className={`px-2.5 py-1 rounded-md font-medium transition ${
        active ? 'bg-ink text-on-primary' : 'text-body hover:bg-surface-card'
      }`}
    >
      {label}
    </Link>
  )
}

function ReasonTab({ current, value, label, sp }: {
  current: string | undefined
  value: string
  label: string
  sp: SearchParams
}) {
  const qs = new URLSearchParams()
  if (value) qs.set('reason', value)
  if (sp.target_type) qs.set('target_type', sp.target_type)
  if (sp.scope) qs.set('scope', sp.scope)
  const active = (current || '') === value
  return (
    <Link
      href={`/admin/reports?${qs.toString()}`}
      className={`px-2.5 py-1 rounded-md font-medium transition ${
        active ? 'bg-ink text-on-primary' : 'text-body hover:bg-surface-card'
      }`}
    >
      {label}
    </Link>
  )
}
