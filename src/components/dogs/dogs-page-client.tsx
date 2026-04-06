'use client'

import { useState } from 'react'
import DogCard from './dog-card'
import DogFilters from './dog-filters'

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

export default function DogsPageClient({ dogs, breeds, favoriteDogIds, userId }: DogsPageClientProps) {
  const [search, setSearch] = useState('')
  const [sexFilter, setSexFilter] = useState('')
  const [breedFilter, setBreedFilter] = useState('')

  const filtered = dogs.filter((dog) => {
    if (search && !dog.name.toLowerCase().includes(search.toLowerCase())) return false
    if (sexFilter && dog.sex !== sexFilter) return false
    if (breedFilter && dog.breed_id !== breedFilter) return false
    return true
  })

  return (
    <>
      <DogFilters
        search={search}
        onSearchChange={setSearch}
        sexFilter={sexFilter}
        onSexChange={setSexFilter}
        breedFilter={breedFilter}
        onBreedChange={setBreedFilter}
        breeds={breeds}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-lg">
            {dogs.length === 0 ? 'No tienes perros registrados' : 'No se encontraron perros'}
          </p>
          <p className="text-white/25 text-sm mt-2">
            {dogs.length === 0 ? 'Anade tu primer perro para empezar' : 'Prueba con otros filtros'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((dog) => (
            <DogCard
              key={dog.id}
              dog={dog}
              isFavorited={favoriteDogIds.includes(dog.id)}
              userId={userId}
            />
          ))}
        </div>
      )}
    </>
  )
}
