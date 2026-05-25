'use client'

import { useState } from 'react'
import Image from 'next/image'
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

  // En desktop SIEMPRE mostramos 4 slots cuadrados (1/4 ancho c/u).
  // Si hay menos de 4 fotos, los huecos quedan como placeholders grises.
  // Si hay más de 4, scroll horizontal de a 1 columna.
  const emptySlots = Math.max(0, desktopVisible - photos.length)

  return (
    <>
      {/* ── Mobile: single square photo ── */}
      <div className="lg:hidden relative w-full overflow-hidden bg-surface-soft">
        {hasPhotos ? (
          <>
            <div className="relative aspect-square w-full">
              <Image
                src={photos[mobileIdx]}
                alt={`${name} ${mobileIdx + 1}`}
                fill
                sizes="100vw"
                priority
                className="cursor-pointer object-cover"
                onClick={() => setLightboxIdx(mobileIdx)}
              />
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur-sm">
                  {mobileIdx + 1} / {photos.length}
                </div>
              )}
            </div>

            {photos.length > 1 && (
              <>
                <button
                  onClick={prevMobile}
                  className={`absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 ${mobileIdx === 0 ? 'pointer-events-none opacity-0' : ''}`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextMobile}
                  className={`absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 ${mobileIdx >= photos.length - 1 ? 'pointer-events-none opacity-0' : ''}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center">
            <img src="/icon.svg?v=2" alt="" className="h-16 w-16 opacity-10" />
          </div>
        )}
      </div>

      {/* ── Desktop: siempre 4 slots cuadrados, huecos como placeholders ── */}
      <div className="relative hidden w-full overflow-hidden bg-surface-soft lg:block">
        <div
          className="flex transition-transform duration-300"
          style={photos.length > desktopVisible ? { transform: `translateX(-${desktopOffset * 25}%)` } : undefined}
        >
          {photos.map((url, i) => (
            <div key={`photo-${i}`} className="relative aspect-square w-1/4 flex-shrink-0">
              <Image
                src={url}
                alt={`${name} ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 25vw, 400px"
                priority={i < 4}
                className="cursor-pointer object-cover transition-opacity hover:opacity-90"
                onClick={() => setLightboxIdx(i)}
              />
            </div>
          ))}
          {/* Placeholders grises para completar hasta 4 slots */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="relative aspect-square w-1/4 flex-shrink-0 border-l border-hairline bg-surface-card"
            >
              <div className="flex h-full w-full items-center justify-center">
                <img src="/icon.svg?v=2" alt="" className="h-10 w-10 opacity-[0.08]" />
              </div>
            </div>
          ))}
        </div>

        {photos.length > desktopVisible && (
          <>
            <button
              onClick={() => setDesktopOffset(o => Math.max(0, o - 1))}
              className={`absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 ${desktopOffset === 0 ? 'pointer-events-none opacity-0' : ''}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setDesktopOffset(o => Math.min(desktopMaxOffset, o + 1))}
              className={`absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 ${desktopOffset >= desktopMaxOffset ? 'pointer-events-none opacity-0' : ''}`}
            >
              <ChevronRight className="h-5 w-5" />
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
