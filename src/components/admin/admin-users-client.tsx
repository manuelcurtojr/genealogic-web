'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import AdminUserPanel from './admin-user-panel'
import { pastelByName } from '@/lib/avatars'
import { Img } from '@/components/ui/img'

interface Props { initialUsers: any[] }

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: '#EF4444' },
  breeder: { label: 'Criador', color: '#D74709' },
  owner: { label: 'Propietario', color: '#6B7280' },
}

export default function AdminUsersClient({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [panelUserId, setPanelUserId] = useState<string | null>(null)

  const filtered = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (u.display_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    }
    return true
  })

  const updateRole = async (userId: string, newRole: string) => {
    // Server action en lugar de cliente directo → el cambio queda
    // registrado en admin_audit_log con before/after.
    try {
      const { adminChangeUserRoleAction } = await import('@/lib/admin/profile-actions')
      await adminChangeUserRoleAction({ userId, newRole: newRole as 'admin' | 'breeder' | 'owner' })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (e) {
      alert((e as Error).message || 'Error al cambiar rol')
    }
    setEditingRole(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted text-sm">{users.length} usuarios registrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full bg-canvas border border-hairline rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition" />
        </div>
        {/* Fix bug: el filtro antes ofrecía 'pro' y 'free' como roles, pero
            profiles.role solo toma los valores admin/breeder/owner. El filtro
            quedaba siempre vacío. Ahora coincide con los valores reales. */}
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-surface-card border border-hairline rounded-lg px-3 py-2.5 text-sm text-body focus:border-ink focus:outline-none transition appearance-none">
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="breeder">Criador</option>
          <option value="owner">Propietario</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline">
              <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">Usuario</th>
              <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">Rol</th>
              <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">País</th>
              <th className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.owner
              return (
                <tr key={u.id} className="border-b border-hairline hover:bg-surface-card transition cursor-pointer" onClick={() => setPanelUserId(u.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={u.avatar_url ? undefined : { backgroundColor: pastelByName(u.display_name || u.email) }}
                      >
                        {u.avatar_url ? <Img w={120} src={u.avatar_url} alt="" className="w-full h-full object-cover" /> :
                          <span className="text-white text-xs font-bold">{(u.display_name || u.email || '?')[0].toUpperCase()}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.display_name || 'Sin nombre'}</p>
                        <p className="text-[10px] text-muted truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingRole === u.id ? (
                      <div className="flex gap-1">
                        {['owner', 'breeder', 'admin'].map(r => (
                          <button key={r} onClick={() => updateRole(u.id, r)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-full transition ${
                              u.role === r ? 'ring-2 ring-white/30' : ''
                            }`} style={{ background: ROLE_CONFIG[r].color + '20', color: ROLE_CONFIG[r].color }}>
                            {ROLE_CONFIG[r].label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button onClick={() => setEditingRole(u.id)}
                        className="text-[10px] font-bold px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition"
                        style={{ background: rc.color + '20', color: rc.color }}>
                        {rc.label}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{u.country || '—'}</td>
                  <td className="px-4 py-3 text-[10px] text-muted">
                    {new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    {/* Link a /admin/users/[id] (vista 360). stopPropagation
                        para que no se dispare el onClick de la <tr> que abre
                        el panel de edición. */}
                    <a
                      href={`/admin/users/${u.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas px-2 py-1 text-[10.5px] font-semibold text-body hover:text-ink hover:border-ink/30 transition"
                      title="Ver vista 360"
                    >
                      360 →
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 text-muted text-sm">Sin resultados</p>}
      </div>

      <AdminUserPanel
        open={!!panelUserId}
        onClose={() => setPanelUserId(null)}
        onSaved={async () => {
          const supabase = createClient()
          const { data } = await supabase.from('profiles').select('id, display_name, email, role, created_at, country, city, avatar_url, status').order('created_at', { ascending: false })
          setUsers(data || [])
        }}
        userId={panelUserId}
      />
    </div>
  )
}
