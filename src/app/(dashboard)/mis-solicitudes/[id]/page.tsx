/**
 * /mis-solicitudes/[id] — detalle de UNA solicitud del user.
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

export const dynamic = 'force-dynamic'

export default async function MiSolicitudDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/mis-solicitudes/${id}`)

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
    // El grupo (dashboard) ya aporta el padding del shell. El link "volver
    // a mis solicitudes" SÍ se mantiene: es navegación contextual detalle→lista.
    <div className="max-w-3xl mx-auto">
      <Link href="/mis-solicitudes" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Volver a mis solicitudes
      </Link>

      {sp.created === '1' && (
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 mb-5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-900">Solicitud enviada</p>
            <p className="text-xs text-emerald-800">
              Un admin la revisará en menos de 72h. Te avisaremos por email cuando tengamos novedades.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center flex-shrink-0">
          <TypeIcon className="w-5 h-5 text-ink" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted">
              {TYPE_LABELS[r.type]}
            </p>
            <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${STATUS_COLORS[r.status]}`}>
              {STATUS_LABELS[r.status]}
            </span>
          </div>
          <h1 className="text-xl font-bold text-ink">{r.subject}</h1>
          {(r.target_dog || r.target_kennel) && (
            <p className="text-xs text-muted mt-0.5">
              → {r.target_dog?.name || r.target_kennel?.name}
            </p>
          )}
        </div>
      </div>

      {/* Estado resuelto */}
      {r.status === 'approved' && (
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 mb-5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-900">
              {r.type === 'support' ? 'Resuelta' : '¡Reclamación aprobada!'}
            </p>
            {r.type !== 'support' && (
              <p className="text-xs text-emerald-800 mt-0.5">
                Ya eres el propietario oficial.
                {r.target_dog && (
                  <Link href={`/dogs/${r.target_dog.slug || r.target_dog.id}`} className="ml-1 underline font-semibold">
                    Ver el perro →
                  </Link>
                )}
                {r.target_kennel && (
                  <Link href={`/kennels/${r.target_kennel.slug || r.target_kennel.id}`} className="ml-1 underline font-semibold">
                    Ver el criadero →
                  </Link>
                )}
              </p>
            )}
            {r.resolution_note && (
              <p className="text-xs text-emerald-800 mt-2 italic">"{r.resolution_note}"</p>
            )}
          </div>
        </div>
      )}

      {r.status === 'rejected' && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50/50 px-4 py-3 mb-5 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-red-900">Solicitud rechazada</p>
            {r.resolution_note && (
              <p className="text-xs text-red-800 mt-1">{r.resolution_note}</p>
            )}
            <Link href="/soporte" className="mt-2 inline-block text-xs font-semibold text-red-900 underline">
              Contactar soporte si crees que es un error →
            </Link>
          </div>
        </div>
      )}

      {/* Thread */}
      <div className="space-y-4">
        {/* Mensaje inicial */}
        <div className="rounded-xl border border-hairline bg-canvas p-5">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-3.5 h-3.5 text-muted" />
            <p className="text-xs font-semibold text-ink">Tú</p>
            <span className="text-[10px] text-muted">
              · {new Date(r.created_at).toLocaleString('es-ES')}
            </span>
          </div>
          <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">{r.message}</p>
          {r.evidence && r.evidence.length > 0 && (
            <div className="mt-3 pt-3 border-t border-hairline-soft">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-2">
                Evidencias enviadas ({r.evidence.length})
              </p>
              <EvidenceList evidence={r.evidence as EvidenceFile[]} />
            </div>
          )}
        </div>

        {msgs.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl p-4 ${
              m.author_is_admin
                ? 'bg-blue-50/50 border border-blue-200 mr-6'
                : 'bg-canvas border border-hairline ml-6'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                m.author_is_admin ? 'bg-blue-200 text-blue-900' : 'bg-surface-card text-ink'
              }`}>
                {m.author_is_admin ? 'Equipo Genealogic' : 'Tú'}
              </span>
              <span className="text-[10px] text-muted">
                {new Date(m.created_at).toLocaleString('es-ES')}
              </span>
            </div>
            <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">{m.body}</p>
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
