'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface DogGalleryProps {
  photos: string[]
  name: string
  sex: string | null
}

export default function DogGallery({ photos, name, sex }: DogGalleryProps) {
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(0, c - 1))
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(photos.length - 1, c + 1))
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightboxOpen, photos.length])

  const hasPhotos = photos.length > 0
  const hasMultiple = photos.length > 1

  return (
    <>
      <div className="relative w-full overflow-hidden bg-black/30" style={{ height: 'min(45vh, 380px)' }}>
        {hasPhotos ? (
          <div className="flex h-full transition-transform duration-300" style={{ transform: `translateX(-${current * 100}%)`, width: `${photos.length * 100}%` }}>
            {photos.map((url, i) => (
              <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / photos.length}%` }}>
                <img src={url} alt={`${name} ${i + 1}`}
                  className="h-full aspect-square object-cover cursor-pointer hover:opacity-95 transition"
                  onClick={() => setLightboxOpen(true)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img src="/icon.svg" alt="" className="w-20 h-20 opacity-10" />
          </div>
        )}

        {/* Navigation arrows */}
        {hasMultiple && (
          <>
            <button onClick={() => setCurrent(c => Math.max(0, c - 1))}
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition ${current === 0 ? 'opacity-30' : ''}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrent(c => Math.min(photos.length - 1, c + 1))}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition ${current === photos.length - 1 ? 'opacity-30' : ''}`}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots indicator */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition ${i === current ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && hasPhotos && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white transition" onClick={() => setLightboxOpen(false)}>
            <X className="w-8 h-8" />
          </button>
          <img src={photos[current]} alt={name} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          {hasMultiple && (
            <>
              <button onClick={e => { e.stopPropagation(); setCurrent(c => Math.max(0, c - 1)) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white transition">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={e => { e.stopPropagation(); setCurrent(c => Math.min(photos.length - 1, c + 1)) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white transition">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <div className="absolute bottom-4 text-white/50 text-sm">{current + 1} / {photos.length}</div>
        </div>
      )}
    </>
  )
}
