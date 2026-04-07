'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Users, Shield, Crown, User, Coins, ChevronDown } from 'lucide-react'

interface Props { initialUsers: any[] }

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: '#EF4444' },
  pro: { label: 'Pro', color: '#8B5CF6' },
  free: { label: 'Free', color: '#6B7280' },
}

export default function AdminUsersClient({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [editingGenes, setEditingGenes] = useState<string | null>(null)
  const [genesAmount, setGenesAmount] = useState('')

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

  const addGenes = async (userId: string) => {
    const amount = parseInt(genesAmount)
    if (!amount || amount === 0) return
    const supabase = createClient()
    const user = users.find(u => u.id === userId)
    const newBalance = (user?.genes || 0) + amount
    await supabase.from('profiles').update({ genes: newBalance }).eq('id', userId)
    await supabase.from('genes_transactions').insert({
      user_id: userId,
      amount: amount,
      type: amount > 0 ? 'admin_grant' : 'admin_deduct',
      description: `Ajuste manual por admin (${amount > 0 ? '+' : ''}${amount})`,
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, genes: newBalance } : u))
    setEditingGenes(null)
    setGenesAmount('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-white/40 text-sm">{users.length} usuarios registrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/60 focus:border-[#D74709] focus:outline-none transition appearance-none">
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="pro">Pro</option>
          <option value="free">Free</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Usuario</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Rol</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Genes</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">País</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.free
              return (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center text-[#D74709] text-xs font-bold">{(u.display_name || u.email || '?')[0].toUpperCase()}</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.display_name || 'Sin nombre'}</p>
                        <p className="text-[10px] text-white/30 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingRole === u.id ? (
                      <div className="flex gap-1">
                        {['free', 'pro', 'admin'].map(r => (
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
                  <td className="px-4 py-3">
                    {editingGenes === u.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={genesAmount} onChange={e => setGenesAmount(e.target.value)}
                          placeholder="+100 / -50"
                          className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-[#D74709] focus:outline-none" />
                        <button onClick={() => addGenes(u.id)} className="text-[10px] text-green-400 hover:text-green-300 font-semibold">OK</button>
                        <button onClick={() => { setEditingGenes(null); setGenesAmount('') }} className="text-[10px] text-white/30 hover:text-white/60">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingGenes(u.id)} className="text-sm font-medium text-white/60 hover:text-[#D74709] transition flex items-center gap-1">
                        <Coins className="w-3 h-3" /> {u.genes || 0}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">{u.country || '—'}</td>
                  <td className="px-4 py-3 text-[10px] text-white/30">
                    {new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 text-white/30 text-sm">Sin resultados</p>}
      </div>
    </div>
  )
}
