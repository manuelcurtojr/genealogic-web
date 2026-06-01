'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, Dog, Filter, X, Tag, MapPin, ChevronDown } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { DogImage } from '@/components/ui/dog-image'
import InfiniteScrollSentinel from '@/components/ui/infinite-scroll-sentinel'
import { SkeletonGrid } from '@/components/ui/skeletons'
import { useT } from '@/components/i18n/locale-provider'

/**
 * Directorio público de perros: buscador por nombre + filtros (raza, sexo,
 * en venta) + paginación infinita sobre /api/public/dogs. Extraído de la
 * antigua /search para reusarse en /perros.
 */
export default function DogsDirectory({
  initialQuery = '',
  initialBreedId = '',
}: {
  initialQuery?: string
  initialBreedId?: string
}) {
  const t = useT()
  const [query, setQuery] = useState(initialQuery)
  const [breeds, setBreeds] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(!!initialBreedId)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const [breedFilter, setBreedFilter] = useState(initialBreedId)
  const [sexFilter, setSexFilter] = useState('')
  const [forSaleOnly, setForSaleOnly] = useState(false)

  const hasActiveFilters = !!breedFilter || !!sexFilter || forSaleOnly
  const PAGE_SIZE = 24

  useEffect(() => {
    const supabase = createClient()
    supabase.from('breeds').select('id, name').order('name').then(({ data }) => setBreeds(data || []))
  }, [])

  const buildUrl = useCallback((p: number) => {
    const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) })
    if (query.trim()) params.set('q', query.trim())
    if (breedFilter) params.set('breed_id', breedFilter)
    if (sexFilter) params.set('sex', sexFilter)
    if (forSaleOnly) params.set('for_sale', '1')
    return `/api/public/dogs?${params.toString()}`
  }, [query, breedFilter, sexFilter, forSaleOnly])

  const sortByHasPhoto = (rows: any[]) =>
    [...rows].sort((a, b) => {
      const ap = a.thumbnail_url ? 0 : 1
      const bp = b.thumbnail_url ? 0 : 1
      return ap - bp
    })

  const handleSearch = useCallback(async () => {
    setLoading(true)
    setPage(1)
    try {
      const res = await fetch(buildUrl(1))
      const json = await res.json()
      setResults(sortByHasPhoto(json.rows || []))
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

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const next = page + 1
    try {
      const res = await fetch(buildUrl(next))
      const json = await res.json()
      setResults((prev) => sortByHasPhoto([...prev, ...(json.rows || [])]))
      setPage(next)
      setHasMore(!!json.has_more)
    } catch {
      // no-op
    } finally {
      setLoadingMore(false)
    }
  }, [buildUrl, hasMore, loadingMore, page])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { handleSearch() }, [breedFilter, sexFilter, forSaleOnly])

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
            placeholder={t('Buscar perro por nombre...')}
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
          <div className="relative flex-1 min-w-0">
            <select
              value={breedFilter}
              onChange={e => setBreedFilter(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 pr-9 text-[13px] text-body focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none"
            >
              <option value="">{t('Todas las razas')}</option>
              {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          </div>
          <div className="relative flex-1 min-w-0 sm:flex-initial sm:min-w-[140px]">
            <select
              value={sexFilter}
              onChange={e => setSexFilter(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 pr-9 text-[13px] text-body focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition appearance-none"
            >
              <option value="">{t('Ambos sexos')}</option>
              <option value="male">{t('Macho')}</option>
              <option value="female">{t('Hembra')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          </div>
          <button
            onClick={() => setForSaleOnly(!forSaleOnly)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors ${
              forSaleOnly
                ? 'bg-[#f59e0b] text-white'
                : 'border border-hairline bg-canvas text-body hover:bg-surface-card hover:text-ink'
            }`}
          >
            <Tag className="h-4 w-4" /> {t('En venta')}
          </button>
        </div>
      )}

      {loaded && (
        <p className="text-[12.5px] text-muted">
          {total.toLocaleString('es-ES')} {total === 1 ? t('resultado') : t('resultados')}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          <SkeletonGrid count={8} type="dog" />
        </div>
      ) : results.length === 0 && loaded ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <Dog className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">{t('No se encontraron resultados.')}</p>
          <p className="text-[12.5px] text-muted">{t('Prueba con otros filtros.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
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
                      <Tag className="h-2.5 w-2.5" /> {t('En venta')}
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
                        <span className="text-[11.5px] text-muted">{t('Consultar precio')}</span>
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

      {!loading && loaded && results.length > 0 && (
        <InfiniteScrollSentinel hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore}>
          {loadingMore && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              <SkeletonGrid count={4} type="dog" />
            </div>
          )}
        </InfiniteScrollSentinel>
      )}

      {!loading && !hasMore && results.length > 0 && results.length === total && total > PAGE_SIZE && (
        <p className="text-center text-[12px] text-muted pt-6">
          {t('Has llegado al final')} · {total.toLocaleString('es-ES')} {t('resultados')}
        </p>
      )}
    </div>
  )
}
