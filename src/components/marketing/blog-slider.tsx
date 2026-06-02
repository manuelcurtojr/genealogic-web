/**
 * BlogSlider — carrusel horizontal de posts del blog para la home.
 *
 * - Scroll horizontal nativo con snap (mobile) + flechas en desktop.
 * - Cada card: imagen hero, categoría, título, excerpt, readMinutes.
 * - Click va al post; "Ver todo el blog" → /blog.
 *
 * Filosofía: discovery-first. La home enseña que hay contenido editorial
 * real, no es solo software. Por eso el slider vive en la home y no en
 * un footer escondido.
 */
'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight, Clock } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

type BlogCard = {
  slug: string
  title: string
  excerpt: string
  category: string
  heroImage: string
  heroAlt: string
  readMinutes: number
  date: string
}

export default function BlogSlider({ posts }: { posts: BlogCard[] }) {
  const t = useT()
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  function updateArrows() {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [])

  function scrollBy(dir: 'left' | 'right') {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('[data-card]') as HTMLElement | null
    const delta = (card?.offsetWidth || 320) + 16
    el.scrollBy({ left: dir === 'right' ? delta : -delta, behavior: 'smooth' })
  }

  if (posts.length === 0) return null

  return (
    <section className="border-b border-hairline bg-canvas">
      {/* Padding/max-width alineados con el resto del home (DiscoveryHome):
          max-w-[1280px] + px-5 sm:px-6 lg:px-12. Antes era max-w-[1200px]
          + px-6 lg:px-12 — las cards arrancaban más a la izquierda que el
          resto de secciones, parecía pegado al borde. */}
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
        <div className="mb-6 sm:mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[#FE6620]">{t('Aprende')}</p>
            <h2 className="mt-3 font-semibold text-ink" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              {t('Guías y artículos del blog')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollBy('left')}
              disabled={!canScrollLeft}
              aria-label={t('Anterior')}
              className="hidden sm:inline-flex w-9 h-9 rounded-full border border-hairline bg-canvas items-center justify-center text-ink hover:border-ink/40 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollBy('right')}
              disabled={!canScrollRight}
              aria-label={t('Siguiente')}
              className="hidden sm:inline-flex w-9 h-9 rounded-full border border-hairline bg-canvas items-center justify-center text-ink hover:border-ink/40 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Link href="/blog" className="ml-2 text-sm font-semibold text-ink hover:opacity-80 inline-flex items-center gap-1">
              {t('Ver blog')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Track full-bleed: cancela el padding del container con -mx-X,
            luego el track interior restablece padding con px-X para que la
            PRIMERA card no quede pegada al borde de la viewport. Los
            valores deben coincidir con los del container padre. */}
        <div className="relative -mx-5 sm:-mx-6 lg:-mx-12">
          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto px-5 sm:px-6 lg:px-12 pb-2 snap-x snap-mandatory scroll-smooth scrollbar-hide"
            style={{ scrollbarWidth: 'none' }}
          >
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                data-card
                className="group flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[340px] snap-start rounded-2xl border border-hairline bg-canvas overflow-hidden hover:border-ink/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition"
              >
                <div className="aspect-[16/10] overflow-hidden bg-surface-card relative">
                  <img
                    src={p.heroImage}
                    alt={p.heroAlt}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-canvas/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                    {p.category}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-[16px] font-bold text-ink leading-snug line-clamp-2">{p.title}</h3>
                  <p className="mt-2 text-[13px] text-body leading-[1.5] line-clamp-2">{p.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {p.readMinutes} min
                    </span>
                    <span>{new Date(p.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                  </div>
                </div>
              </Link>
            ))}
            {/* spacer del final para que la última card no quede pegada al borde */}
            <div className="flex-shrink-0 w-2" aria-hidden />
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  )
}
