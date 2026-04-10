'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Dog, Store, Baby, Stethoscope, Trophy, Edit, Link2, UserPlus, Trash2, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'

interface ActivityItem {
  id: string
  type: string
  action: string
  entityName: string
  entityId?: string
  userName: string
  userId: string
  timestamp: string
  details?: string
}

const PAGE_SIZE = 50

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  dog_created: { icon: Dog, color: 'text-green-400 bg-green-500/10', label: 'Perro creado' },
  dog_edited: { icon: Edit, color: 'text-blue-400 bg-blue-500/10', label: 'Perro editado' },
  dog_imported: { icon: Link2, color: 'text-[#D74709] bg-[#D74709]/10', label: 'Pedigri importado' },
  kennel_created: { icon: Store, color: 'text-purple-400 bg-purple-500/10', label: 'Criadero creado' },
  litter_created: { icon: Baby, color: 'text-pink-400 bg-pink-500/10', label: 'Camada creada' },
  vet_added: { icon: Stethoscope, color: 'text-cyan-400 bg-cyan-500/10', label: 'Registro veterinario' },
  award_added: { icon: Trophy, color: 'text-yellow-400 bg-yellow-500/10', label: 'Premio añadido' },
  user_registered: { icon: UserPlus, color: 'text-green-400 bg-green-500/10', label: 'Usuario registrado' },
}

export default function AdminActivityClient() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchActivity() }, [page, typeFilter])

  async function fetchActivity() {
    setLoading(true)
    const supabase = createClient()
    const all: ActivityItem[] = []

    // Fetch from multiple sources in parallel
    const [dogsRes, changesRes, kennelsRes, littersRes, vetRes, awardsRes, importsRes, usersRes] = await Promise.all([
      // Dogs created
      supabase.from('dogs').select('id, name, owner_id, contributor_id, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(200),
      // Dog changes
      supabase.from('dog_changes').select('id, dog_id, user_id, field_name, old_value, new_value, created_at').order('created_at', { ascending: false }).limit(200),
      // Kennels created
      supabase.from('kennels').select('id, name, owner_id, created_at').order('created_at', { ascending: false }).limit(100),
      // Litters created
      supabase.from('litters').select('id, owner_id, status, created_at, breed:breeds(name)').order('created_at', { ascending: false }).limit(100),
      // Vet records
      supabase.from('vet_records').select('id, dog_id, owner_id, title, type, created_at').order('created_at', { ascending: false }).limit(100),
      // Awards
      supabase.from('awards').select('id, dog_id, owner_id, award_type, event_name, created_at').order('created_at', { ascending: false }).limit(100),
      // Imports
      supabase.from('notifications').select('id, user_id, title, message, created_at').eq('type', 'import').order('created_at', { ascending: false }).limit(100),
      // Users
      supabase.from('profiles').select('id, display_name, email, created_at').order('created_at', { ascending: false }).limit(100),
    ])

    // Get all user IDs for name resolution
    const allUserIds = new Set<string>()
    const addUid = (uid: string | null) => { if (uid) allUserIds.add(uid) }
    ;(dogsRes.data || []).forEach(d => { addUid(d.owner_id); addUid(d.contributor_id) })
    ;(changesRes.data || []).forEach(d => addUid(d.user_id))
    ;(kennelsRes.data || []).forEach(d => addUid(d.owner_id))
    ;(littersRes.data || []).forEach(d => addUid(d.owner_id))
    ;(vetRes.data || []).forEach(d => addUid(d.owner_id))
    ;(awardsRes.data || []).forEach(d => addUid(d.owner_id))
    ;(importsRes.data || []).forEach(d => addUid(d.user_id))

    const { data: profiles } = allUserIds.size > 0
      ? await supabase.from('profiles').select('id, display_name').in('id', [...allUserIds])
      : { data: [] }
    const nameMap = new Map((profiles || []).map(p => [p.id, p.display_name || 'Sin nombre']))

    // Get dog names for changes/vet/awards
    const dogIds = new Set<string>()
    ;(changesRes.data || []).forEach(d => dogIds.add(d.dog_id))
    ;(vetRes.data || []).forEach(d => dogIds.add(d.dog_id))
    ;(awardsRes.data || []).forEach(d => dogIds.add(d.dog_id))
    const { data: dogNames } = dogIds.size > 0
      ? await supabase.from('dogs').select('id, name').in('id', [...dogIds])
      : { data: [] }
    const dogNameMap = new Map((dogNames || []).map(d => [d.id, d.name]))

    // Build activity items
    for (const d of (dogsRes.data || [])) {
      all.push({ id: `dog-${d.id}`, type: 'dog_created', action: 'dog_created', entityName: d.name, entityId: d.id, userName: nameMap.get(d.owner_id || d.contributor_id || '') || '', userId: d.owner_id || d.contributor_id || '', timestamp: d.created_at })
    }
    for (const c of (changesRes.data || [])) {
      all.push({ id: `change-${c.id}`, type: 'dog_edited', action: 'dog_edited', entityName: dogNameMap.get(c.dog_id) || c.dog_id, entityId: c.dog_id, userName: nameMap.get(c.user_id) || '', userId: c.user_id, timestamp: c.created_at, details: `${c.field_name}: ${c.old_value || '—'} → ${c.new_value || '—'}` })
    }
    for (const k of (kennelsRes.data || [])) {
      all.push({ id: `kennel-${k.id}`, type: 'kennel_created', action: 'kennel_created', entityName: k.name, entityId: k.id, userName: nameMap.get(k.owner_id || '') || '', userId: k.owner_id || '', timestamp: k.created_at })
    }
    for (const l of (littersRes.data || [])) {
      const breedName = Array.isArray(l.breed) ? l.breed[0]?.name : (l.breed as any)?.name
      all.push({ id: `litter-${l.id}`, type: 'litter_created', action: 'litter_created', entityName: breedName ? `Camada ${breedName}` : 'Camada', entityId: l.id, userName: nameMap.get(l.owner_id || '') || '', userId: l.owner_id || '', timestamp: l.created_at, details: l.status })
    }
    for (const v of (vetRes.data || [])) {
      all.push({ id: `vet-${v.id}`, type: 'vet_added', action: 'vet_added', entityName: `${v.title || v.type} — ${dogNameMap.get(v.dog_id) || ''}`, entityId: v.dog_id, userName: nameMap.get(v.owner_id || '') || '', userId: v.owner_id || '', timestamp: v.created_at })
    }
    for (const a of (awardsRes.data || [])) {
      all.push({ id: `award-${a.id}`, type: 'award_added', action: 'award_added', entityName: `${a.award_type || ''} ${a.event_name || ''} — ${dogNameMap.get(a.dog_id) || ''}`, entityId: a.dog_id, userName: nameMap.get(a.owner_id || '') || '', userId: a.owner_id || '', timestamp: a.created_at })
    }
    for (const i of (importsRes.data || [])) {
      let count = 0
      try { count = JSON.parse(i.message)?.createdIds?.length || 0 } catch {}
      all.push({ id: `import-${i.id}`, type: 'dog_imported', action: 'dog_imported', entityName: i.title.replace('Pedigrí importado: ', ''), userName: nameMap.get(i.user_id) || '', userId: i.user_id, timestamp: i.created_at, details: `${count} perros` })
    }
    for (const u of (usersRes.data || [])) {
      all.push({ id: `user-${u.id}`, type: 'user_registered', action: 'user_registered', entityName: u.display_name || u.email, userId: u.id, userName: u.display_name || u.email, timestamp: u.created_at })
    }

    // Sort by timestamp desc
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Filter
    let filtered = all
    if (typeFilter) filtered = filtered.filter(i => i.type === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(i => i.entityName.toLowerCase().includes(q) || i.userName.toLowerCase().includes(q))
    }

    setTotal(filtered.length)
    setItems(filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE))
    setLoading(false)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold">Actividad</h1>
        <p className="text-xs text-white/40">Historial de acciones en la plataforma</p>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} onKeyDown={e => e.key === 'Enter' && fetchActivity()} placeholder="Buscar por nombre..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none appearance-none cursor-pointer min-w-[180px]">
          <option value="">Todas las acciones</option>
          <option value="dog_created">Perros creados</option>
          <option value="dog_edited">Perros editados</option>
          <option value="dog_imported">Importaciones</option>
          <option value="kennel_created">Criaderos creados</option>
          <option value="litter_created">Camadas creadas</option>
          <option value="vet_added">Registros veterinarios</option>
          <option value="award_added">Premios</option>
          <option value="user_registered">Usuarios registrados</option>
        </select>
        <button onClick={() => fetchActivity()} className="px-4 py-2.5 rounded-lg text-sm bg-white/5 text-white/50 hover:bg-white/10 transition">Actualizar</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
      ) : (
        <>
          <div className="space-y-1">
            {items.map(item => {
              const config = ACTION_CONFIG[item.type] || { icon: Edit, color: 'text-white/40 bg-white/5', label: item.type }
              const Icon = config.icon
              const date = new Date(item.timestamp)
              const formatted = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/[0.02] transition">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">{item.userName || 'Sistema'}</span>
                      <span className="text-white/30"> — </span>
                      <span className="text-white/60">{config.label}: </span>
                      <span className="text-white/80">{item.entityName}</span>
                    </p>
                    {item.details && <p className="text-[10px] text-white/25 truncate">{item.details}</p>}
                  </div>
                  <span className="text-[10px] text-white/20 flex-shrink-0 whitespace-nowrap">{formatted}</span>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-white/30">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 transition"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-xs text-white/40 px-2">{page + 1} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 transition"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
