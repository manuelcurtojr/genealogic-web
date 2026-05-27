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

// Pastels Cal solid — icon en blanco sobre pastel sólido
const ACTION_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  dog_created: { icon: Dog, color: 'text-white', bg: '#34d399', label: 'Perro creado' },
  dog_imported: { icon: Link2, color: 'text-white', bg: '#3b82f6', label: 'Genealogía importada' },
  kennel_created: { icon: Store, color: 'text-white', bg: '#8b5cf6', label: 'Criadero creado' },
  litter_created: { icon: Baby, color: 'text-white', bg: '#ec4899', label: 'Camada creada' },
  vet_added: { icon: Stethoscope, color: 'text-white', bg: '#06b6d4', label: 'Registro veterinario' },
  award_added: { icon: Trophy, color: 'text-white', bg: '#f59e0b', label: 'Premio añadido' },
  user_registered: { icon: UserPlus, color: 'text-white', bg: '#fb923c', label: 'Usuario registrado' },
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
    const [dogsRes, kennelsRes, littersRes, vetRes, awardsRes, importsRes, usersRes] = await Promise.all([
      // Dogs created
      supabase.from('dogs').select('id, name, owner_id, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(200),
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
    ;(dogsRes.data || []).forEach(d => addUid(d.owner_id))
    ;(kennelsRes.data || []).forEach(d => addUid(d.owner_id))
    ;(littersRes.data || []).forEach(d => addUid(d.owner_id))
    ;(vetRes.data || []).forEach(d => addUid(d.owner_id))
    ;(awardsRes.data || []).forEach(d => addUid(d.owner_id))
    ;(importsRes.data || []).forEach(d => addUid(d.user_id))

    const { data: profiles } = allUserIds.size > 0
      ? await supabase.from('profiles').select('id, display_name').in('id', [...allUserIds])
      : { data: [] }
    const nameMap = new Map((profiles || []).map(p => [p.id, p.display_name || 'Sin nombre']))

    // Get dog names for vet/awards
    const dogIds = new Set<string>()
    ;(vetRes.data || []).forEach(d => dogIds.add(d.dog_id))
    ;(awardsRes.data || []).forEach(d => dogIds.add(d.dog_id))
    const { data: dogNames } = dogIds.size > 0
      ? await supabase.from('dogs').select('id, name').in('id', [...dogIds])
      : { data: [] }
    const dogNameMap = new Map((dogNames || []).map(d => [d.id, d.name]))

    // Build activity items
    for (const d of (dogsRes.data || [])) {
      all.push({ id: `dog-${d.id}`, type: 'dog_created', action: 'dog_created', entityName: d.name, entityId: d.id, userName: nameMap.get(d.owner_id || '') || '', userId: d.owner_id || '', timestamp: d.created_at })
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
      // Soportamos tanto el título nuevo "Genealogía importada: X" como el legacy "Pedigrí importado: X"
      const entityName = i.title.replace('Genealogía importada: ', '').replace('Pedigrí importado: ', '')
      all.push({ id: `import-${i.id}`, type: 'dog_imported', action: 'dog_imported', entityName, userName: nameMap.get(i.user_id) || '', userId: i.user_id, timestamp: i.created_at, details: `${count} perros` })
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

  // Stats por tipo en la ventana visible (página actual)
  const statsByType: Record<string, number> = {}
  for (const i of items) statsByType[i.type] = (statsByType[i.type] || 0) + 1

  // Agrupar items por bucket de fecha relativa
  function dateBucket(iso: string): { key: string; label: string; order: number } {
    const d = new Date(iso)
    const now = new Date()
    const isSameDay = d.toDateString() === now.toDateString()
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
    const isYesterday = d.toDateString() === yesterday.toDateString()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (isSameDay) return { key: 'today', label: 'Hoy', order: 0 }
    if (isYesterday) return { key: 'yesterday', label: 'Ayer', order: 1 }
    if (diffDays < 7) return { key: 'week', label: 'Esta semana', order: 2 }
    if (diffDays < 30) return { key: 'month', label: 'Este mes', order: 3 }
    if (d.getFullYear() === now.getFullYear()) {
      const monthLabel = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      return { key: `m-${d.getFullYear()}-${d.getMonth()}`, label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), order: 4 + (12 - d.getMonth()) }
    }
    return { key: `y-${d.getFullYear()}`, label: String(d.getFullYear()), order: 99 - d.getFullYear() }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped: Array<{ key: string; label: string; order: number; items: ActivityItem[] }> = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bucketIndex: Record<string, any> = {}
  for (const item of items) {
    const b = dateBucket(item.timestamp)
    if (!bucketIndex[b.key]) {
      const entry = { ...b, items: [] as ActivityItem[] }
      bucketIndex[b.key] = entry
      grouped.push(entry)
    }
    bucketIndex[b.key].items.push(item)
  }
  grouped.sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Plataforma</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          Actividad
        </h1>
        <p className="mt-2 text-[14px] text-body">Historial de acciones en la plataforma.</p>
      </div>

      {/* Stats por tipo en la ventana visible — chips clickables que actúan
          como filtro rápido. */}
      {!loading && items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(statsByType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => {
              const cfg = ACTION_CONFIG[type] || { label: type, bg: '#6b7280', icon: Edit, color: 'text-white' }
              const CIcon = cfg.icon
              const active = typeFilter === type
              return (
                <button
                  key={type}
                  onClick={() => { setTypeFilter(active ? '' : type); setPage(0) }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition ${
                    active
                      ? 'border-ink bg-ink text-on-primary'
                      : 'border-hairline bg-canvas text-body hover:border-ink/30'
                  }`}
                >
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ backgroundColor: active ? 'rgba(255,255,255,0.2)' : cfg.bg }}
                  >
                    <CIcon className="h-2.5 w-2.5 text-white" />
                  </span>
                  <span className="font-medium">{cfg.label}</span>
                  <span className={`tabular-nums ${active ? 'text-on-primary/80' : 'text-muted'}`}>{count}</span>
                </button>
              )
            })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            onKeyDown={e => e.key === 'Enter' && fetchActivity()}
            placeholder="Buscar por nombre..."
            className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-4 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(0) }}
          className="min-w-[180px] cursor-pointer appearance-none rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[13px] text-body focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
        >
          <option value="">Todas las acciones</option>
          <option value="dog_created">Perros creados</option>
          <option value="dog_imported">Importaciones</option>
          <option value="kennel_created">Criaderos creados</option>
          <option value="litter_created">Camadas creadas</option>
          <option value="vet_added">Registros veterinarios</option>
          <option value="award_added">Premios</option>
          <option value="user_registered">Usuarios registrados</option>
        </select>
        <button
          onClick={() => fetchActivity()}
          className="rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-[13px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
        >
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-12 text-center">
          <Filter className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-[14px] text-body">
            Sin actividad con los filtros actuales.
          </p>
          {(typeFilter || search) && (
            <button
              onClick={() => { setTypeFilter(''); setSearch(''); setPage(0) }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[12.5px] font-semibold text-body hover:text-ink transition"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Timeline agrupada por bucket de fecha. Cada grupo tiene un
              header sticky con la línea vertical de timeline conectando
              los eventos del bucket. */}
          <div className="space-y-8">
            {grouped.map(group => (
              <section key={group.key}>
                <div className="sticky top-0 z-10 -mx-2 mb-2 bg-canvas/95 backdrop-blur-sm px-2 py-1.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted">
                    {group.label}
                    <span className="ml-2 text-muted/60 font-normal normal-case tracking-normal">
                      · {group.items.length} {group.items.length === 1 ? 'evento' : 'eventos'}
                    </span>
                  </p>
                </div>
                <ol className="relative">
                  {/* Línea vertical de timeline a la altura del centro del icono */}
                  <span
                    aria-hidden
                    className="absolute left-[17px] top-3 bottom-3 w-px bg-hairline"
                  />
                  <div className="space-y-1">
                    {group.items.map(item => {
                      const config = ACTION_CONFIG[item.type] || { icon: Edit, color: 'text-white', bg: '#6b7280', label: item.type }
                      const Icon = config.icon
                      const date = new Date(item.timestamp)
                      const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

                      return (
                        <li
                          key={item.id}
                          className="relative flex items-start gap-3 rounded-xl border border-transparent hover:border-hairline hover:bg-surface-soft px-2 py-2 transition-colors"
                        >
                          {/* Icono dot — alineado con la línea de timeline */}
                          <div
                            className="relative z-10 flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full ring-4 ring-canvas"
                            style={{ backgroundColor: config.bg }}
                          >
                            <Icon className="h-4 w-4 text-white" />
                          </div>

                          {/* Contenido */}
                          <div className="min-w-0 flex-1 pt-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-[13.5px] font-semibold text-ink truncate">
                                {item.userName || 'Sistema'}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-surface-card px-1.5 py-0.5 text-[10px] font-medium text-body">
                                {config.label}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[13px] text-body truncate">
                              <span className="text-ink">{item.entityName}</span>
                              {item.details && (
                                <span className="ml-1.5 text-muted">· {item.details}</span>
                              )}
                            </p>
                          </div>

                          {/* Tiempo — más compacto: HH:mm si es hoy, día+mes si no */}
                          <div className="flex-shrink-0 pt-1 text-right">
                            <span
                              className="block text-[11px] tabular-nums text-muted"
                              title={date.toLocaleString('es-ES')}
                            >
                              {group.key === 'today' || group.key === 'yesterday'
                                ? timeStr
                                : `${dateStr} · ${timeStr}`}
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </div>
                </ol>
              </section>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] text-muted">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-soft hover:text-ink disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-[12.5px] text-muted tabular-nums">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-soft hover:text-ink disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
