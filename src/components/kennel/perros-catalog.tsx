/**
 * PerrosCatalog — catálogo completo de perros del criadero con buscador,
 * filtro de raza y tabs. Estilo idéntico al /search global pero scoped
 * al kennel actual.
 *
 * Recibe TODO el dataset del kennel desde el server (perros + camadas)
 * y filtra/busca client-side. Para criaderos con muchos perros (cientos)
 * el cliente sigue rápido — son cards ligeras, no hace falta paginar
 * para 100-300 items.
 */
'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, X, Tag, ChevronDown, Dog, Heart, Baby } from 'lucide-react'
import { BRAND } from '@/lib/constants'

type DogRow = {
  id: string
  slug: string | null
  name: string
  sex: string | null
  thumbnail_url: string | null
  is_reproductive: boolean | null
  is_for_sale: boolean | null
  sale_price: number | null
  sale_currency: string | null
  sale_location: string | null
  breed?: { name?: string } | null
}

type LitterRow = {
  id: string
  status: string
  birth_date: string | null
  mating_date: string | null
  breed?: { name?: string } | null
  father?: { id: string; name: string; thumbnail_url: string | null } | null
  mother?: { id: string; name: string; thumbnail_url: string | null } | null
}

type TabKey = 'reproductores' | 'venta' | 'camadas' | 'criados'

const TABS: { key: TabKey; label: string; icon: React.ElementType; iconColor: string }[] = [
  { key: 'reproductores', label: 'Reproductores',          icon: Heart, iconColor: '#ec4899' },
  { key: 'venta',         label: 'En venta',               icon: Tag,   iconColor: '#f59e0b' },
  { key: 'camadas',       label: 'Camadas',                icon: Baby,  iconColor: '#8b5cf6' },
  { key: 'criados',       label: 'Producido por el criadero', icon: Dog, iconColor: '#fb923c' },
]

interface Props {
  kennelName: string
  reproductores: DogRow[]
  forSale: DogRow[]
  litters: LitterRow[]
  criados: DogRow[]
  currencySymbol: Record<string, string>
}

export default function PerrosCatalog({
  kennelName, reproductores, forSale, litters, criados, currencySymbol,
}: Props) {
  const [tab, setTab] = useState<TabKey>(() => {
    // Default tab = primera con contenido
    if (reproductores.length > 0) return 'reproductores'
    if (forSale.length > 0)       return 'venta'
    if (litters.length > 0)       return 'camadas'
    if (criados.length > 0)       return 'criados'
    return 'reproductores'
  })
  const [query, setQuery] = useState('')
  const [breedFilter, setBreedFilter] = useState('')
  const [sexFilter, setSexFilter] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Lista única de razas presentes en el kennel (para el dropdown del filtro)
  const breeds = useMemo(() => {
    const set = new Set<string>()
    for (const d of [...reproductores, ...forSale, ...criados]) {
      if (d.breed?.name) set.add(d.breed.name)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [reproductores, forSale, criados])

  const counts: Record<TabKey, number> = {
    reproductores: reproductores.length,
    venta:         forSale.length,
    camadas:       litters.length,
    criados:       criados.length,
  }

  const hasActiveFilters = !!query || !!breedFilter || !!sexFilter

  // Helper de filtrado client-side (búsqueda + filtros sobre perros)
  function filterDogs(list: DogRow[]): DogRow[] {
    let out = list
    if (query) {
      const q = query.toLowerCase()
      out = out.filter(d => d.name.toLowerCase().includes(q))
    }
    if (breedFilter) {
      out = out.filter(d => d.breed?.name === breedFilter)
    }
    if (sexFilter) {
      out = out.filter(d => d.sex === sexFilter)
    }
    return out
  }

  function filterLitters(list: LitterRow[]): LitterRow[] {
    let out = list
    if (query) {
      const q = query.toLowerCase()
      out = out.filter(l => {
        const fName = l.father?.name?.toLowerCase() || ''
        const mName = l.mother?.name?.toLowerCase() || ''
        return fName.includes(q) || mName.includes(q)
      })
    }
    if (breedFilter) {
      out = out.filter(l => l.breed?.name === breedFilter)
    }
    return out
  }

  const filteredReproductores = useMemo(() => filterDogs(reproductores), [reproductores, query, breedFilter, sexFilter])
  const filteredVenta = useMemo(() => filterDogs(forSale), [forSale, query, breedFilter, sexFilter])
  const filteredCriados = useMemo(() => filterDogs(criados), [criados, query, breedFilter, sexFilter])
  const filteredCamadas = useMemo(() => filterLitters(litters), [litters, query, breedFilter])

  // Recalcula counts con filtros aplicados (no del dataset total)
  const filteredCounts: Record<TabKey, number> = {
    reproductores: filteredReproductores.length,
    venta:         filteredVenta.length,
    camadas:       filteredCamadas.length,
    criados:       filteredCriados.length,
  }

  // Si el user filtra y la tab activa queda en 0 pero otra tiene resultados,
  // saltamos a la primera con contenido para no enseñar "0 resultados"
  // gratis. Pero solo lo hacemos cuando filtersOpen=true para no molestar
  // al user mientras tipea.
  useEffect(() => {
    if (!hasActiveFilters) return
    if (filteredCounts[tab] > 0) return
    const fallback = (Object.entries(filteredCounts).find(([, n]) => n > 0)?.[0] as TabKey | undefined)
    if (fallback) setTab(fallback)
  }, [query, breedFilter, sexFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Search + filter toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Buscar en ${kennelName}…`}
            className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-4 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(o => !o)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
            hasActiveFilters
              ? 'bg-ink text-on-primary'
              : 'border border-hairline bg-canvas text-body hover:bg-surface-soft hover:text-ink'
          }`}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="tabular-nums">
              {[breedFilter, sexFilter].filter(Boolean).length || ''}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-soft p-3 sm:flex-row sm:flex-wrap">
          {breeds.length > 1 && (
            <div className="relative flex-1 min-w-0">
              <select
                value={breedFilter}
                onChange={e => setBreedFilter(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 pr-9 text-[13px] text-body focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none"
              >
                <option value="">Todas las razas</option>
                {breeds.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          )}
          <div className="relative flex-1 min-w-0 sm:flex-initial sm:min-w-[140px]">
            <select
              value={sexFilter}
              onChange={e => setSexFilter(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 pr-9 text-[13px] text-body focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none"
            >
              <option value="">Ambos sexos</option>
              <option value="male">Macho</option>
              <option value="female">Hembra</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setQuery(''); setBreedFilter(''); setSexFilter('') }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[12.5px] font-medium text-body hover:border-ink/30 hover:text-ink transition"
            >
              <X className="h-3.5 w-3.5" /> Limpiar
            </button>
          )}
        </div>
      )}

      {/* Tabs nav */}
      <div className="-mb-px flex gap-1 overflow-x-auto border-b border-hairline scrollbar-hide">
        {TABS.map(({ key, label, icon: Icon, iconColor }) => {
          const isActive = tab === key
          const count = filteredCounts[key]
          const totalCount = counts[key]
          const isEmpty = totalCount === 0
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              disabled={isEmpty}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'border-ink text-ink'
                  : isEmpty
                    ? 'border-transparent text-muted/50 cursor-not-allowed'
                    : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" style={isActive ? { color: iconColor } : undefined} />
              <span>{label}</span>
              <span
                className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums ${
                  isActive ? 'bg-ink text-on-primary' : 'bg-surface-card text-muted'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div>
        {tab === 'reproductores' && <DogGrid dogs={filteredReproductores} emptyLabel={hasActiveFilters ? 'No hay reproductores que coincidan con los filtros.' : 'Sin reproductores publicados.'} />}
        {tab === 'venta'         && <DogGrid dogs={filteredVenta} forSale currencySymbol={currencySymbol} emptyLabel={hasActiveFilters ? 'No hay perros en venta que coincidan.' : 'No hay perros en venta ahora mismo.'} />}
        {tab === 'camadas'       && <LitterGrid litters={filteredCamadas} emptyLabel={hasActiveFilters ? 'No hay camadas que coincidan.' : 'Sin camadas publicadas.'} />}
        {tab === 'criados'       && <DogGrid dogs={filteredCriados} emptyLabel={hasActiveFilters ? 'No hay perros que coincidan.' : `${kennelName} aún no tiene perros criados publicados.`} />}
      </div>
    </div>
  )
}

function DogGrid({ dogs, emptyLabel, forSale, currencySymbol }: {
  dogs: DogRow[]; emptyLabel: string; forSale?: boolean; currencySymbol?: Record<string, string>
}) {
  if (dogs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
        <p className="text-[14px] text-body">{emptyLabel}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {dogs.map(dog => forSale
        ? <SaleDogCard key={dog.id} dog={dog} currencySymbol={currencySymbol!} />
        : <PublicDogCard key={dog.id} dog={dog} />
      )}
    </div>
  )
}

function LitterGrid({ litters, emptyLabel }: { litters: LitterRow[]; emptyLabel: string }) {
  if (litters.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
        <p className="text-[14px] text-body">{emptyLabel}</p>
      </div>
    )
  }
  const statusCfg: Record<string, { label: string; color: string }> = {
    born:      { label: 'Nacida',       color: '#34d399' },
    confirmed: { label: 'Nacida',       color: '#34d399' },
    delivered: { label: 'Entregada',    color: '#22c55e' },
    mated:     { label: 'Cubrición',    color: '#f59e0b' },
    planned:   { label: 'Planificada',  color: '#3b82f6' },
    pending:   { label: 'Cubrición',    color: '#f59e0b' },
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {litters.map(litter => {
        const father = litter.father
        const mother = litter.mother
        const breedName = litter.breed?.name
        const title = father && mother ? `${father.name} × ${mother.name}` : father?.name || mother?.name || 'Camada'
        const cfg = statusCfg[litter.status] || statusCfg.planned
        return (
          <Link
            key={litter.id}
            href={`/litters/${litter.id}`}
            className="group overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
          >
            <div className="flex h-24 bg-surface-card">
              <div className="relative flex-1 overflow-hidden">
                {father?.thumbnail_url
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={father.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-lg text-muted">♂</div>
                }
              </div>
              <div className="w-px bg-hairline" />
              <div className="relative flex-1 overflow-hidden">
                {mother?.thumbnail_url
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={mother.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-lg text-muted">♀</div>
                }
              </div>
            </div>
            <div className="p-3">
              <p className="truncate text-[13px] font-medium text-ink">{title}</p>
              {breedName && <p className="mt-0.5 text-[11px] text-muted">{breedName}</p>}
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium text-white" style={{ backgroundColor: cfg.color }}>
                  {cfg.label}
                </span>
                {litter.birth_date && (
                  <span className="text-[11px] text-muted">
                    {new Date(litter.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function SaleDogCard({ dog, currencySymbol }: { dog: DogRow; currencySymbol: Record<string, string> }) {
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  const symbol = currencySymbol[dog.sale_currency || 'EUR'] || '€'
  return (
    <Link
      href={`/dogs/${dog.slug || dog.id}`}
      className="group relative overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
    >
      <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#f59e0b] px-2 py-0.5 text-[10.5px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
        <Tag className="h-2.5 w-2.5" /> En venta
      </span>
      <div className="relative aspect-square overflow-hidden bg-surface-card">
        {dog.thumbnail_url
          ? /* eslint-disable-next-line @next/next/no-img-element */
            <img src={dog.thumbnail_url} alt={dog.name} loading="lazy" className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center"><Dog className="h-10 w-10 text-muted" /></div>
        }
        {dog.breed?.name && (
          <span className="absolute right-2 top-2 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            {dog.breed.name}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </div>
      <div className="p-3">
        <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          {dog.sale_price ? (
            <p className="text-[14px] font-semibold text-ink tabular-nums">
              {Number(dog.sale_price).toLocaleString('es-ES')} {symbol}
            </p>
          ) : (
            <p className="text-[12px] text-muted">Consultar precio</p>
          )}
          {dog.sale_location && <p className="truncate text-[10.5px] text-muted">{dog.sale_location}</p>}
        </div>
      </div>
    </Link>
  )
}

function PublicDogCard({ dog }: { dog: DogRow }) {
  const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
  return (
    <Link
      href={`/dogs/${dog.slug || dog.id}`}
      className="group overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-card">
        {dog.thumbnail_url
          ? /* eslint-disable-next-line @next/next/no-img-element */
            <img src={dog.thumbnail_url} alt={dog.name} loading="lazy" className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center"><Dog className="h-10 w-10 text-muted" /></div>
        }
        {dog.breed?.name && (
          <span className="absolute right-2 top-2 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            {dog.breed.name}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
      </div>
      <div className="p-3">
        <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
        {dog.breed?.name && <p className="mt-0.5 truncate text-[11.5px] text-muted">{dog.breed.name}</p>}
      </div>
    </Link>
  )
}
