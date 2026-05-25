/**
 * Sentinel para infinite scroll basado en IntersectionObserver.
 *
 * Uso:
 *   <InfiniteScrollSentinel
 *     hasMore={hasMore}
 *     loading={loading}
 *     onLoadMore={() => fetchNextPage()}
 *   />
 *
 * Renderiza un div invisible al final de la lista; cuando entra en
 * viewport, dispara onLoadMore (a 200px de margen para precarga suave).
 * Acepta children opcional para mostrar skeleton mientras carga.
 *
 * Defensivo:
 *  - Si hasMore=false, no observa (no llama callback de más).
 *  - Si loading=true, no re-dispara (evita race conditions con scroll
 *    rápido — el caller debe poner loading=true ANTES del fetch).
 */
'use client'

import { useEffect, useRef } from 'react'

export default function InfiniteScrollSentinel({
  hasMore,
  loading,
  onLoadMore,
  children,
  rootMargin = '200px',
}: {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  children?: React.ReactNode
  rootMargin?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore) return
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !loading) {
          onLoadMore()
        }
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore, rootMargin])

  if (!hasMore) return null

  return (
    <div ref={ref} aria-hidden="true" className="w-full">
      {children}
    </div>
  )
}
