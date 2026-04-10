'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Loader2, Edit, Eye, GitBranch, Dog, ChevronLeft, ChevronRight } from 'lucide-react'
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
  contributor_id: string | null; kennel_id: string | null
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
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)

  const [editDogId, setEditDogId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [pedigreeOpen, setPedigreeOpen] = useState(false)
  const [pedigreeDogId, setPedigreeDogId] = useState('')

  const searchTimer = useRef<any>(null)

  useEffect(() => { fetchDogs() }, [page, breedFilter, kennelFilter, sexFilter])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(0); fetchDogs() }, 300)
    return () => clearTimeout(searchTimer.current)
  }, [search])

  async function fetchDogs() {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('dogs')
      .select('id, name, slug, sex, birth_date, thumbnail_url, registration, owner_id, contributor_id, kennel_id, breed:breeds(name), kennel:kennels(name)', { count: 'exact' })

    if (search.trim()) query = query.ilike('name', `%${search.trim()}%`)
    if (breedFilter) query = query.eq('breed_id', breedFilter)
    if (kennelFilter) query = query.eq('kennel_id', kennelFilter)
    if (sexFilter) query = query.eq('sex', sexFilter)

    const { data, count } = await query.order('name').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    // Get owner names
    const ownerIds = [...new Set((data || []).map(d => d.owner_id || d.contributor_id).filter(Boolean))]
    let ownerMap = new Map<string, string>()
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', ownerIds)
      ownerMap = new Map((profiles || []).map(p => [p.id, p.display_name || 'Sin nombre']))
    }

    setDogs((data || []).map(d => ({ ...d, owner_name: ownerMap.get(d.owner_id || d.contributor_id || '') || '' })))
    setTotal(count || 0)
    setLoading(false)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold">Perros</h1>
        <p className="text-xs text-white/40">{total} perros en la plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
        </div>
        <select value={sexFilter} onChange={e => { setSexFilter(e.target.value); setPage(0) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none appearance-none cursor-pointer min-w-[120px]">
          <option value="">Todos sexos</option>
          <option value="male">Machos</option>
          <option value="female">Hembras</option>
        </select>
        <select value={breedFilter} onChange={e => { setBreedFilter(e.target.value); setPage(0) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none appearance-none cursor-pointer min-w-[150px]">
          <option value="">Todas razas</option>
          {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={kennelFilter} onChange={e => { setKennelFilter(e.target.value); setPage(0) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none appearance-none cursor-pointer min-w-[150px]">
          <option value="">Todos criaderos</option>
          {kennels.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase">Perro</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase hidden lg:table-cell">Raza</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase hidden lg:table-cell">Criadero</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase hidden md:table-cell">Propietario</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-white/40 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-white/30 mx-auto" /></td></tr>
            )}
            {!loading && dogs.length === 0 && (
              <tr><td colSpan={5} className="py-10 text-center text-sm text-white/30">Sin resultados</td></tr>
            )}
            {!loading && dogs.map(dog => {
              const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : (dog.breed as any)?.name
              const kennelName = Array.isArray(dog.kennel) ? dog.kennel[0]?.name : (dog.kennel as any)?.name
              const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
              return (
                <tr key={dog.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
                        {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/15 text-xs">{dog.sex === 'male' ? '♂' : '♀'}</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[250px]">{dog.name}</p>
                        {dog.registration && <p className="text-[10px] text-white/25">{dog.registration}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-white/40 hidden lg:table-cell">{breedName || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-white/40 hidden lg:table-cell">{kennelName || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-white/40 hidden md:table-cell">
                    {dog.owner_name || (dog.contributor_id ? 'Contribucion' : '—')}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/dogs/${dog.slug || dog.id}`} className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/5 transition"><Eye className="w-3.5 h-3.5" /></Link>
                      <button onClick={() => { setPedigreeDogId(dog.id); setPedigreeOpen(true) }} className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/5 transition"><GitBranch className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setEditDogId(dog.id); setPanelOpen(true) }} className="p-1.5 rounded text-[#D74709]/60 hover:text-[#D74709] hover:bg-[#D74709]/10 transition"><Edit className="w-3.5 h-3.5" /></button>
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
          <p className="text-xs text-white/30">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 transition"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs text-white/40 px-2">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 transition"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <DogFormPanel open={panelOpen} onClose={() => { setPanelOpen(false); setEditDogId(null) }}
        onSaved={() => fetchDogs()} editDogId={editDogId} userId={userId} />

      <PedigreeEditor open={pedigreeOpen} onClose={() => setPedigreeOpen(false)} dogId={pedigreeDogId} userId={userId} />
    </>
  )
}
