/**
 * DogPicker — selector de perro con búsqueda + filtros (raza, sexo).
 *
 * Reutilizable entre /genetica, /reproduccion, /reproduccion/gantt y cualquier
 * otra página que tenga el patrón "lista lateral + editor del perro elegido".
 *
 * Comportamiento responsive:
 *   - Desktop (lg+): sidebar lateral fijo con filtros arriba + lista debajo.
 *   - Mobile (<lg): el componente ocupa todo el ancho. Si NO hay perro
 *     seleccionado, se muestra solo el picker con sus filtros + resultados.
 *     Si SÍ hay perro seleccionado, se oculta el picker (`hide={true}`) y
 *     el padre renderiza el editor full-width con un botón "← Cambiar perro"
 *     que el padre puede mostrar.
 *
 * Selección: cambia el URL via `routerPath?dog=<id>` para que sea deep-linkable.
 * El padre lee `searchParams.dog` para saber qué perro está activo.
 */
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'

export interface DogPickerDog {
  id: string
  name: string
  slug: string | null
  sex: string | null
  thumbnail_url: string | null
  breed_id?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  breed?: any
}

interface Props {
  dogs: DogPickerDog[]
  selectedDogId: string | null
  /** Path base sobre el que se construyen los links: `/genetica`, `/reproduccion`, etc. */
  routerPath: string
  /** Si true, el picker se oculta entero en mobile (cuando hay perro seleccionado). */
  hideOnMobile?: boolean
  /** Label del bloque (por defecto "Mis perros"). */
  label?: string
  /** Si true, solo permite hembras (filtra el toggle de sexo). */
  femalesOnly?: boolean
}

export default function DogPicker({
  dogs,
  selectedDogId,
  routerPath,
  hideOnMobile = false,
  label = 'Mis perros',
  femalesOnly = false,
}: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [sexFilter, setSexFilter] = useState<'all' | 'male' | 'female'>(femalesOnly ? 'female' : 'all')
  const [breedFilter, setBreedFilter] = useState<string>('all')

  // Lista única de razas presentes en los perros
  const availableBreeds = useMemo(() => {
    const set = new Map<string, string>()
    for (const d of dogs) {
      const breedName = Array.isArray(d.breed) ? d.breed[0]?.name : d.breed?.name
      if (d.breed_id && breedName) set.set(d.breed_id, breedName)
    }
    return Array.from(set.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [dogs])

  // Normaliza para búsqueda (lower + sin acentos)
  function normalize(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return dogs.filter(d => {
      if (femalesOnly && d.sex !== 'female') return false
      if (sexFilter !== 'all' && d.sex !== sexFilter) return false
      if (breedFilter !== 'all' && d.breed_id !== breedFilter) return false
      if (q.length >= 1 && !normalize(d.name).includes(q)) return false
      return true
    })
  }, [dogs, query, sexFilter, breedFilter, femalesOnly])

  const hasActiveFilters = query.trim() || sexFilter !== (femalesOnly ? 'female' : 'all') || breedFilter !== 'all'

  function clearFilters() {
    setQuery('')
    setSexFilter(femalesOnly ? 'female' : 'all')
    setBreedFilter('all')
  }

  function selectDog(id: string) {
    router.push(`${routerPath}?dog=${id}`)
  }

  // Wrapper classes: en mobile full-width y oculto si hideOnMobile=true.
  // Desktop: sidebar lateral fijo siempre visible.
  const wrapperCls = hideOnMobile
    ? 'hidden lg:block rounded-xl border border-hairline bg-canvas overflow-hidden'
    : 'rounded-xl border border-hairline bg-canvas overflow-hidden'

  return (
    <aside className={wrapperCls}>
      {/* ─── Filtros ───────────────────────────────────────────────────── */}
      <div className="border-b border-hairline p-3 space-y-2.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
          {label}
          <span className="ml-1.5 text-muted/70 normal-case font-normal">· {filtered.length} de {dogs.length}</span>
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre…"
            // text-base en mobile evita zoom auto de iOS Safari
            className="w-full rounded-lg border border-hairline bg-surface-card pl-8 pr-3 py-2 text-base sm:text-[13px] text-ink placeholder:text-muted focus:outline-none focus:border-ink/30 transition-colors"
          />
        </div>

        {/* Sex + Breed filters en grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Sex */}
          {!femalesOnly ? (
            <select
              value={sexFilter}
              onChange={(e) => setSexFilter(e.target.value as 'all' | 'male' | 'female')}
              className="rounded-lg border border-hairline bg-surface-card px-2.5 py-2 text-base sm:text-[12.5px] text-ink focus:outline-none focus:border-ink/30 transition-colors"
            >
              <option value="all">Todos los sexos</option>
              <option value="male">♂ Machos</option>
              <option value="female">♀ Hembras</option>
            </select>
          ) : (
            <div className="rounded-lg border border-hairline bg-surface-soft px-2.5 py-2 text-[12.5px] text-muted text-center">
              ♀ Solo hembras
            </div>
          )}
          {/* Breed */}
          <select
            value={breedFilter}
            onChange={(e) => setBreedFilter(e.target.value)}
            disabled={availableBreeds.length === 0}
            className="rounded-lg border border-hairline bg-surface-card px-2.5 py-2 text-base sm:text-[12.5px] text-ink focus:outline-none focus:border-ink/30 transition-colors disabled:opacity-50"
          >
            <option value="all">Todas las razas</option>
            {availableBreeds.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-[11.5px] text-muted hover:text-ink transition"
          >
            <X className="h-3 w-3" /> Limpiar filtros
          </button>
        )}
      </div>

      {/* ─── Lista de perros filtrados ─────────────────────────────────── */}
      <ul className="max-h-[60vh] lg:max-h-[calc(100vh-280px)] overflow-y-auto p-2 space-y-0.5">
        {filtered.length === 0 ? (
          <li className="px-3 py-6 text-center text-[12.5px] text-muted">
            <Filter className="mx-auto h-4 w-4 mb-1.5 opacity-50" />
            Sin perros con esos filtros
          </li>
        ) : (
          filtered.map((dog) => {
            const isSelected = selectedDogId === dog.id
            return (
              <li key={dog.id}>
                <button
                  type="button"
                  onClick={() => selectDog(dog.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors ${
                    isSelected
                      ? 'bg-surface-card font-medium text-ink'
                      : 'text-body hover:bg-surface-soft'
                  }`}
                >
                  {dog.thumbnail_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={dog.thumbnail_url}
                      alt=""
                      loading="lazy"
                      className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-surface-card flex items-center justify-center text-[11px] text-muted">
                      {dog.sex === 'male' ? '♂' : dog.sex === 'female' ? '♀' : '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px]">{dog.name}</p>
                    {(() => {
                      const breedName = Array.isArray(dog.breed) ? dog.breed[0]?.name : dog.breed?.name
                      return breedName ? (
                        <p className="truncate text-[11px] text-muted">{breedName}</p>
                      ) : null
                    })()}
                  </div>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </aside>
  )
}
