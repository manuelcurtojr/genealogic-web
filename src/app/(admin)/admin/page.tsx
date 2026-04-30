import { createClient } from '@/lib/supabase/server'
import { Users, Dog, Store, Baby, Stethoscope, FileText } from 'lucide-react'

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
    { label: 'Usuarios', value: usersRes.count || 0, icon: Users, color: '#D74709' },
    { label: 'Perros', value: dogsRes.count || 0, icon: Dog, color: '#3B82F6' },
    { label: 'Criaderos', value: kennelsRes.count || 0, icon: Store, color: '#10B981' },
    { label: 'Camadas', value: littersRes.count || 0, icon: Baby, color: '#8B5CF6' },
    { label: 'Razas', value: breedsRes.count || 0, icon: FileText, color: '#EC4899' },
    { label: 'Recordatorios vet.', value: vetRes.count || 0, icon: Stethoscope, color: '#6366F1' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Panel de administración</h1>
      <p className="text-fg-mute text-sm mb-6">Vista general de la plataforma Genealogic</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-chip border border-hair rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.color + '15' }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold">{s.value.toLocaleString('es-ES')}</p>
              <p className="text-[10px] text-fg-mute">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="bg-chip border border-hair rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Últimos usuarios registrados</h2>
        <div className="space-y-2">
          {(recentUsersRes.data || []).map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 bg-chip rounded-lg p-3">
              <div className="w-8 h-8 rounded-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-xs font-bold flex-shrink-0">
                {(u.display_name || u.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{u.display_name || 'Sin nombre'}</p>
                <p className="text-[10px] text-fg-mute truncate">{u.email}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                u.role === 'admin' ? 'bg-red-500/15 text-red-400' : u.role === 'breeder' ? 'bg-[#D74709]/15 text-[#D74709]' : 'bg-chip text-fg-mute'
              }`}>{u.role}</span>
              <span className="text-[10px] text-fg-mute">{new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
