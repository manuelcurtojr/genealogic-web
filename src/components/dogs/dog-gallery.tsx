'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Lightbox from '@/components/ui/lightbox'

interface DogGalleryProps {
  photos: string[]
  name: string
  sex: string | null
}

export default function DogGallery({ photos, name, sex }: DogGalleryProps) {
  const [mobileIdx, setMobileIdx] = useState(0)
  const [desktopOffset, setDesktopOffset] = useState(0)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const hasPhotos = photos.length > 0
  const desktopVisible = 4
  const desktopMaxOffset = Math.max(0, photos.length - desktopVisible)

  const prevMobile = () => setMobileIdx(i => Math.max(0, i - 1))
  const nextMobile = () => setMobileIdx(i => Math.min(photos.length - 1, i + 1))

  return (
    <>
      {/* ── Mobile: single square photo ── */}
      <div className="lg:hidden relative w-full overflow-hidden bg-black/20">
        {hasPhotos ? (
          <>
            <div className="relative w-full aspect-square">
              <img
                src={photos[mobileIdx]}
                alt={`${name} ${mobileIdx + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightboxIdx(mobileIdx)}
              />
              {/* Photo counter */}
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white/80 text-xs font-medium px-2.5 py-1 rounded-full">
                  {mobileIdx + 1} / {photos.length}
                </div>
              )}
            </div>

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <button onClick={prevMobile}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition ${mobileIdx === 0 ? 'opacity-0 pointer-events-none' : ''}`}>
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextMobile}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition ${mobileIdx >= photos.length - 1 ? 'opacity-0 pointer-events-none' : ''}`}>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full aspect-square flex items-center justify-center">
            <img src="/icon.svg" alt="" className="w-16 h-16 opacity-10" />
          </div>
        )}
      </div>

      {/* ── Desktop: 4-column strip ── */}
      <div className="hidden lg:block relative w-full overflow-hidden bg-black/20">
        {hasPhotos ? (
          <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${desktopOffset * 25}%)` }}>
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

        {photos.length > desktopVisible && (
          <>
            <button onClick={() => setDesktopOffset(o => Math.max(0, o - 1))}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition ${desktopOffset === 0 ? 'opacity-0 pointer-events-none' : ''}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setDesktopOffset(o => Math.min(desktopMaxOffset, o + 1))}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition ${desktopOffset >= desktopMaxOffset ? 'opacity-0 pointer-events-none' : ''}`}>
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
