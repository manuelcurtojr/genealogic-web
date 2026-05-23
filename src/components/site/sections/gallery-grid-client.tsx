'use client'

/**
 * Galería con lightbox unificado para todas las secciones de fotos del web
 * builder (instalaciones, familias felices, comunidad…).
 *
 * Diseño cinematográfico:
 *   - Backdrop oscuro con blur
 *   - Botón X arriba a la derecha
 *   - Flechas prev/next centradas verticalmente
 *   - Contador "3 / 12" + caption abajo
 *   - Soporte teclado (Esc, ← →) y swipe táctil
 *   - Animación de entrada fade+zoom
 *
 * Tematizado: todos los hover/active usan var(--theme-accent),
 * border-radius usa var(--button-radius), backdrop usa var(--surface)
 * con opacidad (no blanco hardcoded — antes daba mal en temas oscuros).
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'

type Img = { url: string; alt?: string; width?: number; height?: number }

export function GalleryGridLightbox({
  images, columns = 3, layout = 'masonry', eyebrow, title, subtitle, cta,
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
  const next = useCallback(
    () => setOpenIdx((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length],
  )
  const prev = useCallback(
    () => setOpenIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length],
  )

  // Teclado
  useEffect(() => {
    if (openIdx === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [openIdx, close, next, prev])

  // Swipe táctil
  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)()
    touchStartX.current = null
  }

  const colsClassMasonry =
    columns === 2 ? 'sm:columns-2' : columns === 4 ? 'sm:columns-2 lg:columns-4' : 'sm:columns-2 lg:columns-3'
  const colsClassUniform =
    columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <>
      {layout === 'masonry' ? (
        <div className={`columns-1 ${colsClassMasonry} gap-4 lg:gap-5 [&>*]:mb-4 lg:[&>*]:mb-5`}>
          {images.map((im, i) => (
            <PhotoTile key={i} img={im} index={i} onOpen={() => setOpenIdx(i)} masonry />
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${colsClassUniform} gap-4 lg:gap-5`}>
          {images.map((im, i) => (
            <PhotoTile key={i} img={im} index={i} onOpen={() => setOpenIdx(i)} />
          ))}
        </div>
      )}

      {cta && (
        <div className="text-center mt-10">
          <Link
            href={cta.href}
            className="btn-brand inline-flex items-center gap-2 px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em]"
          >
            {cta.label}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}

      {openIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={images[openIdx].alt || `Foto ${openIdx + 1} de ${images.length}`}
          className="fixed inset-0 z-[100] flex items-center justify-center animate-[lbFade_180ms_ease-out]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Backdrop usa el canvas del tema con opacidad (no blanco hardcoded) */}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={close}
            className="absolute inset-0 cursor-zoom-out backdrop-blur-md"
            style={{ background: 'color-mix(in srgb, var(--surface) 90%, black)' }}
          />

          {/* Botón cerrar arriba a la derecha */}
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 h-11 w-11 inline-flex items-center justify-center text-ink/80 hover:text-theme-accent border border-hairline hover:border-theme-accent bg-canvas/70 backdrop-blur transition-colors"
            style={{ borderRadius: 'var(--button-radius, 9999px)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Flechas prev / next (con wrap-around: van en círculo) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev() }}
                aria-label="Anterior"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 inline-flex items-center justify-center text-ink/80 hover:text-theme-accent border border-hairline hover:border-theme-accent bg-canvas/70 backdrop-blur transition-colors"
                style={{ borderRadius: 'var(--button-radius, 9999px)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next() }}
                aria-label="Siguiente"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 inline-flex items-center justify-center text-ink/80 hover:text-theme-accent border border-hairline hover:border-theme-accent bg-canvas/70 backdrop-blur transition-colors"
                style={{ borderRadius: 'var(--button-radius, 9999px)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          {/* Imagen centrada */}
          <div className="relative z-[1] max-w-[92vw] max-h-[80vh] flex items-center justify-center animate-[lbZoom_220ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[openIdx].url}
              alt={images[openIdx].alt || ''}
              className="max-w-[92vw] max-h-[80vh] object-contain shadow-2xl"
              style={{ borderRadius: 'var(--button-radius, 8px)' }}
            />
          </div>

          {/* Footer con contador + caption */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 max-w-[80vw] text-center" onClick={(e) => e.stopPropagation()}>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.2em] text-ink/70">
              <span className="text-theme-accent">{String(openIdx + 1).padStart(2, '0')}</span>
              <span className="inline-block h-px w-6 bg-theme-accent opacity-60" />
              <span>{String(images.length).padStart(2, '0')}</span>
            </div>
            {images[openIdx].alt && (
              <p className="text-[13.5px] text-ink/85 leading-snug max-w-md">{images[openIdx].alt}</p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes lbFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lbZoom { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </>
  )
}

function PhotoTile({
  img, index, onOpen, masonry = false,
}: {
  img: Img
  index: number
  onOpen: () => void
  masonry?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={img.alt || `Abrir foto ${index + 1}`}
      className={`group relative ${masonry ? 'break-inside-avoid' : 'aspect-[4/3]'} overflow-hidden bg-surface-card ring-1 ring-hairline hover:ring-2 hover:ring-theme-accent transition-all duration-500 shadow-sm hover:shadow-2xl cursor-zoom-in w-full block`}
      style={{ borderRadius: 'var(--button-radius, 12px)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.url}
        alt={img.alt || ''}
        loading="lazy"
        className={`w-full ${masonry ? 'h-auto' : 'h-full'} object-cover group-hover:scale-[1.05] transition-transform duration-[900ms] ease-out`}
      />
      {/* Overlay: usa el canvas del tema con opacidad (NO blanco) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--surface) 92%, black) 0%, transparent 60%)' }}
      />
      {/* Indicador "zoom" pequeño top-right */}
      <span
        className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center text-ink/90 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 backdrop-blur"
        style={{ background: 'color-mix(in srgb, var(--surface) 80%, transparent)', borderRadius: 'var(--button-radius, 9999px)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </span>
      {img.alt && (
        <span className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 text-left opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
          <span className="block h-[2px] w-8 bg-theme-accent mb-2" />
          <span className="block text-[13px] font-medium text-ink leading-snug drop-shadow">
            {img.alt}
          </span>
        </span>
      )}
    </button>
  )
}
