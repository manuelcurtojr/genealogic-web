'use client'

import { useState } from 'react'
import { Grid3X3, List, ChevronLeft, ChevronRight } from 'lucide-react'
import DogCard from './dog-card'
import DogFilters from './dog-filters'
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
  favoriteDogIds: string[]
  userId: string
}

const PAGE_SIZE = 24

export default function DogsPageClient({ dogs, breeds, favoriteDogIds, userId }: DogsPageClientProps) {
  const [search, setSearch] = useState('')
  const [sexFilter, setSexFilter] = useState('')
  const [breedFilter, setBreedFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(0)

  const filtered = dogs.filter((dog) => {
    if (search && !dog.name.toLowerCase().includes(search.toLowerCase())) return false
    if (sexFilter && dog.sex !== sexFilter) return false
    if (breedFilter && dog.breed_id !== breedFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page when filters change
  const handleSearchChange = (v: string) => { setSearch(v); setPage(0) }
  const handleSexChange = (v: string) => { setSexFilter(v); setPage(0) }
  const handleBreedChange = (v: string) => { setBreedFilter(v); setPage(0) }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <DogFilters
            search={search}
            onSearchChange={handleSearchChange}
            sexFilter={sexFilter}
            onSexChange={handleSexChange}
            breedFilter={breedFilter}
            onBreedChange={handleBreedChange}
            breeds={breeds}
          />
        </div>
        {/* View mode toggle */}
        <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition ${viewMode === 'grid' ? 'bg-[#D74709] text-white' : 'text-white/30 hover:text-white/50'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition ${viewMode === 'list' ? 'bg-[#D74709] text-white' : 'text-white/30 hover:text-white/50'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-white/30 mb-3">{filtered.length} perro{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-lg">
            {dogs.length === 0 ? 'No tienes perros registrados' : 'No se encontraron perros'}
          </p>
          <p className="text-white/25 text-sm mt-2">
            {dogs.length === 0 ? 'Anade tu primer perro para empezar' : 'Prueba con otros filtros'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map((dog) => (
            <DogCard
              key={dog.id}
              dog={dog}
              isFavorited={favoriteDogIds.includes(dog.id)}
              userId={userId}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {paged.map((dog) => {
            const borderColor = dog.sex === 'male' ? BRAND.male : BRAND.female
            return (
              <Link
                key={dog.id}
                href={`/dogs/${dog.id}`}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 hover:bg-white/10 transition"
              >
                <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor }}>
                  {dog.thumbnail_url ? (
                    <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                      {dog.sex === 'male' ? '♂' : '♀'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{dog.name}</p>
                  <p className="text-xs text-white/40 truncate">{dog.breed?.name || '—'}</p>
                </div>
                <div className="text-xs text-white/30">
                  {dog.birth_date ? new Date(dog.birth_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' }) : '—'}
                </div>
              </Link>
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
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-8 h-8 rounded-lg text-sm transition ${
                page === i ? 'bg-[#D74709] text-white' : 'text-white/40 hover:bg-white/10'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 text-white/30 hover:text-white disabled:opacity-20 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}
