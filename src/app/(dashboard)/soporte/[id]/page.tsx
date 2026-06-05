/**
 * /soporte/[id] — detalle de UNA solicitud del user.
 *
 * (Movido desde /mis-solicitudes/[id] al fusionar Soporte en una sola página.)
 *
 * El user puede:
 *  - Ver el thread con el admin
 *  - Responder
 *  - Ver el estado y la resolución (si está cerrada)
 *  - Cancelar (si está abierta)
 */
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  TYPE_LABELS, STATUS_LABELS, STATUS_COLORS,
  type AdminRequest, type AdminRequestMessage, type EvidenceFile,
} from '@/lib/admin-requests/types'
import UserRequestActions from '@/components/admin-requests/user-request-actions'
import EvidenceList from '@/components/admin-requests/evidence-list'
import { ArrowLeft, Dog, Store, MessageSquare, CheckCircle2, XCircle, User } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

export default async function MiSolicitudDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}) {
  const t = getTranslator(await getLocale())
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/soporte/${id}`)

  const { data: req } = await supabase
    .from('admin_requests')
    .select(`
      *,
      target_dog:dogs!admin_requests_target_dog_id_fkey(id, name, slug),
      target_kennel:kennels!admin_requests_target_kennel_id_fkey(id, name, slug)
    `)
    .eq('id', id)
    .eq('requester_user_id', user.id)
    .single()

  if (!req) notFound()

  const r = req as AdminRequest & {
    target_dog?: { id: string; name: string; slug: string | null } | null
    target_kennel?: { id: string; name: string; slug: string | null } | null
  }

  const { data: messages } = await supabase
    .from('admin_request_messages')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true })

  const msgs = (messages as AdminRequestMessage[]) || []

  const TypeIcon = r.type === 'claim_dog' ? Dog : r.type === 'claim_kennel' ? Store : MessageSquare
  const isClosed = ['approved', 'rejected', 'cancelled'].includes(r.status)

  return (
    // El grupo (dashboard) ya aporta el padding del shell. El link "volver a
    // Soporte" SÍ se mantiene: es navegación contextual detalle → lista.
    <div className="max-w-3xl space-y-5">
      <Link
        href="/soporte?tab=solicitudes"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t('Volver a Soporte')}
      </Link>

      {sp.created === '1' && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-700" />
          <div>
            <p className="text-sm font-bold text-emerald-900">{t('Solicitud enviada')}</p>
            <p className="text-xs text-emerald-800">
              {t('Un admin la revisará en menos de 72h. Te avisaremos por email cuando tengamos novedades.')}
            </p>
          </div>
        </div>
      )}

      {/* Cabecera de la solicitud — chip tintado + tipo + estado */}
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
          <TypeIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
              {TYPE_LABELS[r.type]}
            </p>
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[r.status]}`}>
              {STATUS_LABELS[r.status]}
            </span>
          </div>
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-ink">{r.subject}</h1>
          {(r.target_dog || r.target_kennel) && (
            <p className="mt-0.5 text-[12px] text-muted">
              → {r.target_dog?.name || r.target_kennel?.name}
            </p>
          )}
        </div>
      </div>

      {/* Estado resuelto */}
      {r.status === 'approved' && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-900">
              {r.type === 'support' ? t('Resuelta') : t('¡Reclamación aprobada!')}
            </p>
            {r.type !== 'support' && (
              <p className="mt-0.5 text-xs text-emerald-800">
                {t('Ya eres el propietario oficial.')}
                {r.target_dog && (
                  <Link href={`/dogs/${r.target_dog.slug || r.target_dog.id}`} className="ml-1 font-semibold underline">
                    {t('Ver el perro')} →
                  </Link>
                )}
                {r.target_kennel && (
                  <Link href={`/kennels/${r.target_kennel.slug || r.target_kennel.id}`} className="ml-1 font-semibold underline">
                    {t('Ver el criadero')} →
                  </Link>
                )}
              </p>
            )}
            {r.resolution_note && (
              <p className="mt-2 text-xs italic text-emerald-800">&quot;{r.resolution_note}&quot;</p>
            )}
          </div>
        </div>
      )}

      {r.status === 'rejected' && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/50 px-4 py-3">
          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-red-900">{t('Solicitud rechazada')}</p>
            {r.resolution_note && (
              <p className="mt-1 text-xs text-red-800">{r.resolution_note}</p>
            )}
            <Link href="/soporte?tab=nueva" className="mt-2 inline-block text-xs font-semibold text-red-900 underline">
              {t('Contactar soporte si crees que es un error')} →
            </Link>
          </div>
        </div>
      )}

      {/* Thread */}
      <div className="space-y-4">
        {/* Mensaje inicial */}
        <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
          <div className="mb-2 flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted" />
            <p className="text-xs font-semibold text-ink">{t('Tú')}</p>
            <span className="text-[10px] text-muted">
              · {new Date(r.created_at).toLocaleString('es-ES')}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">{r.message}</p>
          {r.evidence && r.evidence.length > 0 && (
            <div className="mt-3 border-t border-hairline-soft pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {t('Evidencias enviadas')} ({r.evidence.length})
              </p>
              <EvidenceList evidence={r.evidence as EvidenceFile[]} />
            </div>
          )}
        </div>

        {msgs.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl p-4 sm:p-5 ${
              m.author_is_admin
                ? 'mr-6 border border-blue-200 bg-blue-50/50'
                : 'ml-6 border border-hairline bg-canvas'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                m.author_is_admin ? 'bg-blue-200 text-blue-900' : 'bg-surface-card text-ink'
              }`}>
                {m.author_is_admin ? t('Equipo Genealogic') : t('Tú')}
              </span>
              <span className="text-[10px] text-muted">
                {new Date(m.created_at).toLocaleString('es-ES')}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">{m.body}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      {!isClosed && (
        <UserRequestActions requestId={r.id} status={r.status} />
      )}
    </div>
  )
}
