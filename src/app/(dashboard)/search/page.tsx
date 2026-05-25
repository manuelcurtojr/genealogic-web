'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, Dog, Filter, X, Tag, MapPin, Home, ChevronDown } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { getLocalizedCountries } from '@/lib/countries'
import { DogImage } from '@/components/ui/dog-image'
import { pastelByName } from '@/lib/avatars'
import InfiniteScrollSentinel from '@/components/ui/infinite-scroll-sentinel'
import { SkeletonGrid } from '@/components/ui/skeletons'

type Tab = 'dogs' | 'kennels'

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>('dogs')

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Descubrimiento</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          Buscar
        </h1>
        <p className="mt-2 text-[14px] text-body">Encuentra perros y criaderos registrados en Genealogic.</p>
      </div>

      {/* Tabs Cal pill group */}
      <div className="inline-flex gap-1 rounded-lg bg-surface-card p-1">
        <button
          onClick={() => setTab('dogs')}
          className={`inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
            tab === 'dogs' ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'text-muted hover:text-ink'
          }`}
        >
          <Dog className="h-4 w-4" /> Perros
        </button>
        <button
          onClick={() => setTab('kennels')}
          className={`inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
            tab === 'kennels' ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'text-muted hover:text-ink'
          }`}
        >
          <Home className="h-4 w-4" /> Criaderos
        </button>
      </div>

      {tab === 'dogs' ? <DogsSearch /> : <KennelsSearch />}
    </div>
  )
}

/* ─── Dogs Search ─── */
function DogsSearch() {
  const [query, setQuery] = useState('')
  const [breeds, setBreeds] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const [breedFilter, setBreedFilter] = useState('')
  const [sexFilter, setSexFilter] = useState('')
  const [forSaleOnly, setForSaleOnly] = useState(false)

  const hasActiveFilters = !!breedFilter || !!sexFilter || forSaleOnly
  const PAGE_SIZE = 24

  useEffect(() => {
    const supabase = createClient()
    supabase.from('breeds').select('id, name').order('name').then(({ data }) => setBreeds(data || []))
  }, [])

  /** Construye URL del endpoint público con los filtros actuales. */
  const buildUrl = useCallback((p: number) => {
    const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) })
    if (query.trim()) params.set('q', query.trim())
    if (breedFilter) params.set('breed_id', breedFilter)
    if (sexFilter) params.set('sex', sexFilter)
    if (forSaleOnly) params.set('for_sale', '1')
    return `/api/public/dogs?${params.toString()}`
  }, [query, breedFilter, sexFilter, forSaleOnly])

  /** Búsqueda nueva: resetea results y empieza por página 1. */
  const handleSearch = useCallback(async () => {
    setLoading(true)
    setPage(1)
    try {
      const res = await fetch(buildUrl(1))
      const json = await res.json()
      setResults(json.rows || [])
      setTotal(json.total || 0)
      setHasMore(!!json.has_more)
      setLoaded(true)
    } catch {
      setResults([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [buildUrl])

  /** Cargar siguiente página (append a results). */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const next = page + 1
    try {
      const res = await fetch(buildUrl(next))
      const json = await res.json()
      setResults((prev) => [...prev, ...(json.rows || [])])
      setPage(next)
      setHasMore(!!json.has_more)
    } catch {
      // no-op: si falla un fetch de "more", el user puede reintentar haciendo
      // scroll arriba y abajo. No mostramos error feo.
    } finally {
      setLoadingMore(false)
    }
  }, [buildUrl, hasMore, loadingMore, page])

  // Re-search cuando cambian filtros (no query — query usa Enter o botón)
  useEffect(() => { handleSearch() }, [breedFilter, sexFilter, forSaleOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$' }

  return (
    <div className="space-y-4">
      {/* Search + filter toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar perro por nombre..."
            className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-4 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
            hasActiveFilters
              ? 'bg-ink text-on-primary'
              : 'border border-hairline bg-canvas text-body hover:bg-surface-soft hover:text-ink'
          }`}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && <span className="tabular-nums">{[breedFilter, sexFilter, forSaleOnly && 'venta'].filter(Boolean).length}</span>}
        </button>
      </div>

      {/* Filters */}
      {filtersOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-soft p-3 sm:flex-row sm:flex-wrap">
          <select
            value={breedFilter}
            onChange={e => setBreedFilter(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[13px] text-body focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none"
          >
            <option value="">Todas las razas</option>
            {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select
            value={sexFilter}
            onChange={e => setSexFilter(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[13px] text-body focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none sm:flex-initial sm:min-w-[140px]"
          >
            <option value="">Ambos sexos</option>
            <option value="male">Macho</option>
            <option value="female">Hembra</option>
          </select>
          <button
            onClick={() => setForSaleOnly(!forSaleOnly)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors ${
              forSaleOnly
                ? 'bg-[#f59e0b] text-white'
                : 'border border-hairline bg-canvas text-body hover:bg-surface-card hover:text-ink'
            }`}
          >
            <Tag className="h-4 w-4" /> En venta
          </button>
        </div>
      )}

      {loaded && (
        <p className="text-[12.5px] text-muted">
          {total.toLocaleString('es-ES')} {total === 1 ? 'resultado' : 'resultados'}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          <SkeletonGrid count={8} type="dog" />
        </div>
      ) : results.length === 0 && loaded ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <Dog className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">No se encontraron resultados.</p>
          <p className="text-[12.5px] text-muted">Prueba con otros filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((dog: any) => {
            const sexColor = dog.sex === 'male' ? BRAND.male : BRAND.female
            const breedName = dog.breed?.name
            const kennelName = dog.kennel?.name
            const symbol = currencySymbol[dog.sale_currency] || '€'
            return (
              <Link
                key={dog.id}
                href={`/dogs/${dog.slug || dog.id}`}
                className="group overflow-hidden rounded-xl border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-card">
                  <DogImage
                    src={dog.thumbnail_url}
                    alt={dog.name}
                    fill
                    width={0}
                    height={0}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="absolute inset-0 h-full w-full"
                  />
                  {breedName && (
                    <span className="absolute right-2 top-2 z-10 rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                      {breedName}
                    </span>
                  )}
                  {dog.is_for_sale && (
                    <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#f59e0b] px-2 py-0.5 text-[10.5px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
                      <Tag className="h-2.5 w-2.5" /> En venta
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: sexColor }} />
                </div>
                <div className="p-3">
                  <p className="truncate text-[14px] font-medium text-ink">{dog.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted">
                    {dog.birth_date && <span>{new Date(dog.birth_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>}
                    {kennelName && (
                      <>
                        {dog.birth_date && <span>·</span>}
                        <span className="truncate">{kennelName}</span>
                      </>
                    )}
                  </div>
                  {dog.is_for_sale && (
                    <div className="mt-2 flex items-center justify-between border-t border-hairline pt-2">
                      {dog.sale_price ? (
                        <span className="text-[13px] font-semibold text-ink tabular-nums">
                          {Number(dog.sale_price).toLocaleString('es-ES')} {symbol}
                        </span>
                      ) : (
                        <span className="text-[11.5px] text-muted">Consultar precio</span>
                      )}
                      {dog.sale_location && (
                        <span className="inline-flex items-center gap-0.5 text-[10.5px] text-muted">
                          <MapPin className="h-2.5 w-2.5" />{dog.sale_location}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Sentinel infinite scroll + skeletons mientras carga la siguiente página */}
      {!loading && loaded && results.length > 0 && (
        <InfiniteScrollSentinel
          hasMore={hasMore}
          loading={loadingMore}
          onLoadMore={loadMore}
        >
          {loadingMore && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              <SkeletonGrid count={4} type="dog" />
            </div>
          )}
        </InfiniteScrollSentinel>
      )}

      {/* Mensaje final cuando ya no hay más */}
      {!loading && !hasMore && results.length > 0 && results.length === total && total > PAGE_SIZE && (
        <p className="text-center text-[12px] text-muted pt-6">
          Has llegado al final · {total.toLocaleString('es-ES')} resultados
        </p>
      )}
    </div>
  )
}

/* ─── Kennels Search ─── */
function KennelsSearch() {
  const [query, setQuery] = useState('')
  const [breeds, setBreeds] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([])
  const [countryDropdown, setCountryDropdown] = useState(false)
  const [breedDropdown, setBreedDropdown] = useState(false)
  const [countryQ, setCountryQ] = useState('')
  const [breedQ, setBreedQ] = useState('')

  const countries = getLocalizedCountries()
  const filteredCountries = countryQ ? countries.filter(c => c.name.toLowerCase().includes(countryQ.toLowerCase())) : countries
  const filteredBreedOptions = breedQ ? breeds.filter(b => b.name.toLowerCase().includes(breedQ.toLowerCase())) : breeds
  const hasFilters = selectedCountries.length > 0 || selectedBreeds.length > 0
  const PAGE_SIZE = 30

  useEffect(() => {
    const supabase = createClient()
    supabase.from('breeds').select('id, name').order('name').then(({ data }) => setBreeds(data || []))
  }, [])

  /**
   * Construye URL del endpoint público. Nota: el API solo soporta filtros
   * "1 país" y "1 raza" (a diferencia del UI que permite múltiples). Si
   * el usuario eligió varios, pasamos el PRIMERO y filtramos el resto
   * client-side al recibir los resultados. Suficiente para v1; si se
   * vuelve crítico se amplía el API a `country__in` y `breed_id__overlap`.
   */
  const buildUrl = useCallback((p: number) => {
    const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) })
    if (query.trim()) params.set('q', query.trim())
    if (selectedCountries.length === 1) params.set('country', selectedCountries[0])
    if (selectedBreeds.length === 1) params.set('breed_id', selectedBreeds[0])
    return `/api/public/kennels?${params.toString()}`
  }, [query, selectedCountries, selectedBreeds])

  /** Filtro client-side adicional cuando el user seleccionó >1 país/raza. */
  const applyClientFilters = useCallback((rows: any[]) => {
    let out = rows
    if (selectedCountries.length > 1) {
      out = out.filter((k) => selectedCountries.includes(k.country))
    }
    if (selectedBreeds.length > 1) {
      out = out.filter((k) => {
        const ids: string[] = k.breed_ids || []
        return selectedBreeds.some((b) => ids.includes(b))
      })
    }
    return out
  }, [selectedCountries, selectedBreeds])

  const handleSearch = useCallback(async () => {
    setLoading(true)
    setPage(1)
    try {
      const res = await fetch(buildUrl(1))
      const json = await res.json()
      setResults(applyClientFilters(json.rows || []))
      setTotal(json.total || 0)
      setHasMore(!!json.has_more)
      setLoaded(true)
    } catch {
      setResults([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [buildUrl, applyClientFilters])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const next = page + 1
    try {
      const res = await fetch(buildUrl(next))
      const json = await res.json()
      setResults((prev) => [...prev, ...applyClientFilters(json.rows || [])])
      setPage(next)
      setHasMore(!!json.has_more)
    } catch {
      // silent fail
    } finally {
      setLoadingMore(false)
    }
  }, [buildUrl, applyClientFilters, hasMore, loadingMore, page])

  useEffect(() => { handleSearch() }, [selectedBreeds, selectedCountries]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = () => { setCountryDropdown(false); setBreedDropdown(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  const toggleCountry = (name: string) => setSelectedCountries(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name])
  const toggleBreed = (id: string) => setSelectedBreeds(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id])

  const triggerCls = (open: boolean, hasSelection: boolean) =>
    `w-full flex items-center gap-2 rounded-lg border bg-canvas px-3 py-2.5 text-[13px] text-left transition-colors ${
      open ? 'border-ink' : hasSelection ? 'border-hairline bg-surface-soft' : 'border-hairline hover:bg-surface-soft'
    }`

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar criadero por nombre..."
          className="w-full rounded-lg border border-hairline bg-canvas py-2.5 pl-10 pr-4 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => { setCountryDropdown(!countryDropdown); setBreedDropdown(false); setCountryQ('') }}
            className={triggerCls(countryDropdown, selectedCountries.length > 0)}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" />
            <span className={`flex-1 truncate ${selectedCountries.length > 0 ? 'text-ink' : 'text-muted'}`}>
              {selectedCountries.length > 0 ? `${selectedCountries.length} ${selectedCountries.length === 1 ? 'país' : 'países'}` : 'Filtrar por país'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
          </button>
          {countryDropdown && (
            <div className="absolute z-40 mt-1 flex max-h-72 w-full flex-col overflow-hidden rounded-lg border border-hairline bg-canvas shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
              <div className="border-b border-hairline p-2">
                <input
                  autoFocus
                  value={countryQ}
                  onChange={e => setCountryQ(e.target.value)}
                  placeholder="Buscar país..."
                  className="w-full rounded border border-hairline bg-canvas px-3 py-1.5 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredCountries.map(c => {
                  const selected = selectedCountries.includes(c.name)
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => toggleCountry(c.name)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                        selected ? 'bg-surface-card text-ink font-medium' : 'text-body hover:bg-surface-soft'
                      }`}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      {selected && <X className="h-3 w-3 shrink-0" />}
                    </button>
                  )
                })}
              </div>
              {selectedCountries.length > 0 && (
                <button onClick={() => setSelectedCountries([])} className="border-t border-hairline px-3 py-2 text-center text-[12px] text-body hover:bg-surface-soft hover:text-ink">
                  Limpiar selección
                </button>
              )}
            </div>
          )}
        </div>

        <div className="relative flex-1 min-w-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => { setBreedDropdown(!breedDropdown); setCountryDropdown(false); setBreedQ('') }}
            className={triggerCls(breedDropdown, selectedBreeds.length > 0)}
          >
            <Dog className="h-3.5 w-3.5 shrink-0 text-muted" />
            <span className={`flex-1 truncate ${selectedBreeds.length > 0 ? 'text-ink' : 'text-muted'}`}>
              {selectedBreeds.length > 0 ? `${selectedBreeds.length} ${selectedBreeds.length === 1 ? 'raza' : 'razas'}` : 'Filtrar por raza'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
          </button>
          {breedDropdown && (
            <div className="absolute z-40 mt-1 flex max-h-72 w-full flex-col overflow-hidden rounded-lg border border-hairline bg-canvas shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
              <div className="border-b border-hairline p-2">
                <input
                  autoFocus
                  value={breedQ}
                  onChange={e => setBreedQ(e.target.value)}
                  placeholder="Buscar raza..."
                  className="w-full rounded border border-hairline bg-canvas px-3 py-1.5 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredBreedOptions.map(b => {
                  const selected = selectedBreeds.includes(b.id)
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBreed(b.id)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                        selected ? 'bg-surface-card text-ink font-medium' : 'text-body hover:bg-surface-soft'
                      }`}
                    >
                      <span className="flex-1 truncate">{b.name}</span>
                      {selected && <X className="h-3 w-3 shrink-0" />}
                    </button>
                  )
                })}
              </div>
              {selectedBreeds.length > 0 && (
                <button onClick={() => setSelectedBreeds([])} className="border-t border-hairline px-3 py-2 text-center text-[12px] text-body hover:bg-surface-soft hover:text-ink">
                  Limpiar selección
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCountries.map(c => {
            const co = countries.find(x => x.name === c)
            return (
              <button
                key={c}
                onClick={() => toggleCountry(c)}
                className="inline-flex items-center gap-1 rounded-full bg-surface-card px-2.5 py-1 text-[12px] font-medium text-ink transition-colors hover:bg-hairline"
              >
                {co?.flag} {c} <X className="h-3 w-3" />
              </button>
            )
          })}
          {selectedBreeds.map(id => {
            const br = breeds.find(b => b.id === id)
            return (
              <button
                key={id}
                onClick={() => toggleBreed(id)}
                className="inline-flex items-center gap-1 rounded-full bg-surface-card px-2.5 py-1 text-[12px] font-medium text-ink transition-colors hover:bg-hairline"
              >
                {br?.name} <X className="h-3 w-3" />
              </button>
            )
          })}
          <button
            onClick={() => { setSelectedCountries([]); setSelectedBreeds([]) }}
            className="px-2 py-1 text-[12px] font-medium text-muted transition-colors hover:text-ink"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {loaded && (
        <p className="text-[12.5px] text-muted">
          {total.toLocaleString('es-ES')} {total === 1 ? 'criadero' : 'criaderos'}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <SkeletonGrid count={9} type="kennel" />
        </div>
      ) : results.length === 0 && loaded ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <Home className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">No se encontraron criaderos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {results.map((kennel: any) => {
            const co = kennel.country ? countries.find(c => c.name === kennel.country) : null
            const kennelBreeds = (kennel.breed_ids || [])
              .map((id: string) => breeds.find(b => b.id === id)?.name)
              .filter(Boolean) as string[]

            return (
              <Link
                key={kennel.id}
                href={`/kennels/${kennel.slug || kennel.id}`}
                className="group block rounded-xl border border-hairline bg-canvas p-5 transition-colors hover:bg-surface-soft"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                    {kennel.logo_url ? (
                      <img src={kennel.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: pastelByName(kennel.name) }}>
                        <span className="text-xl font-semibold text-white">{kennel.name[0]?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">{kennel.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
                      {co && (
                        <span className="inline-flex items-center gap-1">
                          {co.flag} {kennel.city ? `${kennel.city}, ${co.name}` : co.name}
                        </span>
                      )}
                      {kennel.foundation_date && <span>Desde {new Date(kennel.foundation_date).getFullYear()}</span>}
                    </div>
                  </div>
                </div>
                {kennelBreeds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {kennelBreeds.slice(0, 3).map(name => (
                      <span key={name} className="rounded-full bg-surface-card px-2 py-0.5 text-[10.5px] font-medium text-body">{name}</span>
                    ))}
                    {kennelBreeds.length > 3 && (
                      <span className="px-1 py-0.5 text-[10.5px] text-muted">+{kennelBreeds.length - 3}</span>
                    )}
                  </div>
                )}
                {kennel.description && (
                  <p className="mt-2 line-clamp-2 text-[12.5px] text-muted">{kennel.description}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Infinite scroll */}
      {!loading && loaded && results.length > 0 && (
        <InfiniteScrollSentinel
          hasMore={hasMore}
          loading={loadingMore}
          onLoadMore={loadMore}
        >
          {loadingMore && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              <SkeletonGrid count={6} type="kennel" />
            </div>
          )}
        </InfiniteScrollSentinel>
      )}

      {!loading && !hasMore && results.length > 0 && results.length === total && total > PAGE_SIZE && (
        <p className="text-center text-[12px] text-muted pt-6">
          Has llegado al final · {total.toLocaleString('es-ES')} criaderos
        </p>
      )}
    </div>
  )
}
