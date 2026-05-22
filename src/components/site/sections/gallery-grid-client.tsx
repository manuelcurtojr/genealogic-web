'use client'

import { useEffect, useState, useCallback } from 'react'

type Img = { url: string; alt?: string; width?: number; height?: number }

/**
 * Galería con lightbox simple. Light theme.
 * Usado por GalleryGridSection en instalaciones.tsx.
 */
export function GalleryGridLightbox({
  images, columns = 3, eyebrow, title, subtitle, cta,
}: {
  images: Img[]
  layout?: 'uniform' | 'masonry'
  columns?: 2 | 3 | 4
  eyebrow?: string
  title?: string
  subtitle?: string
  cta?: { label: string; href: string }
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const close = useCallback(() => setOpenIdx(null), [])

  useEffect(() => {
    if (openIdx === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') setOpenIdx(i => i === null ? null : Math.min(images.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setOpenIdx(i => i === null ? null : Math.max(0, i - 1))
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [openIdx, images.length, close])

  const colsClass = columns === 2
    ? 'sm:grid-cols-2'
    : columns === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {(title || subtitle || eyebrow) && (
          <div className="mb-8 text-center">
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{eyebrow}</p>
            )}
            {title && <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{title}</h2>}
            {subtitle && <p className="text-body mt-2">{subtitle}</p>}
          </div>
        )}

        <div className={`grid grid-cols-1 ${colsClass} gap-3 md:gap-4`}>
          {images.map((im, i) => (
            <button
              key={i}
              onClick={() => setOpenIdx(i)}
              className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-card border border-hairline cursor-zoom-in group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={im.url}
                alt={im.alt || ''}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
              />
            </button>
          ))}
        </div>

        {cta && (
          <div className="text-center mt-8">
            <a
              href={cta.href}
              className="inline-flex items-center justify-center rounded-lg bg-ink text-on-primary px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
            >
              {cta.label}
            </a>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {openIdx !== null && (
        <div
          onClick={close}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[openIdx].url}
            alt={images[openIdx].alt || ''}
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition flex items-center justify-center text-xl"
            aria-label="Cerrar"
          >
            ×
          </button>
          {openIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpenIdx(openIdx - 1) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition flex items-center justify-center"
              aria-label="Anterior"
            >
              ‹
            </button>
          )}
          {openIdx < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpenIdx(openIdx + 1) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition flex items-center justify-center"
              aria-label="Siguiente"
            >
              ›
            </button>
          )}
        </div>
      )}
    </section>
  )
}
