/**
 * Cliente del directorio de criaderos con búsqueda + infinite scroll.
 *
 * Hidrata con la primera página renderizada en server (initial), y al
 * scrollear más fetch-ea /api/public/kennels?page=N (page_size estable).
 *
 * La búsqueda por texto refetch-ea desde page=1 (los filtros del API
 * solo soportan `q`; country/breed se podrían añadir aquí en v2).
 */
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, Home } from 'lucide-react'
import Link from 'next/link'
import { pastelByName } from '@/lib/avatars'
import InfiniteScrollSentinel from '@/components/ui/infinite-scroll-sentinel'
import { SkeletonGrid } from '@/components/ui/skeletons'
import DirectoryTabs from '@/components/search/directory-tabs'

interface Kennel {
  id: string
  slug?: string | null
  name: string
  logo_url: string | null
  description: string | null
  foundation_date: string | null
  country?: string | null
  city?: string | null
}

export default function KennelsClient({
  initialKennels,
  initialTotal,
  initialHasMore,
  initialPage,
  pageSize,
}: {
  initialKennels: Kennel[]
  initialTotal: number
  initialHasMore: boolean
  initialPage: number
  pageSize: number
}) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [items, setItems] = useState<Kennel[]>(initialKennels)
  const [page, setPage] = useState(initialPage)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searching, setSearching] = useState(false)

  // Debounce de la búsqueda (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const buildUrl = useCallback((p: number) => {
    const params = new URLSearchParams({ page: String(p), page_size: String(pageSize) })
    if (debouncedSearch) params.set('q', debouncedSearch)
    return `/api/public/kennels?${params.toString()}`
  }, [debouncedSearch, pageSize])

  const resetAndSearch = useCallback(async () => {
    setSearching(true)
    try {
      const res = await fetch(buildUrl(1))
      const json = await res.json()
      setItems(json.rows || [])
      setTotal(json.total || 0)
      setHasMore(!!json.has_more)
      setPage(1)
    } catch {
      setItems([])
      setHasMore(false)
    } finally {
      setSearching(false)
    }
  }, [buildUrl])

  // Cuando cambia el query debouced (vs render inicial), refetch desde page=1
  const initialRender = useRef(true)
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
      return
    }
    void resetAndSearch()
  }, [debouncedSearch, resetAndSearch])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const next = page + 1
    try {
      const res = await fetch(buildUrl(next))
      const json = await res.json()
      setItems((prev) => [...prev, ...(json.rows || [])])
      setPage(next)
      setHasMore(!!json.has_more)
    } catch {
      // silent fail
    } finally {
      setLoadingMore(false)
    }
  }, [buildUrl, hasMore, loadingMore, page])

  return (
    <>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar criadero..."
          className="w-full bg-canvas border border-hairline rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-ink transition"
        />
      </div>

      <p className="text-xs text-muted mb-3">
        {total.toLocaleString('es-ES')} {total === 1 ? 'criadero' : 'criaderos'}
        {debouncedSearch && ` · "${debouncedSearch}"`}
      </p>

      {searching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonGrid count={9} type="kennel" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <Home className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No se encontraron criaderos</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((kennel) => (
              <Link
                key={kennel.id}
                href={`/kennels/${kennel.slug || kennel.id}`}
                className="bg-surface-card border border-hairline rounded-xl p-5 hover:bg-surface-card transition group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={kennel.logo_url ? undefined : { backgroundColor: pastelByName(kennel.name) }}
                  >
                    {kennel.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={kennel.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-white">{kennel.name[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink transition-colors truncate">{kennel.name}</p>
                    {kennel.foundation_date && (
                      <p className="text-xs text-muted mt-0.5">
                        Fundado en {new Date(kennel.foundation_date).getFullYear()}
                      </p>
                    )}
                    {kennel.description && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{kennel.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <InfiniteScrollSentinel
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={loadMore}
          >
            {loadingMore && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <SkeletonGrid count={6} type="kennel" />
              </div>
            )}
          </InfiniteScrollSentinel>

          {!hasMore && items.length === total && total > pageSize && (
            <p className="text-center text-[12px] text-muted pt-6">
              Has visto los {total.toLocaleString('es-ES')} criaderos
            </p>
          )}
        </>
      )}
    </>
  )
}
