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
  const hasPhotos = photos.length > 0
  const hasMultiple = photos.length > 1

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

  return (
    <>
      {/* Main image area */}
      <div className="relative w-full overflow-hidden bg-black/30" style={{ height: 'min(45vh, 380px)' }}>
        {hasPhotos ? (
          <>
            {/* Show multiple photos side by side like WP */}
            <div className="flex h-full">
              {photos.map((url, i) => (
                <img key={i} src={url} alt={`${name} ${i + 1}`}
                  className={`h-full flex-shrink-0 object-cover cursor-pointer transition-opacity ${i === current ? 'opacity-100' : i === current + 1 ? 'opacity-100' : 'hidden'}`}
                  style={{ maxWidth: hasMultiple ? '50%' : '100%' }}
                  onClick={() => { setCurrent(i); setLightboxOpen(true) }} />
              ))}
            </div>

            {hasMultiple && (
              <>
                <button onClick={() => setCurrent(c => c <= 0 ? photos.length - 1 : c - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrent(c => c >= photos.length - 1 ? 0 : c + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img src="/icon.svg" alt="" className="w-20 h-20 opacity-10" />
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && hasPhotos && (
        <div className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white transition" onClick={() => setLightboxOpen(false)}>
            <X className="w-8 h-8" />
          </button>
          <img src={photos[current]} alt={name} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          {hasMultiple && (
            <>
              <button onClick={e => { e.stopPropagation(); setCurrent(c => c <= 0 ? photos.length - 1 : c - 1) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white transition">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={e => { e.stopPropagation(); setCurrent(c => c >= photos.length - 1 ? 0 : c + 1) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white transition">
                <ChevronRight className="w-6 h-6" />
              </button>
              {/* Thumbnail strip */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" onClick={e => e.stopPropagation()}>
                {photos.map((url, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`w-12 h-12 rounded-lg overflow-hidden transition ${i === current ? 'ring-2 ring-[#D74709] opacity-100' : 'opacity-40 hover:opacity-70'}`}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
