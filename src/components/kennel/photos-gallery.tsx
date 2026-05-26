/**
 * KennelPhotosGallery — grid de fotos con lightbox al pulsar.
 *
 * Reusable para /galeria e /instalaciones. Lightbox modal full-screen con
 * navegación (← → o teclas), pinch-to-zoom natural del navegador, click
 * fuera o ESC para cerrar.
 *
 * Layouts:
 *  - 'gallery' (default): grid 2-3-4-5 cols, aspect-square
 *  - 'facilities': grid 1-2-3 cols, aspect-[4/3] (más narrativo)
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

type Photo = { id: string; url: string; caption: string | null }

interface Props {
  photos: Photo[]
  layout?: 'gallery' | 'facilities'
}

export default function KennelPhotosGallery({ photos, layout = 'gallery' }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const close = useCallback(() => setOpenIdx(null), [])
  const next = useCallback(() => {
    if (openIdx === null) return
    setOpenIdx((openIdx + 1) % photos.length)
  }, [openIdx, photos.length])
  const prev = useCallback(() => {
    if (openIdx === null) return
    setOpenIdx((openIdx - 1 + photos.length) % photos.length)
  }, [openIdx, photos.length])

  // Teclado: ESC cierra, ←/→ navega
  useEffect(() => {
    if (openIdx === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    // Bloquea scroll del body mientras el lightbox está abierto
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [openIdx, close, next, prev])

  const gridClass = layout === 'facilities'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'
    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4'

  const aspectClass = layout === 'facilities' ? 'aspect-[4/3]' : 'aspect-square'

  return (
    <>
      <div className={gridClass}>
        {photos.map((p, i) => (
          <figure key={p.id} className="group overflow-hidden rounded-2xl border border-hairline bg-canvas">
            <button
              type="button"
              onClick={() => setOpenIdx(i)}
              className={`${aspectClass} block w-full overflow-hidden bg-surface-card cursor-zoom-in`}
              aria-label={p.caption || 'Ver foto'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption || ''}
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
              />
            </button>
            {p.caption && (
              <figcaption className={`px-3 ${layout === 'facilities' ? 'py-3 text-[12.5px] text-body' : 'py-2 text-[11.5px] text-muted truncate'}`}>
                {p.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {openIdx !== null && (
        <Lightbox
          photo={photos[openIdx]}
          index={openIdx}
          total={photos.length}
          onClose={close}
          onNext={next}
          onPrev={prev}
        />
      )}
    </>
  )
}

function Lightbox({
  photo, index, total, onClose, onNext, onPrev,
}: {
  photo: Photo
  index: number
  total: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Click fuera de la imagen cierra */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute inset-0 cursor-zoom-out"
      />

      {/* Imagen central */}
      <div className="relative max-h-[92vh] max-w-[95vw] sm:max-w-[88vw]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption || ''}
          className="max-h-[92vh] max-w-full object-contain rounded-lg shadow-2xl"
        />
        {photo.caption && (
          <p className="mt-3 text-center text-[13px] text-white/90 max-w-xl mx-auto">
            {photo.caption}
          </p>
        )}
      </div>

      {/* Controles */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <X className="h-5 w-5" />
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={onPrev}
            aria-label="Anterior"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Siguiente"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-[12px] font-medium text-white">
            {index + 1} <span className="text-white/60">/</span> {total}
          </div>
        </>
      )}
    </div>
  )
}
