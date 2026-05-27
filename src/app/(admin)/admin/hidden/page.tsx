/**
 * /admin/hidden — listado del contenido oculto (perros + criaderos).
 *
 * Muestra todo el contenido con hidden_at IS NOT NULL en ambas tablas,
 * combinado y ordenado por fecha de ocultación. Cada fila permite navegar
 * a la página del recurso (que en modo admin mostrará el banner rojo con
 * botón "Restaurar").
 *
 * Mismo diseño que /admin/solicitudes y /admin/reports.
 */
import Link from 'next/link'
import { createKennelAdminClient } from '@/lib/supabase/server'
import {
  HIDDEN_REASON_LABELS,
  HIDDEN_REASON_BADGE_COLORS,
  TARGET_TYPE_LABELS,
  type HiddenReason,
} from '@/lib/moderation/types'
import {
  REPORT_REASON_LABELS,
  type ReportReason,
} from '@/lib/content-reports/types'
import {
  EyeOff, ArrowRight, Dog, Store, Clock, Filter, FileText,
  ExternalLink, User as UserIcon, Copyright, ShieldAlert,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

type SearchParams = {
  type?: 'dog' | 'kennel'
  reason?: string
}

interface HiddenRow {
  kind: 'dog' | 'kennel'
  id: string
  name: string
  slug: string | null
  thumbnail: string | null
  hidden_at: string
  hidden_reason: HiddenReason
  hidden_notes: string | null
  hidden_report_id: string | null
  /** Datos del reporte que motivó la ocultación (si los hay) */
  report: {
    id: string
    reason: ReportReason
    reporter_name: string | null
    reporter_email: string | null
    is_rights_holder: boolean
    description: string
    created_at: string
  } | null
}

export default async function AdminHiddenPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // Queries en paralelo
  let dogsQuery = admin
    .from('dogs')
    .select('id, name, slug, thumbnail_url, hidden_at, hidden_reason, hidden_notes, hidden_report_id')
    .not('hidden_at', 'is', null)
    .order('hidden_at', { ascending: false })
    .limit(200)
  if (sp.reason) dogsQuery = dogsQuery.eq('hidden_reason', sp.reason)

  let kennelsQuery = admin
    .from('kennels')
    .select('id, name, slug, logo_url, hidden_at, hidden_reason, hidden_notes, hidden_report_id')
    .not('hidden_at', 'is', null)
    .order('hidden_at', { ascending: false })
    .limit(200)
  if (sp.reason) kennelsQuery = kennelsQuery.eq('hidden_reason', sp.reason)

  const [dogsRes, kennelsRes] = await Promise.all([
    sp.type === 'kennel' ? { data: [] } : dogsQuery,
    sp.type === 'dog' ? { data: [] } : kennelsQuery,
  ])

  // Recolectamos los report_ids para hacer un solo lookup batched
  const allRawRows = [...(dogsRes.data || []), ...(kennelsRes.data || [])]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reportIds = Array.from(new Set(allRawRows.map((r: any) => r.hidden_report_id).filter(Boolean)))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reportsById = new Map<string, any>()
  if (reportIds.length > 0) {
    const { data: reports } = await admin
      .from('content_reports')
      .select('id, reason, reporter_name, reporter_email, is_rights_holder, description, created_at')
      .in('id', reportIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(reports || []).forEach((r: any) => reportsById.set(r.id, r))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapReport = (id: string | null) => {
    if (!id) return null
    const r = reportsById.get(id)
    if (!r) return null
    return {
      id: r.id,
      reason: r.reason as ReportReason,
      reporter_name: r.reporter_name,
      reporter_email: r.reporter_email,
      is_rights_holder: r.is_rights_holder,
      description: r.description,
      created_at: r.created_at,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dogRows: HiddenRow[] = (dogsRes.data || []).map((d: any) => ({
    kind: 'dog',
    id: d.id,
    name: d.name,
    slug: d.slug,
    thumbnail: d.thumbnail_url,
    hidden_at: d.hidden_at,
    hidden_reason: d.hidden_reason,
    hidden_notes: d.hidden_notes,
    hidden_report_id: d.hidden_report_id,
    report: mapReport(d.hidden_report_id),
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kennelRows: HiddenRow[] = (kennelsRes.data || []).map((k: any) => ({
    kind: 'kennel',
    id: k.id,
    name: k.name,
    slug: k.slug,
    thumbnail: k.logo_url,
    hidden_at: k.hidden_at,
    hidden_reason: k.hidden_reason,
    hidden_notes: k.hidden_notes,
    hidden_report_id: k.hidden_report_id,
    report: mapReport(k.hidden_report_id),
  }))

  const all = [...dogRows, ...kennelRows].sort(
    (a, b) => new Date(b.hidden_at).getTime() - new Date(a.hidden_at).getTime(),
  )

  // Stats (todas las hidden, sin filtros)
  const [{ data: allDogs }, { data: allKennels }] = await Promise.all([
    admin.from('dogs').select('hidden_reason').not('hidden_at', 'is', null),
    admin.from('kennels').select('hidden_reason').not('hidden_at', 'is', null),
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allHidden = [...(allDogs || []), ...(allKennels || [])] as any[]
  const stats = {
    total: allHidden.length,
    dogs: (allDogs || []).length,
    kennels: (allKennels || []).length,
    rgpd: allHidden.filter((r) => r.hidden_reason === 'rgpd_request').length,
    copyright: allHidden.filter((r) => r.hidden_reason === 'copyright').length,
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <EyeOff className="w-6 h-6 text-ink" />
        <div>
          <h1 className="text-2xl font-bold text-ink">Contenido oculto</h1>
          <p className="text-sm text-muted">
            Perros y criaderos retirados del público. <strong>Nada se elimina</strong>: todo es
            reversible para responder a contra-notificaciones.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6 mt-6">
        <StatPill label="Total" value={stats.total} />
        <StatPill label="Perros" value={stats.dogs} icon={Dog} />
        <StatPill label="Criaderos" value={stats.kennels} icon={Store} />
        <StatPill label="RGPD" value={stats.rgpd} accent="blue" />
        <StatPill label="Copyright" value={stats.copyright} accent="amber" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        <Filter className="w-3.5 h-3.5 text-muted" />
        <TypeTab current={sp.type} value="" label="Todos" sp={sp} />
        <TypeTab current={sp.type} value="dog" label="Perros" sp={sp} />
        <TypeTab current={sp.type} value="kennel" label="Criaderos" sp={sp} />
        <span className="mx-2 text-muted">|</span>
        <ReasonTab current={sp.reason} value="" label="Todos los motivos" sp={sp} />
        <ReasonTab current={sp.reason} value="rgpd_request" label="RGPD" sp={sp} />
        <ReasonTab current={sp.reason} value="copyright" label="Copyright" sp={sp} />
        <ReasonTab current={sp.reason} value="impersonation" label="Suplantación" sp={sp} />
        <ReasonTab current={sp.reason} value="inappropriate" label="Inapropiado" sp={sp} />
        <ReasonTab current={sp.reason} value="duplicate" label="Duplicado" sp={sp} />
      </div>

      {/* Lista */}
      {all.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft py-16 text-center">
          <EyeOff className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-sm text-body">
            No hay contenido oculto que coincida con los filtros.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="text-left py-2.5 px-4 font-semibold">Tipo</th>
                <th className="text-left py-2.5 px-4 font-semibold">Contenido</th>
                <th className="text-left py-2.5 px-4 font-semibold">Motivo / Reclamación</th>
                <th className="text-left py-2.5 px-4 font-semibold">Reportante</th>
                <th className="text-right py-2.5 px-4 font-semibold">Oculto desde</th>
                <th className="text-right py-2.5 px-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {all.map((row) => {
                const TypeIcon = row.kind === 'dog' ? Dog : Store
                const url = row.kind === 'dog'
                  ? `/dogs/${row.slug || row.id}`
                  : `/kennels/${row.slug || row.id}`
                return (
                  <tr key={`${row.kind}-${row.id}`} className="hover:bg-surface-soft">
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-ink" />
                        <span className="text-xs font-medium text-body">
                          {TARGET_TYPE_LABELS[row.kind]}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <Link href={url} className="flex items-center gap-2.5 group">
                        {row.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.thumbnail}
                            alt=""
                            className="w-9 h-9 rounded-md object-cover border border-hairline grayscale opacity-60"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-surface-card flex items-center justify-center border border-hairline">
                            <TypeIcon className="w-4 h-4 text-muted/50" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-ink truncate max-w-[200px] group-hover:underline">
                          {row.name}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="space-y-1.5">
                        <span className={`inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${HIDDEN_REASON_BADGE_COLORS[row.hidden_reason]}`}>
                          {HIDDEN_REASON_LABELS[row.hidden_reason]}
                        </span>
                        {row.report ? (
                          <div className="text-[11px] text-muted leading-snug">
                            <p className="line-clamp-2 max-w-[280px] text-body">
                              "{row.report.description.slice(0, 120)}{row.report.description.length > 120 ? '…' : ''}"
                            </p>
                            <Link
                              href={`/admin/reports/${row.report.id}`}
                              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-ink hover:underline"
                            >
                              <FileText className="w-3 h-3" />
                              Ver reclamación completa
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </Link>
                          </div>
                        ) : row.hidden_notes ? (
                          <p className="text-[11px] text-muted line-clamp-2 max-w-[280px]">
                            {row.hidden_notes}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted italic">
                            Sin reclamación asociada (acción admin directa)
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      {row.report ? (
                        <div className="space-y-0.5 max-w-[200px]">
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="w-3 h-3 text-muted flex-shrink-0" />
                            <p className="text-xs font-medium text-ink truncate">
                              {row.report.reporter_name || (row.report.reporter_email ? 'Externo' : 'Anónimo')}
                            </p>
                            {row.report.is_rights_holder && (
                              <Copyright className="w-3 h-3 text-amber-700 flex-shrink-0" aria-label="Titular de derechos" />
                            )}
                          </div>
                          {row.report.reporter_email && (
                            <p className="text-[11px] text-muted truncate">
                              {row.report.reporter_email}
                            </p>
                          )}
                          <p className="text-[10px] text-muted">
                            Reclamó el {new Date(row.report.created_at).toLocaleDateString('es-ES', {
                              day: '2-digit', month: 'short', year: '2-digit',
                            })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                        <Clock className="w-3 h-3" />
                        {new Date(row.hidden_at).toLocaleDateString('es-ES', {
                          day: '2-digit', month: 'short', year: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top text-right">
                      <Link
                        href={url}
                        className="inline-flex items-center gap-1 text-xs text-ink hover:underline whitespace-nowrap"
                      >
                        Gestionar <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-[11px] text-muted text-center">
        Para restaurar contenido entra en su página: el banner rojo incluye el botón "Restaurar".
      </p>
    </div>
  )
}

function StatPill({ label, value, accent, icon: Icon }: {
  label: string
  value: number
  accent?: 'amber' | 'blue'
  icon?: typeof Dog
}) {
  const color =
    accent === 'amber' ? 'text-amber-700 bg-amber-50' :
    accent === 'blue' ? 'text-blue-700 bg-blue-50' :
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

function TypeTab({ current, value, label, sp }: {
  current: string | undefined
  value: string
  label: string
  sp: SearchParams
}) {
  const qs = new URLSearchParams()
  if (value) qs.set('type', value)
  if (sp.reason) qs.set('reason', sp.reason)
  const active = (current || '') === value
  return (
    <Link
      href={`/admin/hidden?${qs.toString()}`}
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
  if (sp.type) qs.set('type', sp.type)
  const active = (current || '') === value
  return (
    <Link
      href={`/admin/hidden?${qs.toString()}`}
      className={`px-2.5 py-1 rounded-md font-medium transition ${
        active ? 'bg-ink text-on-primary' : 'text-body hover:bg-surface-card'
      }`}
    >
      {label}
    </Link>
  )
}
