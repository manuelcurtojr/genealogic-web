/**
 * /admin/solicitudes — bandeja unificada de soporte + claims.
 *
 * Filtros por type, status, priority. Por defecto muestra todas las
 * "abiertas" (no resueltas) ordenadas por created_at DESC.
 */
import Link from 'next/link'
import { createKennelAdminClient } from '@/lib/supabase/server'
import {
  type AdminRequest,
  TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from '@/lib/admin-requests/types'
import { Inbox, Filter, ArrowRight, Dog, Store, MessageSquare, Sparkles, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

type SearchParams = {
  type?: string
  status?: string
  priority?: string
  scope?: 'open' | 'all' | 'resolved'
}

export default async function AdminSolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const scope = sp.scope || 'open'

  let query = admin
    .from('admin_requests')
    .select(`
      id, type, status, priority, subject, message, source,
      requester_email, requester_name, requester_user_id,
      target_dog_id, target_kennel_id,
      created_at, updated_at, resolved_at,
      target_dog:dogs!admin_requests_target_dog_id_fkey(id, name, slug),
      target_kennel:kennels!admin_requests_target_kennel_id_fkey(id, name, slug)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (sp.type) query = query.eq('type', sp.type)
  if (sp.status) query = query.eq('status', sp.status)
  if (sp.priority) query = query.eq('priority', sp.priority)
  if (scope === 'open') query = query.in('status', ['pending', 'reviewing', 'awaiting_user'])
  if (scope === 'resolved') query = query.in('status', ['approved', 'rejected', 'cancelled'])

  const { data: requests } = await query

  // Stats rápidas
  const { data: statsRaw } = await admin
    .from('admin_requests')
    .select('status, type, priority')

  const stats = {
    total: statsRaw?.length || 0,
    pending: statsRaw?.filter((r: { status: string }) => r.status === 'pending').length || 0,
    reviewing: statsRaw?.filter((r: { status: string }) => r.status === 'reviewing').length || 0,
    urgent: statsRaw?.filter((r: { priority: string }) => r.priority === 'urgent').length || 0,
    support: statsRaw?.filter((r: { type: string }) => r.type === 'support').length || 0,
    claims: statsRaw?.filter((r: { type: string }) => r.type.startsWith('claim_')).length || 0,
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Inbox className="w-6 h-6 text-ink" />
        <div>
          <h1 className="text-2xl font-bold text-ink">Solicitudes</h1>
          <p className="text-sm text-muted">Soporte humano y reclamaciones de perros/criaderos.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
        <StatPill label="Total" value={stats.total} />
        <StatPill label="Pendientes" value={stats.pending} accent="amber" />
        <StatPill label="En revisión" value={stats.reviewing} accent="blue" />
        <StatPill label="Urgentes" value={stats.urgent} accent="red" />
        <StatPill label="Soporte" value={stats.support} icon={MessageSquare} />
        <StatPill label="Claims" value={stats.claims} icon={Sparkles} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        <Filter className="w-3.5 h-3.5 text-muted" />
        <ScopeTab current={scope} value="open" label="Abiertas" sp={sp} />
        <ScopeTab current={scope} value="resolved" label="Resueltas" sp={sp} />
        <ScopeTab current={scope} value="all" label="Todas" sp={sp} />
        <span className="mx-2 text-muted">|</span>
        <TypeTab current={sp.type} value="" label="Cualquier tipo" sp={sp} />
        <TypeTab current={sp.type} value="support" label="Soporte" sp={sp} />
        <TypeTab current={sp.type} value="claim_dog" label="Perros" sp={sp} />
        <TypeTab current={sp.type} value="claim_kennel" label="Criaderos" sp={sp} />
      </div>

      {/* Lista */}
      {!requests || requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft py-16 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-sm text-body">No hay solicitudes que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
          <table className="w-full text-sm">
            <thead className="bg-surface-soft text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="text-left py-2.5 px-4 font-semibold">Tipo</th>
                <th className="text-left py-2.5 px-4 font-semibold">Asunto / Target</th>
                <th className="text-left py-2.5 px-4 font-semibold">Solicitante</th>
                <th className="text-left py-2.5 px-4 font-semibold">Estado</th>
                <th className="text-left py-2.5 px-4 font-semibold">Prioridad</th>
                <th className="text-right py-2.5 px-4 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {(requests as (AdminRequest & {
                target_dog?: { id: string; name: string; slug: string | null } | null
                target_kennel?: { id: string; name: string; slug: string | null } | null
              })[]).map((r) => {
                const isClaim = r.type !== 'support'
                const TypeIcon = r.type === 'claim_dog' ? Dog : r.type === 'claim_kennel' ? Store : MessageSquare
                return (
                  <tr key={r.id} className="hover:bg-surface-soft">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-ink" />
                        <span className="text-xs font-medium text-body">{TYPE_LABELS[r.type]}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/admin/solicitudes/${r.id}`} className="block">
                        <p className="text-sm font-semibold text-ink truncate max-w-md">{r.subject}</p>
                        {isClaim && (r.target_dog || r.target_kennel) && (
                          <p className="text-[11px] text-muted truncate max-w-md mt-0.5">
                            {r.target_dog
                              ? <>→ Perro: <span className="font-medium">{r.target_dog.name}</span></>
                              : <>→ Criadero: <span className="font-medium">{r.target_kennel?.name}</span></>}
                          </p>
                        )}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-medium text-ink truncate max-w-[180px]">
                        {r.requester_name || '—'}
                      </p>
                      <p className="text-[11px] text-muted truncate max-w-[180px]">{r.requester_email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${PRIORITY_COLORS[r.priority]}`}>
                        {PRIORITY_LABELS[r.priority]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/solicitudes/${r.id}`} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
                        <Clock className="w-3 h-3" />
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any
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
      <p className={`text-2xl font-bold tabular-nums px-2 py-0.5 rounded inline-block ${color}`}>{value}</p>
    </div>
  )
}

function ScopeTab({ current, value, label, sp }: {
  current: string
  value: 'open' | 'all' | 'resolved'
  label: string
  sp: SearchParams
}) {
  const qs = new URLSearchParams()
  if (sp.type) qs.set('type', sp.type)
  if (sp.status) qs.set('status', sp.status)
  if (sp.priority) qs.set('priority', sp.priority)
  qs.set('scope', value)
  const active = current === value
  return (
    <Link
      href={`/admin/solicitudes?${qs.toString()}`}
      className={`px-2.5 py-1 rounded-md font-medium transition ${
        active ? 'bg-ink text-on-primary' : 'text-body hover:bg-surface-card'
      }`}
    >
      {label}
    </Link>
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
  if (sp.status) qs.set('status', sp.status)
  if (sp.priority) qs.set('priority', sp.priority)
  if (sp.scope) qs.set('scope', sp.scope)
  const active = (current || '') === value
  return (
    <Link
      href={`/admin/solicitudes?${qs.toString()}`}
      className={`px-2.5 py-1 rounded-md font-medium transition ${
        active ? 'bg-ink text-on-primary' : 'text-body hover:bg-surface-card'
      }`}
    >
      {label}
    </Link>
  )
}
