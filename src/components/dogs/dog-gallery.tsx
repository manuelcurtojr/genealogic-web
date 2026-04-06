'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface DogGalleryProps {
  photos: string[]
  name: string
  sex: string | null
}

export default function DogGallery({ photos, name, sex }: DogGalleryProps) {
  const [offset, setOffset] = useState(0)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const hasPhotos = photos.length > 0
  const visible = 4
  const maxOffset = Math.max(0, photos.length - visible)

  useEffect(() => {
    if (lightboxIdx === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null)
      if (e.key === 'ArrowLeft') setLightboxIdx(i => i !== null ? (i <= 0 ? photos.length - 1 : i - 1) : null)
      if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? (i >= photos.length - 1 ? 0 : i + 1) : null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightboxIdx, photos.length])

  return (
    <>
      {/* Gallery strip — 4 square photos visible */}
      <div className="relative w-full overflow-hidden bg-black/20">
        {hasPhotos ? (
          <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${offset * 25}%)` }}>
            {photos.map((url, i) => (
              <div key={i} className="w-1/4 flex-shrink-0 aspect-square">
                <img src={url} alt={`${name} ${i + 1}`}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                  onClick={() => setLightboxIdx(i)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full aspect-[4/1] flex items-center justify-center">
            <img src="/icon.svg" alt="" className="w-16 h-16 opacity-10" />
          </div>
        )}

        {/* Arrows — one photo at a time */}
        {photos.length > visible && (
          <>
            <button onClick={() => setOffset(o => Math.max(0, o - 1))}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition ${offset === 0 ? 'opacity-0 pointer-events-none' : ''}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setOffset(o => Math.min(maxOffset, o + 1))}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition ${offset >= maxOffset ? 'opacity-0 pointer-events-none' : ''}`}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && hasPhotos && (
        <div className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white transition" onClick={() => setLightboxIdx(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={photos[lightboxIdx]} alt={name} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          {photos.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null ? (i <= 0 ? photos.length - 1 : i - 1) : null) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white transition">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null ? (i >= photos.length - 1 ? 0 : i + 1) : null) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white transition">
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" onClick={e => e.stopPropagation()}>
                {photos.map((url, i) => (
                  <button key={i} onClick={() => setLightboxIdx(i)}
                    className={`w-12 h-12 rounded-lg overflow-hidden transition ${i === lightboxIdx ? 'ring-2 ring-[#D74709] opacity-100' : 'opacity-40 hover:opacity-70'}`}>
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
