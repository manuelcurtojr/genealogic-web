import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, Dog, Store, Baby, Stethoscope, FileText, AlertCircle, ArrowRight } from 'lucide-react'
import { pastelByName } from '@/lib/avatars'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [usersRes, dogsRes, kennelsRes, littersRes, vetRes, breedsRes, recentUsersRes, urgentRes, pendingRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('dogs').select('id', { count: 'exact', head: true }),
    supabase.from('kennels').select('id', { count: 'exact', head: true }),
    supabase.from('litters').select('id', { count: 'exact', head: true }),
    supabase.from('vet_reminders').select('id', { count: 'exact', head: true }),
    supabase.from('breeds').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, display_name, email, role, created_at').order('created_at', { ascending: false }).limit(10),
    // Solicitudes URGENTES sin resolver — alerta principal del admin.
    supabase
      .from('admin_requests')
      .select('id', { count: 'exact', head: true })
      .eq('priority', 'urgent')
      .not('status', 'in', '("approved","rejected","cancelled")'),
    // Solicitudes en estado pending (sin urgencia) — secundario
    supabase
      .from('admin_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const urgentCount = urgentRes.count || 0
  const pendingCount = pendingRes.count || 0

  const stats = [
    { label: 'Usuarios', value: usersRes.count || 0, icon: Users, color: '#fb923c' },
    { label: 'Perros', value: dogsRes.count || 0, icon: Dog, color: '#3b82f6' },
    { label: 'Criaderos', value: kennelsRes.count || 0, icon: Store, color: '#34d399' },
    { label: 'Camadas', value: littersRes.count || 0, icon: Baby, color: '#8b5cf6' },
    { label: 'Razas', value: breedsRes.count || 0, icon: FileText, color: '#ec4899' },
    { label: 'Recordatorios vet.', value: vetRes.count || 0, icon: Stethoscope, color: '#6366f1' },
  ]

  const roleConfig: Record<string, { label: string; cls: string }> = {
    admin: { label: 'admin', cls: 'bg-[color:var(--error)]/10 text-[color:var(--error)]' },
    breeder: { label: 'breeder', cls: 'bg-surface-card text-ink' },
    owner: { label: 'owner', cls: 'bg-surface-card text-muted' },
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Plataforma</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          Panel de administración
        </h1>
        <p className="mt-2 text-[14px] text-body">Vista general de Genealogic.</p>
      </div>

      {/* Banners de acción inmediata — solicitudes urgentes / pendientes */}
      {(urgentCount > 0 || pendingCount > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {urgentCount > 0 && (
            <Link
              href="/admin/solicitudes?priority=urgent"
              className="flex-1 group flex items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 hover:border-rose-400 transition"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-rose-900">
                  {urgentCount} {urgentCount === 1 ? 'solicitud urgente' : 'solicitudes urgentes'}
                </p>
                <p className="text-[12px] text-rose-700">Requieren acción inmediata.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {pendingCount > 0 && (
            <Link
              href="/admin/solicitudes?status=pending"
              className="flex-1 group flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 hover:border-amber-300 transition"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-amber-900">
                  {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
                </p>
                <p className="text-[12px] text-amber-700">Sin revisar todavía.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-hairline bg-canvas p-5">
            <div className="flex items-center gap-2">
              <s.icon className="h-4 w-4" style={{ color: s.color }} />
              <span className="text-[12px] font-medium text-muted">{s.label}</span>
            </div>
            <p className="mt-3 text-[28px] font-semibold tabular-nums tracking-[-0.04em] text-ink leading-none">
              {s.value.toLocaleString('es-ES')}
            </p>
          </div>
        ))}
      </section>

      {/* Recent users */}
      <section>
        <h2 className="mb-4 text-[22px] font-semibold tracking-[-0.04em] text-ink">
          Últimos usuarios registrados
        </h2>
        <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
          <ul className="divide-y divide-hairline-soft">
            {(recentUsersRes.data || []).map((u: any) => {
              const rc = roleConfig[u.role] || roleConfig.owner
              return (
                <li key={u.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-soft">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                    style={{ backgroundColor: pastelByName(u.display_name || u.email) }}
                  >
                    {(u.display_name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">{u.display_name || 'Sin nombre'}</p>
                    <p className="truncate text-[12px] text-muted">{u.email}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${rc.cls}`}>
                    {rc.label}
                  </span>
                  <span className="hidden text-[11.5px] tabular-nums text-muted sm:inline">
                    {new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </div>
  )
}
