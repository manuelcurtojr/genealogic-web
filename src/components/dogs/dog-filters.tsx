'use client'

import { Search } from 'lucide-react'

interface DogFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  sexFilter: string
  onSexChange: (v: string) => void
  breedFilter: string
  onBreedChange: (v: string) => void
  breeds: { id: string; name: string }[]
}

export default function DogFilters({
  search, onSearchChange,
  sexFilter, onSexChange,
  breedFilter, onBreedChange,
  breeds,
}: DogFiltersProps) {
  const sexOptions = [
    { value: '', label: 'Todos' },
    { value: 'male', label: 'Machos' },
    { value: 'female', label: 'Hembras' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-surface-card border border-hairline rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-ink focus:outline-none transition"
        />
      </div>

      {/* Sex filter */}
      <div className="flex rounded-lg border border-hairline overflow-hidden">
        {sexOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSexChange(opt.value)}
            className={`px-3 py-2 text-xs font-medium transition ${
              sexFilter === opt.value
                ? 'bg-ink text-on-primary'
                : 'bg-surface-card text-body hover:text-ink hover:bg-surface-card'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Breed filter */}
      <select
        value={breedFilter}
        onChange={(e) => onBreedChange(e.target.value)}
        className="bg-surface-card border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition appearance-none cursor-pointer min-w-[160px]"
      >
        <option value="">Todas las razas</option>
        {breeds.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  )
}
