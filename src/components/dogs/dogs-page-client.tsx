'use client'

import { useState } from 'react'
import { Grid3X3, List, ChevronLeft, ChevronRight, Search, Plus, Eye, Edit, GitBranch, Mars, Venus, ArrowRightLeft } from 'lucide-react'
import DogCard from './dog-card'
import DogFormPanel from './dog-form-panel'
import TransferPanel from '../kennel/transfer-panel'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

interface Dog {
  id: string
  name: string
  sex: string | null
  birth_date: string | null
  thumbnail_url: string | null
  breed: any
  color: any
  breed_id: string | null
}

interface DogsPageClientProps {
  dogs: Dog[]
  breeds: { id: string; name: string }[]
  userId: string
}

const PAGE_SIZE = 24

export default function DogsPageClient({ dogs, breeds, userId }: DogsPageClientProps) {
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editDogId, setEditDogId] = useState<string | null>(null)

  const [transferDog, setTransferDog] = useState<any>(null)

  const openAdd = () => { setEditDogId(null); setPanelOpen(true) }
  const openEdit = (dogId: string) => { setEditDogId(dogId); setPanelOpen(true) }
  const closePanel = () => { setPanelOpen(false); setEditDogId(null) }
  const [sexFilter, setSexFilter] = useState('')
  const [breedFilter, setBreedFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('dogs-view') as 'grid' | 'list') || 'grid'
    return 'grid'
  })
  const [page, setPage] = useState(0)

  const changeView = (v: 'grid' | 'list') => { setViewMode(v); localStorage.setItem('dogs-view', v) }

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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSearchChange = (v: string) => { setSearch(v); setPage(0) }

  return (
    <>
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mis Perros</h1>
        <p className="text-white/50 text-sm mt-1">{dogs.length} perros registrados</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por nombre, raza, color..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition"
          />
        </div>

        {/* Sex filter — dropdown */}
        <select
          value={sexFilter}
          onChange={(e) => { setSexFilter(e.target.value); setPage(0) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none transition appearance-none cursor-pointer min-w-[130px]"
        >
          <option value="">Todos los sexos</option>
          <option value="male">Machos</option>
          <option value="female">Hembras</option>
        </select>

        {/* Breed filter */}
        <select
          value={breedFilter}
          onChange={(e) => { setBreedFilter(e.target.value); setPage(0) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:border-[#D74709] focus:outline-none transition appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="">Todas las razas</option>
          {breeds.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          <button onClick={() => changeView('grid')} className={`p-2 transition ${viewMode === 'grid' ? 'bg-[#D74709] text-white' : 'bg-white/5 text-white/30 hover:text-white/50'}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => changeView('list')} className={`p-2 transition ${viewMode === 'list' ? 'bg-[#D74709] text-white' : 'bg-white/5 text-white/30 hover:text-white/50'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-white/30 mb-3">{filtered.length} perro{filtered.length !== 1 ? 's' : ''}</p>

      {/* Grid view */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Add new dog card */}
          <button
            onClick={openAdd}
            className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center min-h-[200px] hover:border-[#D74709]/40 hover:bg-white/[0.02] transition group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-[#D74709]/10 flex items-center justify-center transition mb-3">
              <Plus className="w-6 h-6 text-white/30 group-hover:text-[#D74709] transition" />
            </div>
            <p className="text-sm text-white/40 group-hover:text-white/60 transition font-medium">Anadir nuevo</p>
            <p className="text-sm text-white/40 group-hover:text-white/60 transition font-medium">perro</p>
          </button>

          {paged.map((dog) => (
            <DogCard key={dog.id} dog={dog} onEdit={() => openEdit(dog.id)} onTransfer={() => setTransferDog({ id: dog.id, name: dog.name, thumbnail_url: dog.thumbnail_url, breed_name: Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name })} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {paged.map((dog) => {
            const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#666'
            const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
            const colorName = Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name
            return (
              <div key={dog.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#D74709]/50 hover:bg-white/[0.07] transition cursor-pointer" onClick={() => window.location.href = `/dogs/${dog.id}`}>
                <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
                  {dog.thumbnail_url ? <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">{dog.sex === 'male' ? '♂' : '♀'}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{dog.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-white/40">
                    {breedName && <span>{breedName}</span>}
                    {colorName && <span>{colorName}</span>}
                    {dog.birth_date && <span>{new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link href={`/dogs/${dog.id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition"><Eye className="w-3 h-3" /> Ver</Link>
                  <button onClick={e => { e.stopPropagation(); openEdit(dog.id) }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-white/5 text-white/30 hover:bg-white/10 transition"><Edit className="w-3 h-3" /> Editar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 text-white/30 hover:text-white disabled:opacity-20 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum = i
            if (totalPages > 7) {
              if (page < 4) pageNum = i
              else if (page > totalPages - 4) pageNum = totalPages - 7 + i
              else pageNum = page - 3 + i
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-sm transition ${
                  page === pageNum ? 'bg-[#D74709] text-white' : 'text-white/40 hover:bg-white/10'
                }`}
              >
                {pageNum + 1}
              </button>
            )
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 text-white/30 hover:text-white disabled:opacity-20 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dog form slide panel (add + edit) */}
      <DogFormPanel
        open={panelOpen}
        onClose={closePanel}
        editDogId={editDogId}
        userId={userId}
      />

      {/* Transfer panel */}
      <TransferPanel
        open={!!transferDog}
        onClose={() => setTransferDog(null)}
        dog={transferDog}
      />
    </>
  )
}
