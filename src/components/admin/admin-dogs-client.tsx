'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Loader2, Edit, Eye, EyeOff, GitBranch, Dog, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import DogFormPanel from '@/components/dogs/dog-form-panel'
import PedigreeEditor from '@/components/pedigree/pedigree-editor'
import { BRAND } from '@/lib/constants'

interface Props {
  userId: string
  breeds: { id: string; name: string }[]
  kennels: { id: string; name: string }[]
}

interface DogRow {
  id: string; name: string; slug: string | null; sex: string | null; birth_date: string | null
  thumbnail_url: string | null; registration: string | null; owner_id: string | null
  kennel_id: string | null
  hidden_at: string | null
  hidden_reason: string | null
  breed: any; kennel: any; owner_name?: string
}

const PAGE_SIZE = 50

export default function AdminDogsClient({ userId, breeds, kennels }: Props) {
  const [dogs, setDogs] = useState<DogRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [breedFilter, setBreedFilter] = useState('')
  const [kennelFilter, setKennelFilter] = useState('')
  const [sexFilter, setSexFilter] = useState('')
  /** Visibilidad: 'all' (todos), 'visible' (no ocultos), 'hidden' (solo ocultos) */
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('visible')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)

  const [editDogId, setEditDogId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [pedigreeOpen, setPedigreeOpen] = useState(false)
  const [pedigreeDogId, setPedigreeDogId] = useState('')

  const searchTimer = useRef<any>(null)

  useEffect(() => { fetchDogs() }, [page, breedFilter, kennelFilter, sexFilter, visibilityFilter])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(0); fetchDogs() }, 300)
    return () => clearTimeout(searchTimer.current)
  }, [search])

  // Normaliza el query igual que la columna generada `search_text` de la DB
  // (lower + unaccent + sin caracteres no-alfanuméricos) para que el ILIKE
  // golpee el índice GIN trigram. Antes ilike('name', %q%) hacía seq scan
  // sobre 230k filas y la página se quedaba colgada o petaba por timeout.
  function normalizeSearch(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  async function fetchDogs() {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('dogs')
      // count: 'estimated' (no 'exact') — sobre 230k filas el exact requería
      // seq scan completo. estimated usa estadísticas del planner: ±5% de
      // precisión, suficiente para la UI de paginación.
      .select(
        'id, name, slug, sex, birth_date, thumbnail_url, registration, owner_id, kennel_id, hidden_at, hidden_reason, breed:breeds(name), kennel:kennels(name)',
        { count: 'estimated' },
      )

    if (search.trim()) {
      const normalized = normalizeSearch(search)
      if (normalized.length >= 2) {
        query = query.ilike('search_text', `%${normalized}%`)
      }
    }
    if (breedFilter) query = query.eq('breed_id', breedFilter)
    if (kennelFilter) query = query.eq('kennel_id', kennelFilter)
    if (sexFilter) query = query.eq('sex', sexFilter)
    if (visibilityFilter === 'visible') query = query.is('hidden_at', null)
    if (visibilityFilter === 'hidden') query = query.not('hidden_at', 'is', null)

    const { data, count } = await query.order('name').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    // Get owner names
    const ownerIds = [...new Set((data || []).map(d => d.owner_id).filter(Boolean))]
    let ownerMap = new Map<string, string>()
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', ownerIds)
      ownerMap = new Map((profiles || []).map(p => [p.id, p.display_name || 'Sin nombre']))
    }

    setDogs((data || []).map(d => ({ ...d, owner_name: ownerMap.get(d.owner_id || '') || '' })))
    setTotal(count || 0)
    setLoading(false)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold">Perros</h1>
        <p className="text-xs text-muted">{total} perros en la plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre..."
            className="w-full bg-canvas border border-hairline rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
        </div>
        <select value={sexFilter} onChange={e => { setSexFilter(e.target.value); setPage(0) }}
          className="bg-surface-card border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none appearance-none cursor-pointer min-w-[120px]">
          <option value="">Todos sexos</option>
          <option value="male">Machos</option>
          <option value="female">Hembras</option>
        </select>
        <select value={breedFilter} onChange={e => { setBreedFilter(e.target.value); setPage(0) }}
          className="bg-surface-card border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none appearance-none cursor-pointer min-w-[150px]">
          <option value="">Todas razas</option>
          {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={kennelFilter} onChange={e => { setKennelFilter(e.target.value); setPage(0) }}
          className="bg-surface-card border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none appearance-none cursor-pointer min-w-[150px]">
          <option value="">Todos criaderos</option>
          {kennels.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <select
          value={visibilityFilter}
          onChange={e => { setVisibilityFilter(e.target.value as 'all' | 'visible' | 'hidden'); setPage(0) }}
          className="bg-surface-card border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none appearance-none cursor-pointer min-w-[140px]"
          title="Filtrar por visibilidad"
        >
          <option value="visible">Solo visibles</option>
          <option value="hidden">Solo ocultos</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {/* Table */}
      <div className="border border-hairline rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-surface-card">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted uppercase">Perro</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted uppercase hidden lg:table-cell">Raza</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted uppercase hidden lg:table-cell">Criadero</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted uppercase hidden md:table-cell">Propietario</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-muted mx-auto" /></td></tr>
            )}
            {!loading && dogs.length === 0 && (
              <tr><td colSpan={5} className="py-10 text-center text-sm text-muted">Sin resultados</td></tr>
            )}
            {!loading && dogs.map(dog => {
              const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : (dog.breed as any)?.name
              const kennelName = Array.isArray(dog.kennel) ? dog.kennel[0]?.name : (dog.kennel as any)?.name
              const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
              return (
                <tr key={dog.id} className={`hover:bg-surface-card transition ${dog.hidden_at ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full border-2 overflow-hidden flex-shrink-0 bg-surface-card ${dog.hidden_at ? 'grayscale opacity-50' : ''}`} style={{ borderColor: sexColor }}>
                        {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted text-xs">{dog.sex === 'male' ? '♂' : '♀'}</div>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium truncate max-w-[200px]">{dog.name}</p>
                          {dog.hidden_at && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                              title={`Oculto desde ${new Date(dog.hidden_at).toLocaleDateString('es-ES')} · Motivo: ${dog.hidden_reason || '—'}`}
                            >
                              <EyeOff className="w-2.5 h-2.5" />
                              Oculto
                            </span>
                          )}
                        </div>
                        {dog.registration && <p className="text-[10px] text-muted">{dog.registration}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted hidden lg:table-cell">{breedName || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-muted hidden lg:table-cell">{kennelName || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-muted hidden md:table-cell">
                    {dog.owner_name || '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/dogs/${dog.slug || dog.id}`} className="p-1.5 rounded text-muted hover:text-body hover:bg-surface-card transition"><Eye className="w-3.5 h-3.5" /></Link>
                      <button onClick={() => { setPedigreeDogId(dog.id); setPedigreeOpen(true) }} className="p-1.5 rounded text-muted hover:text-body hover:bg-surface-card transition"><GitBranch className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setEditDogId(dog.id); setPanelOpen(true) }} className="p-1.5 rounded text-ink/60 hover:text-ink hover:bg-surface-card transition"><Edit className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-2 rounded-lg text-muted hover:text-ink hover:bg-surface-card disabled:opacity-20 transition"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs text-muted px-2">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-lg text-muted hover:text-ink hover:bg-surface-card disabled:opacity-20 transition"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <DogFormPanel open={panelOpen} onClose={() => { setPanelOpen(false); setEditDogId(null) }}
        onSaved={() => fetchDogs()} editDogId={editDogId} userId={userId} />

      <PedigreeEditor open={pedigreeOpen} onClose={() => setPedigreeOpen(false)} dogId={pedigreeDogId} userId={userId} />
    </>
  )
}
