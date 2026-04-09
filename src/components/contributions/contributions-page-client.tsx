'use client'

import { useState, useEffect, useRef } from 'react'
import { Grid3X3, List, Search, Plus, Eye, Edit, GitBranch } from 'lucide-react'
import DogCard from '@/components/dogs/dog-card'
import DogFormPanel from '@/components/dogs/dog-form-panel'
import PedigreeEditor from '@/components/pedigree/pedigree-editor'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

interface Dog {
  id: string; slug?: string | null; name: string; sex: string | null; birth_date: string | null
  thumbnail_url: string | null; breed: any; color: any; breed_id: string | null
}

interface Props {
  dogs: Dog[]
  breeds: { id: string; name: string }[]
  userId: string
}

const PAGE_SIZE = 24

export default function ContributionsClient({ dogs, breeds, userId }: Props) {
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editDogId, setEditDogId] = useState<string | null>(null)
  const [pedigreeOpen, setPedigreeOpen] = useState(false)
  const [pedigreeDogId, setPedigreeDogId] = useState('')
  const [sexFilter, setSexFilter] = useState('')
  const [breedFilter, setBreedFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('contributions-view') as 'grid' | 'list') || 'grid'
    return 'grid'
  })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const openAdd = () => { setEditDogId(null); setPanelOpen(true) }
  const openEdit = (dogId: string) => { setEditDogId(dogId); setPanelOpen(true) }
  const closePanel = () => { setPanelOpen(false); setEditDogId(null) }
  const changeView = (v: 'grid' | 'list') => { setViewMode(v); localStorage.setItem('contributions-view', v) }
  const openPedigree = (dogId: string) => { setPedigreeDogId(dogId); setPedigreeOpen(true) }

  const filtered = dogs.filter((dog) => {
    const q = search.toLowerCase()
    if (q) {
      const breedName = (Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name) || ''
      const colorName = (Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name) || ''
      if (!dog.name.toLowerCase().includes(q) && !breedName.toLowerCase().includes(q) && !colorName.toLowerCase().includes(q)) return false
    }
    if (sexFilter && dog.sex !== sexFilter) return false
    if (breedFilter && dog.breed_id !== breedFilter) return false
    return true
  })

  const paged = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const handleSearchChange = (v: string) => { setSearch(v); setVisibleCount(PAGE_SIZE) }

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount(prev => prev + PAGE_SIZE) },
      { threshold: 0.1 }
    )
    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore, visibleCount])

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Contribuciones</h1>
        <p className="text-white/50 text-xs sm:text-sm mt-1">{dogs.length} perros documentados</p>
      </div>

      {/* Search + filters — 1 row on desktop, 2 rows on mobile */}
      <div className="flex items-center gap-2 mb-2 lg:mb-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" placeholder="Buscar por nombre, raza, color..." value={search} onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition" />
        </div>
        {/* Desktop: filters inline */}
        <select value={sexFilter} onChange={(e) => { setSexFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
          className="hidden lg:block bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none transition appearance-none cursor-pointer min-w-[130px]">
          <option value="">Todos los sexos</option>
          <option value="male">Machos</option>
          <option value="female">Hembras</option>
        </select>
        <select value={breedFilter} onChange={(e) => { setBreedFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
          className="hidden lg:block bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none transition appearance-none cursor-pointer min-w-[160px]">
          <option value="">Todas las razas</option>
          {breeds.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex rounded-lg border border-white/10 overflow-hidden shrink-0">
          <button onClick={() => changeView('grid')} className={`p-2 transition ${viewMode === 'grid' ? 'bg-[#D74709] text-white' : 'bg-white/5 text-white/30 hover:text-white/50'}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => changeView('list')} className={`p-2 transition ${viewMode === 'list' ? 'bg-[#D74709] text-white' : 'bg-white/5 text-white/30 hover:text-white/50'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Mobile: filters row */}
      <div className="flex items-center gap-2 mb-3 lg:hidden">
        <select value={sexFilter} onChange={(e) => { setSexFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white/70 focus:border-[#D74709] focus:outline-none transition appearance-none cursor-pointer flex-1 min-w-0">
          <option value="">Todos los sexos</option>
          <option value="male">Machos</option>
          <option value="female">Hembras</option>
        </select>
        <select value={breedFilter} onChange={(e) => { setBreedFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white/70 focus:border-[#D74709] focus:outline-none transition appearance-none cursor-pointer flex-1 min-w-0">
          <option value="">Todas las razas</option>
          {breeds.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <p className="text-xs text-white/30 mb-3">{filtered.length} perro{filtered.length !== 1 ? 's' : ''}</p>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
          <button onClick={openAdd}
            className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px] hover:border-[#D74709]/40 hover:bg-white/[0.02] transition group cursor-pointer p-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/5 group-hover:bg-[#D74709]/10 flex items-center justify-center transition mb-2 sm:mb-3">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white/30 group-hover:text-[#D74709] transition" />
            </div>
            <p className="text-xs sm:text-sm text-white/40 group-hover:text-white/60 transition font-medium">Añadir contribución</p>
          </button>
          {paged.map((dog) => (
            <DogCard key={dog.id} dog={dog} onEdit={() => openEdit(dog.id)} onEditPedigree={() => openPedigree(dog.id)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <button onClick={openAdd}
            className="w-full flex items-center gap-3 border-2 border-dashed border-white/10 rounded-xl p-3 sm:p-4 hover:border-[#D74709]/40 hover:bg-white/[0.02] transition group cursor-pointer">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 group-hover:bg-[#D74709]/10 flex items-center justify-center transition shrink-0">
              <Plus className="w-5 h-5 text-white/30 group-hover:text-[#D74709] transition" />
            </div>
            <p className="text-sm text-white/40 group-hover:text-white/60 transition font-medium">Añadir contribución</p>
          </button>
          {paged.map((dog) => {
            const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
            const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
            const colorName = Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name
            return (
              <div key={dog.id} className="flex items-center gap-2.5 sm:gap-4 bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-4 hover:border-[#D74709]/50 hover:bg-white/[0.07] transition cursor-pointer" onClick={() => window.location.href = `/dogs/${dog.slug || dog.id}`}>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
                  {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">{dog.sex === 'male' ? '♂' : '♀'}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm truncate">{dog.name}</p>
                  <div className="flex items-center gap-2 sm:gap-3 mt-0.5 text-[10px] sm:text-xs text-white/40">
                    {breedName && <span className="truncate">{breedName}</span>}
                    {colorName && <span className="hidden sm:inline">{colorName}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); openPedigree(dog.id) }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-white/5 text-white/30 hover:bg-white/10 transition"><GitBranch className="w-3 h-3" /></button>
                  <Link href={`/dogs/${dog.slug || dog.id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition"><Eye className="w-3 h-3" /> <span className="hidden sm:inline">Ver</span></Link>
                  <button onClick={e => { e.stopPropagation(); openEdit(dog.id) }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-white/5 text-white/30 hover:bg-white/10 transition"><Edit className="w-3 h-3" /> <span className="hidden sm:inline">Editar</span></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {hasMore && <div ref={loadMoreRef} className="h-10" />}

      <DogFormPanel open={panelOpen} onClose={closePanel}
        onSaved={(newId) => { if (newId) setTimeout(() => openEdit(newId), 300) }}
        editDogId={editDogId} userId={userId} />

      <PedigreeEditor open={pedigreeOpen} onClose={() => setPedigreeOpen(false)} dogId={pedigreeDogId} userId={userId} />
    </>
  )
}
