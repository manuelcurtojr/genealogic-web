import { createClient } from '@/lib/supabase/server'
import { Users, Dog, Store, Baby, Stethoscope, FileText } from 'lucide-react'
import { pastelByName } from '@/lib/avatars'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [usersRes, dogsRes, kennelsRes, littersRes, vetRes, breedsRes, recentUsersRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('dogs').select('id', { count: 'exact', head: true }),
    supabase.from('kennels').select('id', { count: 'exact', head: true }),
    supabase.from('litters').select('id', { count: 'exact', head: true }),
    supabase.from('vet_reminders').select('id', { count: 'exact', head: true }),
    supabase.from('breeds').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, display_name, email, role, created_at').order('created_at', { ascending: false }).limit(10),
  ])

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
