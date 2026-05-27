/**
 * Detalle de una admin_request en el panel de admin.
 *
 * Layout 2 columnas: izquierda = thread + form respuesta; derecha = panel
 * lateral con metadatos, evidencias y acciones (status/priority/aprobar/
 * rechazar). Cargas son SSR; las acciones son client components via
 * `AdminRequestActions`.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createKennelAdminClient } from '@/lib/supabase/server'
import {
  TYPE_LABELS, STATUS_LABELS, PRIORITY_LABELS,
  STATUS_COLORS, PRIORITY_COLORS,
  type AdminRequest, type AdminRequestMessage, type EvidenceFile,
} from '@/lib/admin-requests/types'
import AdminRequestActions from '@/components/admin-requests/admin-request-actions'
import AdminRequestReply from '@/components/admin-requests/admin-request-reply'
import EvidenceList from '@/components/admin-requests/evidence-list'
import { ArrowLeft, MessageSquare, Dog, Store, ExternalLink, User, Calendar, Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // Cargamos request + targets sin intentar join con profiles vía PostgREST:
  // la FK requester_user_id apunta a auth.users, no a public.profiles, así
  // que PostgREST devolvía null y la page caía a notFound() → 404. Hacemos
  // el lookup del profile en una query separada.
  const { data: req } = await admin
    .from('admin_requests')
    .select(`
      *,
      target_dog:dogs!admin_requests_target_dog_id_fkey(id, name, slug, owner_id),
      target_kennel:kennels!admin_requests_target_kennel_id_fkey(id, name, slug, owner_id)
    `)
    .eq('id', id)
    .single()

  if (!req) notFound()

  // Lookup paralelo del profile del solicitante (FK va a auth.users — PostgREST
  // no encadena auto el join con profiles).
  let requester_profile: { display_name: string | null; email: string | null; avatar_url: string | null } | null = null
  if (req.requester_user_id) {
    const { data: prof } = await admin
      .from('profiles')
      .select('display_name, email, avatar_url')
      .eq('id', req.requester_user_id)
      .maybeSingle()
    requester_profile = prof || null
  }

  const r = { ...req, requester_profile } as AdminRequest & {
    target_dog?: { id: string; name: string; slug: string | null; owner_id: string | null } | null
    target_kennel?: { id: string; name: string; slug: string | null; owner_id: string | null } | null
    requester_profile?: { display_name: string | null; email: string | null; avatar_url: string | null } | null
  }

  const { data: messages } = await admin
    .from('admin_request_messages')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true })

  const msgs = (messages as AdminRequestMessage[]) || []

  const TypeIcon = r.type === 'claim_dog' ? Dog : r.type === 'claim_kennel' ? Store : MessageSquare

  // Si es un claim, chequeamos si el target sigue sin owner
  const isClaim = r.type !== 'support'
  const target = r.target_dog || r.target_kennel
  const targetAlreadyClaimed = isClaim && !!target?.owner_id

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href="/admin/solicitudes"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Volver a Solicitudes
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center flex-shrink-0">
            <TypeIcon className="w-5 h-5 text-ink" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {TYPE_LABELS[r.type]} · #{r.id.slice(0, 8)}
            </p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold text-ink truncate">{r.subject}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${STATUS_COLORS[r.status]}`}>
            {STATUS_LABELS[r.status]}
          </span>
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${PRIORITY_COLORS[r.priority]}`}>
            {PRIORITY_LABELS[r.priority]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main col */}
        <div className="lg:col-span-2 space-y-5">
          {/* Mensaje inicial */}
          <div className="rounded-xl border border-hairline bg-canvas p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted" />
              <p className="text-xs font-semibold text-ink">
                {r.requester_name || r.requester_email}
              </p>
              <span className="text-[10px] text-muted">
                · {new Date(r.created_at).toLocaleString('es-ES')}
              </span>
            </div>
            <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">{r.message}</p>

            {r.evidence && r.evidence.length > 0 && (
              <div className="mt-4 pt-4 border-t border-hairline-soft">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
                  Evidencias ({r.evidence.length})
                </p>
                <EvidenceList evidence={r.evidence as EvidenceFile[]} />
              </div>
            )}
          </div>

          {/* Thread */}
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl p-5 ${
                m.author_is_admin
                  ? 'bg-blue-50/50 border border-blue-200 ml-6'
                  : 'bg-canvas border border-hairline mr-6'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  m.author_is_admin ? 'bg-blue-200 text-blue-900' : 'bg-surface-card text-ink'
                }`}>
                  {m.author_is_admin ? 'Admin' : 'Usuario'}
                </span>
                <span className="text-[10px] text-muted">
                  {new Date(m.created_at).toLocaleString('es-ES')}
                </span>
              </div>
              <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">{m.body}</p>
            </div>
          ))}

          {/* Reply form */}
          {!['approved', 'rejected', 'cancelled'].includes(r.status) && (
            <AdminRequestReply requestId={r.id} />
          )}

          {['approved', 'rejected', 'cancelled'].includes(r.status) && (
            <div className="rounded-xl border border-dashed border-hairline bg-surface-soft p-4 text-center">
              <p className="text-xs text-muted">
                Esta solicitud está cerrada ({STATUS_LABELS[r.status]}).
              </p>
              {r.resolution_note && (
                <p className="text-sm text-body mt-2 italic">"{r.resolution_note}"</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info solicitante */}
          <div className="rounded-xl border border-hairline bg-canvas p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
              Solicitante
            </p>
            <p className="text-sm font-semibold text-ink">{r.requester_name || '—'}</p>
            <p className="text-xs text-body break-all">{r.requester_email}</p>
            {r.requester_user_id && (
              <Link
                href={`/admin/users?q=${r.requester_email}`}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"
              >
                Ver en /admin/users <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Target (claim) */}
          {isClaim && (
            <div className="rounded-xl border border-hairline bg-canvas p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
                Reclamación de
              </p>
              {r.target_dog && (
                <>
                  <p className="text-sm font-semibold text-ink">{r.target_dog.name}</p>
                  <p className="text-[11px] text-muted">Perro</p>
                  <Link
                    href={`/dogs/${r.target_dog.slug || r.target_dog.id}`}
                    target="_blank"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"
                  >
                    Ver perfil público <ExternalLink className="w-3 h-3" />
                  </Link>
                </>
              )}
              {r.target_kennel && (
                <>
                  <p className="text-sm font-semibold text-ink">{r.target_kennel.name}</p>
                  <p className="text-[11px] text-muted">Criadero</p>
                  <Link
                    href={`/kennels/${r.target_kennel.slug || r.target_kennel.id}`}
                    target="_blank"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"
                  >
                    Ver perfil público <ExternalLink className="w-3 h-3" />
                  </Link>
                </>
              )}
              {targetAlreadyClaimed && (
                <p className="mt-3 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                  ⚠ Este target YA tiene owner asignado. Aprobar transferirá ownership.
                </p>
              )}
            </div>
          )}

          {/* Source */}
          <div className="rounded-xl border border-hairline bg-canvas p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
              Origen
            </p>
            <div className="flex items-center gap-2 text-xs text-body">
              <Globe className="w-3.5 h-3.5 text-muted" />
              <span className="font-medium">{r.source}</span>
            </div>
            {r.source_url && (
              <a href={r.source_url} target="_blank" className="mt-1 block text-[11px] text-muted hover:text-ink break-all">
                {r.source_url}
              </a>
            )}
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
              <Calendar className="w-3 h-3" />
              Creada: {new Date(r.created_at).toLocaleString('es-ES')}
            </div>
            {r.resolved_at && (
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                <Calendar className="w-3 h-3" />
                Resuelta: {new Date(r.resolved_at).toLocaleString('es-ES')}
              </div>
            )}
          </div>

          {/* Acciones (status/priority/aprobar/rechazar) */}
          <AdminRequestActions
            request={{
              id: r.id,
              type: r.type,
              status: r.status,
              priority: r.priority,
              adminNotes: r.admin_notes || '',
            }}
          />
        </div>
      </div>
    </div>
  )
}
