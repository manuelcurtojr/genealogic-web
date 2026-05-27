/**
 * Detalle de un reporte de contenido en el panel de admin.
 *
 * Mismo layout que /admin/solicitudes/[id]: 2 columnas, izquierda = mensaje
 * y contenido reportado; derecha = sidebar con reportante, target, acciones.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createKennelAdminClient } from '@/lib/supabase/server'
import {
  type ContentReport,
  REPORT_REASON_LABELS,
  REPORT_TARGET_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  OPEN_STATUSES,
  SLA_HOURS,
} from '@/lib/content-reports/types'
import ReportAdminActions from '@/components/content-reports/report-admin-actions'
import {
  ArrowLeft, Flag, ExternalLink, User, Calendar, Globe,
  ShieldAlert, AlertTriangle, Copyright, Clock, Mail,
  Dog, Image as ImageIcon, Store, FileText, MessageSquare, Copy,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

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

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const { data: report } = await admin
    .from('content_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (!report) notFound()
  const r = report as ContentReport

  // Profile del reportante si es usuario logueado
  let reporterProfile: { display_name: string | null; email: string | null; avatar_url: string | null } | null = null
  if (r.reporter_user_id) {
    const { data: prof } = await admin
      .from('profiles')
      .select('display_name, email, avatar_url')
      .eq('id', r.reporter_user_id)
      .maybeSingle()
    reporterProfile = prof || null
  }

  // Lookup del target — intentamos resolver según el target_type
  // (best-effort: si no se puede, mostramos el id raw)
  let targetData:
    | { name: string; slug?: string | null; url: string; thumbnail?: string | null }
    | null = null

  // El target_id de foto viene con formato "<dogId>#photo-N", normalizamos.
  const cleanTargetId = r.target_id.split('#')[0]

  if (r.target_type === 'dog' || r.target_type === 'photo') {
    const { data: dog } = await admin
      .from('dogs')
      .select('id, name, slug, thumbnail_url')
      .eq('id', cleanTargetId)
      .maybeSingle()
    if (dog) {
      targetData = {
        name: dog.name,
        slug: dog.slug,
        url: `/dogs/${dog.slug || dog.id}`,
        thumbnail: dog.thumbnail_url,
      }
    }
  } else if (r.target_type === 'kennel') {
    const { data: kennel } = await admin
      .from('kennels')
      .select('id, name, slug, logo_url')
      .eq('id', cleanTargetId)
      .maybeSingle()
    if (kennel) {
      targetData = {
        name: kennel.name,
        slug: kennel.slug,
        url: `/kennels/${kennel.slug || kennel.id}`,
        thumbnail: kennel.logo_url,
      }
    }
  }

  const ReasonIcon = REASON_ICONS[r.reason] || Flag
  const TargetIcon = TARGET_ICONS[r.target_type] || Flag

  const ageMs = Date.now() - new Date(r.created_at).getTime()
  const ageHours = ageMs / 1000 / 60 / 60
  const isOpen = OPEN_STATUSES.includes(r.status)
  const overdue = isOpen && ageHours > SLA_HOURS

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href="/admin/reports"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Volver a Reportes
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center flex-shrink-0">
            <ReasonIcon className="w-5 h-5 text-ink" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {REPORT_REASON_LABELS[r.reason]} · #{r.id.slice(0, 8)}
            </p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold text-ink truncate">
              Reporte sobre {REPORT_TARGET_LABELS[r.target_type].toLowerCase()}
              {targetData?.name ? `: ${targetData.name}` : ''}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {overdue && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-red-100 text-red-900 border border-red-200">
              <Clock className="w-3 h-3" /> Fuera SLA
            </span>
          )}
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${REPORT_STATUS_COLORS[r.status]}`}>
            {REPORT_STATUS_LABELS[r.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main col */}
        <div className="lg:col-span-2 space-y-5">
          {/* Mensaje del reportante */}
          <div className="rounded-xl border border-hairline bg-canvas p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted" />
              <p className="text-xs font-semibold text-ink">
                {r.reporter_name || reporterProfile?.display_name || r.reporter_email || 'Anónimo'}
              </p>
              <span className="text-[10px] text-muted">
                · {new Date(r.created_at).toLocaleString('es-ES')}
              </span>
              {r.is_rights_holder && (
                <span className="ml-auto text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                  Titular de derechos
                </span>
              )}
            </div>
            <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">
              {r.description}
            </p>

            {r.is_rights_holder && r.rights_holder_declaration && (
              <div className="mt-4 pt-4 border-t border-hairline-soft">
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <Copyright className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-900 leading-relaxed">
                    El reportante <strong>declara bajo responsabilidad</strong> ser titular
                    de los derechos sobre la obra o representar al titular, conforme al art.
                    17 LPI. Una declaración falsa puede conllevar responsabilidad civil o
                    penal.
                  </p>
                </div>
                {r.contact_info && (
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-muted">
                    <Mail className="w-3 h-3" />
                    Contacto adicional: <span className="text-ink">{r.contact_info}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview del contenido reportado */}
          <div className="rounded-xl border border-hairline bg-canvas p-5">
            <div className="flex items-center gap-2 mb-4">
              <TargetIcon className="w-4 h-4 text-muted" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Contenido reportado · {REPORT_TARGET_LABELS[r.target_type]}
              </p>
            </div>

            {targetData ? (
              <div className="flex items-start gap-4">
                {targetData.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={targetData.thumbnail}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover border border-hairline flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-ink">{targetData.name}</p>
                  <p className="text-[11px] text-muted mt-0.5">ID: {r.target_id}</p>
                  <Link
                    href={targetData.url}
                    target="_blank"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-ink hover:underline"
                  >
                    Ver perfil público <ExternalLink className="w-3 h-3" />
                  </Link>
                  {r.target_url && r.target_url !== targetData.url && (
                    <a
                      href={r.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-[11px] text-muted hover:text-ink break-all"
                    >
                      URL reportada: {r.target_url}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-surface-soft px-3 py-2">
                <p className="text-xs text-muted">
                  El target no se pudo resolver. ID raw: <code className="text-ink">{r.target_id}</code>
                </p>
                {r.target_url && (
                  <a
                    href={r.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink hover:underline break-all"
                  >
                    URL reportada: {r.target_url} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Estado resuelto: mostrar resolución */}
          {!isOpen && (
            <div className="rounded-xl border border-dashed border-hairline bg-surface-soft p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
                Resolución
              </p>
              <p className="text-sm font-medium text-ink">
                {REPORT_STATUS_LABELS[r.status]}
                {r.resolved_at && (
                  <span className="text-muted font-normal ml-2">
                    · {new Date(r.resolved_at).toLocaleString('es-ES')}
                  </span>
                )}
              </p>
              {r.resolution_action && (
                <p className="text-sm text-body mt-2">{r.resolution_action}</p>
              )}
              {r.resolution_notes && (
                <p className="mt-2 text-sm text-body italic whitespace-pre-wrap">
                  "{r.resolution_notes}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Reportante */}
          <div className="rounded-xl border border-hairline bg-canvas p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
              Reportante
            </p>
            <p className="text-sm font-semibold text-ink">
              {r.reporter_name || reporterProfile?.display_name || '—'}
            </p>
            <p className="text-xs text-body break-all">
              {r.reporter_email || (r.reporter_user_id ? '—' : 'Anónimo (sin email)')}
            </p>
            {r.reporter_user_id ? (
              <Link
                href={`/admin/users?q=${encodeURIComponent(r.reporter_email || '')}`}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"
              >
                Ver en /admin/users <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              <p className="mt-2 text-[11px] text-muted italic">
                Sin cuenta — reporte de tercero
              </p>
            )}
            {r.reporter_ip && (
              <div className="mt-3 pt-3 border-t border-hairline-soft">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted">IP</p>
                <p className="text-[11px] text-body font-mono">{r.reporter_ip}</p>
              </div>
            )}
          </div>

          {/* Metadatos */}
          <div className="rounded-xl border border-hairline bg-canvas p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
              Datos
            </p>
            <dl className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Motivo</dt>
                <dd className="text-ink font-medium">{REPORT_REASON_LABELS[r.reason]}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Tipo de contenido</dt>
                <dd className="text-ink font-medium">{REPORT_TARGET_LABELS[r.target_type]}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Edad</dt>
                <dd className={`font-medium ${overdue ? 'text-red-700' : 'text-ink'}`}>
                  {ageHours < 1
                    ? `${Math.round(ageMs / 1000 / 60)} min`
                    : `${Math.round(ageHours)} h`}
                  {overdue ? ' ⚠' : ''}
                </dd>
              </div>
            </dl>
            <div className="mt-3 pt-3 border-t border-hairline-soft space-y-1">
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <Calendar className="w-3 h-3" />
                Creado: {new Date(r.created_at).toLocaleString('es-ES')}
              </div>
              {r.resolved_at && (
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <Calendar className="w-3 h-3" />
                  Resuelto: {new Date(r.resolved_at).toLocaleString('es-ES')}
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <ReportAdminActions
            report={{
              id: r.id,
              status: r.status,
              resolution_notes: r.resolution_notes,
              resolution_action: r.resolution_action,
            }}
          />

          {/* Nota legal */}
          <div className="rounded-xl border border-hairline-soft bg-surface-soft p-3">
            <div className="flex items-start gap-2">
              <Globe className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-muted">
                Plazo legal de resolución: <strong>{SLA_HOURS}h</strong> (art. 17 LSSI). Documenta la
                decisión en las notas para acreditar diligencia ante reclamaciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
