'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Lightbox from '@/components/ui/lightbox'

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

      {lightboxIdx !== null && hasPhotos && (
        <Lightbox files={photos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </>
  )
}
