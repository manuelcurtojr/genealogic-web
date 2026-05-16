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

  // En desktop, las fotos se reparten equitativamente hasta 4 columnas.
  // Si hay 1, ocupa todo el ancho con altura fija (no aspect-square completo).
  // Si hay 2-3, se reparten 1/2 / 1/3 con aspect cuadrado.
  // Si hay 4+, 4 columnas con scroll horizontal.
  const desktopCols = Math.min(photos.length, desktopVisible)
  const colClass = desktopCols === 1 ? 'w-full' : desktopCols === 2 ? 'w-1/2' : desktopCols === 3 ? 'w-1/3' : 'w-1/4'
  const desktopHeightClass = desktopCols === 1 ? 'h-[420px]' : 'aspect-square'

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
            <img src="/icon.svg" alt="" className="h-16 w-16 opacity-10" />
          </div>
        )}
      </div>

      {/* ── Desktop: layout adaptativo según número de fotos ── */}
      <div className="relative hidden w-full overflow-hidden bg-surface-soft lg:block">
        {hasPhotos ? (
          <div
            className="flex transition-transform duration-300"
            style={photos.length > desktopVisible ? { transform: `translateX(-${desktopOffset * 25}%)` } : undefined}
          >
            {photos.map((url, i) => (
              <div key={i} className={`relative flex-shrink-0 ${colClass} ${desktopHeightClass}`}>
                <Image
                  src={url}
                  alt={`${name} ${i + 1}`}
                  fill
                  sizes={desktopCols === 1 ? '100vw' : '(max-width: 1024px) 25vw, 400px'}
                  priority={i < 4}
                  className="cursor-pointer object-cover transition-opacity hover:opacity-90"
                  onClick={() => setLightboxIdx(i)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex aspect-[16/5] w-full items-center justify-center">
            <img src="/icon.svg" alt="" className="h-16 w-16 opacity-10" />
          </div>
        )}

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
