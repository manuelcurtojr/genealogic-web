/**
 * /admin/audit — Feed inmutable de acciones del super admin.
 *
 * Lista cronológica de impersonate, delete, role/status change, claim
 * resolve, settings change. Cada fila muestra quién, qué, sobre qué
 * target, cuándo, con qué IP.
 *
 * Solo admins (RLS de admin_audit_log restringe SELECT a admin role).
 *
 * Imprescindible para forensics post-incidente y due-diligence de venta:
 * "demuestra que las acciones admin son trazables".
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, UserCog, Trash2, KeyRound, ToggleLeft, Settings, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Audit log · Admin · Genealogic' }

const PAGE_SIZE = 100

const ACTION_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  impersonate: { label: 'Impersonó', color: 'text-blue-600 bg-blue-50', icon: UserCog },
  delete_user: { label: 'Borró usuario', color: 'text-rose-700 bg-rose-50', icon: Trash2 },
  delete_dog: { label: 'Borró perro', color: 'text-rose-700 bg-rose-50', icon: Trash2 },
  delete_kennel: { label: 'Borró criadero', color: 'text-rose-700 bg-rose-50', icon: Trash2 },
  role_change: { label: 'Cambió rol', color: 'text-amber-700 bg-amber-50', icon: UserCog },
  status_change: { label: 'Cambió estado', color: 'text-amber-700 bg-amber-50', icon: ToggleLeft },
  password_reset: { label: 'Reset password', color: 'text-purple-700 bg-purple-50', icon: KeyRound },
  password_set: { label: 'Fijó password', color: 'text-purple-700 bg-purple-50', icon: KeyRound },
  claim_approve: { label: 'Aprobó claim', color: 'text-emerald-700 bg-emerald-50', icon: ShieldAlert },
  claim_reject: { label: 'Rechazó claim', color: 'text-rose-700 bg-rose-50', icon: ShieldAlert },
  claim_resolve: { label: 'Resolvió claim', color: 'text-emerald-700 bg-emerald-50', icon: ShieldAlert },
  settings_change: { label: 'Cambió settings', color: 'text-indigo-700 bg-indigo-50', icon: Settings },
  transfer_dog: { label: 'Transfirió perro', color: 'text-indigo-700 bg-indigo-50', icon: ExternalLink },
  transfer_kennel: { label: 'Transfirió criadero', color: 'text-indigo-700 bg-indigo-50', icon: ExternalLink },
  edit_profile: { label: 'Editó perfil', color: 'text-gray-700 bg-gray-100', icon: UserCog },
  edit_kennel: { label: 'Editó criadero', color: 'text-gray-700 bg-gray-100', icon: UserCog },
  edit_dog: { label: 'Editó perro', color: 'text-gray-700 bg-gray-100', icon: UserCog },
}

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'ahora mismo'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const days = Math.floor(h / 24)
  if (days < 7) return `hace ${days} día${days === 1 ? '' : 's'}`
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; admin?: string }>
}) {
  const { action: filterAction, admin: filterAdmin } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // No usamos auto-join con profiles porque la FK admin_id va a auth.users,
  // no a public.profiles → PostgREST no encadena el join y devuelve null.
  // Hacemos lookup separado de los admin profiles en batch.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('admin_audit_log')
    .select('id, admin_id, action, target_table, target_id, payload, ip, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (filterAction) query = query.eq('action', filterAction)
  if (filterAdmin) query = query.eq('admin_id', filterAdmin)

  const { data: rows } = await query

  // Cargar profiles de los admin_ids en batch (1 query)
  const adminIds = Array.from(new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((rows || []) as any[]).map(r => r.admin_id).filter(Boolean)
  ))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileMap = new Map<string, any>()
  if (adminIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .in('id', adminIds)
    for (const p of (profiles || []) as Array<{ id: string; email: string; display_name: string }>) {
      profileMap.set(p.id, p)
    }
  }
  // Enriquecemos cada row con su admin profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = ((rows || []) as any[]).map(r => ({
    ...r,
    admin: r.admin_id ? profileMap.get(r.admin_id) || null : null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Plataforma</p>
        <h1 className="mt-1.5 text-[28px] sm:text-[36px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          Audit log
        </h1>
        <p className="mt-2 text-[14px] text-body">
          Registro inmutable de acciones del super admin. Inmutable y trazable.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-muted">Filtros:</span>
        {filterAction && (
          <Link
            href="/admin/audit"
            className="inline-flex items-center gap-1 rounded-full bg-surface-card px-2.5 py-1 text-[11.5px] text-ink"
          >
            Acción: {ACTION_META[filterAction]?.label || filterAction} ×
          </Link>
        )}
        {filterAdmin && (
          <Link
            href="/admin/audit"
            className="inline-flex items-center gap-1 rounded-full bg-surface-card px-2.5 py-1 text-[11.5px] text-ink"
          >
            Admin específico ×
          </Link>
        )}
        {!filterAction && !filterAdmin && (
          <span className="text-[12px] text-muted/70">Sin filtros — mostrando últimas {PAGE_SIZE} acciones</span>
        )}
      </div>

      {/* Listado */}
      {enriched.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-12 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-[14px] text-body">
            Aún no hay acciones registradas. Cuando un admin haga algo, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
          <ul className="divide-y divide-hairline">
            {enriched.map(row => {
              const meta = ACTION_META[row.action] || { label: row.action, color: 'text-gray-700 bg-gray-100', icon: ShieldAlert }
              const Icon = meta.icon
              const adminEmail = row.admin?.email || null
              const adminName = row.admin?.display_name || null
              return (
                <li key={row.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-soft transition-colors">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[13.5px] font-semibold text-ink">{meta.label}</span>
                      {row.target_table && row.target_id && (
                        <code className="text-[11px] text-muted bg-surface-soft px-1.5 py-0.5 rounded">
                          {row.target_table}/{(row.target_id as string).slice(0, 8)}
                        </code>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted">
                      Por <span className="text-ink">{adminName || adminEmail || 'admin'}</span>
                      {' · '}
                      <span title={new Date(row.created_at).toLocaleString('es-ES')}>{relativeTime(row.created_at)}</span>
                      {row.ip && (
                        <>
                          {' · '}
                          <span className="font-mono text-[10.5px]">{row.ip}</span>
                        </>
                      )}
                    </p>
                    {row.payload && Object.keys(row.payload).length > 0 && (
                      <details className="mt-1.5">
                        <summary className="text-[11px] text-muted cursor-pointer hover:text-ink">
                          Payload ↓
                        </summary>
                        <pre className="mt-1.5 text-[11px] text-body bg-surface-soft p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(row.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
