'use client'

import { useState, useEffect, useRef } from 'react'
import { Grid3X3, List, Search, Plus, Eye, Edit, ArrowRightLeft, GitBranch } from 'lucide-react'
import DogCard from './dog-card'
import DogFormPanel from './dog-form-panel'
import TransferPanel from '../kennel/transfer-panel'
import PedigreeEditor from '../pedigree/pedigree-editor'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'
import SortSelect, { useSortPreference, sortItems } from '@/components/ui/sort-select'

interface Dog {
  id: string
  slug?: string | null
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
  const [pedigreeOpen, setPedigreeOpen] = useState(false)
  const [pedigreeDogId, setPedigreeDogId] = useState('')

  const openAdd = () => { setEditDogId(null); setPanelOpen(true) }
  const openEdit = (dogId: string) => { setEditDogId(dogId); setPanelOpen(true) }
  const openPedigree = (dogId: string) => { setPedigreeDogId(dogId); setPedigreeOpen(true) }
  const closePanel = () => { setPanelOpen(false); setEditDogId(null) }
  const [sexFilter, setSexFilter] = useState('')
  const [breedFilter, setBreedFilter] = useState('')
  const [sortBy, setSortBy] = useSortPreference('dogs-sort')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('dogs-view') as 'grid' | 'list') || 'grid'
    return 'grid'
  })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const loadMoreRef = useRef<HTMLDivElement>(null)

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

  const sorted = sortItems(filtered, sortBy)
  const paged = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const handleSearchChange = (v: string) => { setSearch(v); setVisibleCount(PAGE_SIZE) }

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount(prev => prev + PAGE_SIZE) },
      { threshold: 0.1 }
    )
    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore, visibleCount])

  const inputCls = 'w-full rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition'
  const selectCls = 'rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[13px] text-body focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none cursor-pointer'

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* PageHeader Cal */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
            Catálogo
          </p>
          <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
            Mis perros
          </h1>
          <p className="mt-2 text-[14px] text-body">{dogs.length} {dogs.length === 1 ? 'perro registrado' : 'perros registrados'}</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Perro
        </button>
      </div>

      {/* Toolbar */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Buscar por nombre, raza, color..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`${inputCls} pl-10`}
            />
          </div>
          <select
            value={sexFilter}
            onChange={(e) => { setSexFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
            className={`${selectCls} hidden lg:block min-w-[140px]`}
          >
            <option value="">Todos los sexos</option>
            <option value="male">Machos</option>
            <option value="female">Hembras</option>
          </select>
          <select
            value={breedFilter}
            onChange={(e) => { setBreedFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
            className={`${selectCls} hidden lg:block min-w-[160px]`}
          >
            <option value="">Todas las razas</option>
            {breeds.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div className="hidden lg:block">
            <SortSelect value={sortBy} onChange={setSortBy} storageKey="dogs-sort" />
          </div>
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-hairline">
            <button
              onClick={() => changeView('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-ink text-on-primary' : 'bg-canvas text-muted hover:bg-surface-soft hover:text-ink'}`}
              title="Vista grid"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => changeView('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-ink text-on-primary' : 'bg-canvas text-muted hover:bg-surface-soft hover:text-ink'}`}
              title="Vista lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Mobile filters */}
        <div className="flex items-center gap-2 lg:hidden">
          <select
            value={sexFilter}
            onChange={(e) => { setSexFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
            className={`${selectCls} flex-1 min-w-0 text-[12px] py-2`}
          >
            <option value="">Todos los sexos</option>
            <option value="male">Machos</option>
            <option value="female">Hembras</option>
          </select>
          <select
            value={breedFilter}
            onChange={(e) => { setBreedFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
            className={`${selectCls} flex-1 min-w-0 text-[12px] py-2`}
          >
            <option value="">Todas las razas</option>
            {breeds.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <SortSelect value={sortBy} onChange={setSortBy} storageKey="dogs-sort" />
        </div>
      </div>

      {/* Count */}
      <p className="-mt-3 text-[12.5px] text-muted">
        Mostrando {paged.length} de {filtered.length} {filtered.length === 1 ? 'perro' : 'perros'}
      </p>

      {/* Grid view */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {/* Add new dog card */}
          <button
            onClick={openAdd}
            className="group flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-surface-soft transition-colors hover:bg-surface-card sm:min-h-[220px]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas border border-hairline transition-colors group-hover:bg-ink group-hover:border-ink sm:h-14 sm:w-14">
              <Plus className="h-5 w-5 text-muted transition-colors group-hover:text-on-primary sm:h-6 sm:w-6" />
            </div>
            <p className="mt-3 text-[13px] font-medium text-body">Añadir perro</p>
          </button>

          {paged.map((dog) => (
            <DogCard
              key={dog.id}
              dog={dog}
              onEdit={() => openEdit(dog.id)}
              onEditPedigree={() => openPedigree(dog.id)}
              onTransfer={() => setTransferDog({ id: dog.id, name: dog.name, thumbnail_url: dog.thumbnail_url, breed_name: Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={openAdd}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-hairline bg-surface-soft p-3 transition-colors hover:bg-surface-card sm:p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas border border-hairline transition-colors group-hover:bg-ink group-hover:border-ink">
              <Plus className="h-5 w-5 text-muted transition-colors group-hover:text-on-primary" />
            </div>
            <p className="text-[14px] font-medium text-body">Añadir perro</p>
          </button>
          {paged.map((dog) => {
            const sexColor = dog.sex === 'male' ? BRAND.male : dog.sex === 'female' ? BRAND.female : '#888'
            const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
            const colorName = Array.isArray(dog.color) ? dog.color[0]?.name : dog.color?.name
            return (
              <div
                key={dog.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-hairline bg-canvas p-3 transition-colors hover:bg-surface-soft sm:gap-4 sm:p-4"
                onClick={() => window.location.href = `/dogs/${dog.slug || dog.id}`}
              >
                <div
                  className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 bg-surface-card sm:h-11 sm:w-11"
                  style={{ borderColor: sexColor }}
                >
                  {dog.thumbnail_url
                    ? <img src={dog.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-[14px] text-muted">{dog.sex === 'male' ? '♂' : '♀'}</div>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-muted sm:gap-3">
                    {breedName && <span className="truncate">{breedName}</span>}
                    {colorName && <span className="hidden sm:inline">{colorName}</span>}
                    {dog.birth_date && <span className="hidden sm:inline">{new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <Link
                    href={`/dogs/${dog.slug || dog.id}`}
                    onClick={e => e.stopPropagation()}
                    title="Ver perfil"
                    className="inline-flex items-center gap-1 rounded-md bg-ink px-2.5 py-1.5 text-[11px] font-medium text-on-primary transition-colors hover:opacity-90"
                  >
                    <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Ver</span>
                  </Link>
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(dog.id) }}
                    title="Editar"
                    className="inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-[11px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
                  >
                    <Edit className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); openPedigree(dog.id) }}
                    title="Constructor de genealogía"
                    className="inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-[11px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
                  >
                    <GitBranch className="h-3.5 w-3.5" /> <span className="hidden md:inline">Genealogía</span>
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setTransferDog({
                        id: dog.id,
                        name: dog.name,
                        thumbnail_url: dog.thumbnail_url,
                        breed_name: Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name,
                      })
                    }}
                    title="Transferir a otro dueño"
                    className="inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-[11px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" /> <span className="hidden md:inline">Transferir</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <p className="text-[14px] text-body">No se encontraron perros con esos filtros.</p>
          <button
            onClick={() => { setSearch(''); setSexFilter(''); setBreedFilter('') }}
            className="mt-3 text-[13px] font-medium text-ink hover:opacity-80"
          >
            Limpiar filtros →
          </button>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={loadMoreRef} className="h-10" />}

      {/* Dog form slide panel (add + edit) */}
      <DogFormPanel
        open={panelOpen}
        onClose={closePanel}
        onSaved={(newId) => {
          if (newId) {
            setTimeout(() => openEdit(newId), 300)
          }
        }}
        editDogId={editDogId}
        userId={userId}
      />

      <TransferPanel
        open={!!transferDog}
        onClose={() => setTransferDog(null)}
        dog={transferDog}
      />

      <PedigreeEditor open={pedigreeOpen} onClose={() => setPedigreeOpen(false)} dogId={pedigreeDogId} userId={userId} />
    </div>
  )
}
