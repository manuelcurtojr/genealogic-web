/**
 * BlogSlider — slider horizontal de posts del blog del criadero.
 *
 * Snap horizontal en mobile y desktop (no grid). Botones prev/next que
 * aparecen al pasar el ratón en desktop (oculto en mobile, donde el user
 * usa el gesto). Indicador de progreso opcional via dots.
 *
 * Estilo: cards rounded-2xl con cover + título + excerpt + fecha,
 * coherente con el resto de la home Pro.
 */
'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'

type Post = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  reading_time_minutes: number | null
}

interface Props {
  posts: Post[]
  kennelSlug: string
}

export default function BlogSlider({ posts, kennelSlug }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  // Detecta si hay scroll disponible en cada dirección
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    function update() {
      if (!el) return
      setCanPrev(el.scrollLeft > 4)
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [posts.length])

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    // Avanza el ancho de un card (~card width + gap)
    const cardWidth = Math.min(360, el.clientWidth * 0.85)
    el.scrollBy({ left: dir * (cardWidth + 16), behavior: 'smooth' })
  }

  return (
    <div className="relative group">
      {/* Botones prev/next — solo desktop, fade in en hover sección */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={!canPrev}
        aria-label="Anterior"
        className={`hidden md:inline-flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-canvas border border-hairline shadow-[0_4px_16px_rgba(0,0,0,0.08)] text-ink transition-all ${
          canPrev ? 'opacity-0 group-hover:opacity-100 hover:bg-ink hover:text-on-primary' : 'opacity-0 cursor-not-allowed'
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={!canNext}
        aria-label="Siguiente"
        className={`hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-canvas border border-hairline shadow-[0_4px_16px_rgba(0,0,0,0.08)] text-ink transition-all ${
          canNext ? 'opacity-0 group-hover:opacity-100 hover:bg-ink hover:text-on-primary' : 'opacity-0 cursor-not-allowed'
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Scroller — sin negative margin para evitar overflow horizontal
          en mobile cuando el contenedor padre no tiene padding. El padding
          interno garantiza que la primera card no quede pegada al borde. */}
      <div
        ref={scrollerRef}
        className="overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
      >
        <div className="flex gap-4 sm:gap-5 px-4 sm:px-0 pr-4 sm:pr-0">
          {posts.map(post => {
            const date = post.published_at ? new Date(post.published_at) : null
            return (
              <Link
                key={post.id}
                href={`/kennels/${kennelSlug}/blog/${post.slug}`}
                className="group/card flex-shrink-0 w-[82%] sm:w-[360px] snap-start flex flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas hover:border-ink/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition"
              >
                <div className="relative aspect-[16/10] bg-surface-card overflow-hidden">
                  {post.cover_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={post.cover_image_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover/card:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <BookOpen className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="text-[15px] sm:text-[15.5px] font-semibold text-ink leading-snug tracking-[-0.01em] line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-1.5 text-[12.5px] sm:text-[13px] text-body line-clamp-2 leading-snug">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-hairline flex items-center gap-2 text-[11px] text-muted">
                    {date && <span>{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    {post.reading_time_minutes && (
                      <>
                        <span>·</span>
                        <span>{post.reading_time_minutes} min</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
