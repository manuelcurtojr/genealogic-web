'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import AdminUserPanel from './admin-user-panel'

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
    const supabase = createClient()
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    setEditingRole(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-fg-mute text-sm">{users.length} usuarios registrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-mute" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full bg-chip border border-hair rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-chip border border-hair rounded-lg px-3 py-2.5 text-sm text-fg-dim focus:border-[#D74709] focus:outline-none transition appearance-none">
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="pro">Pro</option>
          <option value="free">Free</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-chip border border-hair rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hair">
              <th className="text-left text-[10px] font-semibold text-fg-mute uppercase tracking-wider px-4 py-3">Usuario</th>
              <th className="text-left text-[10px] font-semibold text-fg-mute uppercase tracking-wider px-4 py-3">Rol</th>
              <th className="text-left text-[10px] font-semibold text-fg-mute uppercase tracking-wider px-4 py-3">País</th>
              <th className="text-left text-[10px] font-semibold text-fg-mute uppercase tracking-wider px-4 py-3">Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.owner
              return (
                <tr key={u.id} className="border-b border-hair hover:bg-ink-800 transition cursor-pointer" onClick={() => setPanelUserId(u.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-chip border border-hair flex-shrink-0">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center text-[#D74709] text-xs font-bold">{(u.display_name || u.email || '?')[0].toUpperCase()}</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.display_name || 'Sin nombre'}</p>
                        <p className="text-[10px] text-fg-mute truncate">{u.email}</p>
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
                  <td className="px-4 py-3 text-xs text-fg-mute">{u.country || '—'}</td>
                  <td className="px-4 py-3 text-[10px] text-fg-mute">
                    {new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 text-fg-mute text-sm">Sin resultados</p>}
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
