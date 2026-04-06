'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface DogGalleryProps {
  thumbnail_url: string | null
  name: string
  sex: string | null
}

export default function DogGallery({ thumbnail_url, name, sex }: DogGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightboxOpen])

  // WP style: photos flush top/sides, displayed as squares side by side
  return (
    <>
      <div className="relative w-full overflow-hidden bg-black/20" style={{ height: 'min(50vh, 400px)' }}>
        {thumbnail_url ? (
          <div className="flex h-full">
            <img src={thumbnail_url} alt={name}
              className="h-full w-auto object-cover cursor-pointer hover:opacity-95 transition"
              onClick={() => setLightboxOpen(true)} />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img src="/icon.svg" alt="" className="w-20 h-20 opacity-10" />
          </div>
        )}

        {thumbnail_url && (
          <>
            <button className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {lightboxOpen && thumbnail_url && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white transition" onClick={() => setLightboxOpen(false)}>
            <X className="w-8 h-8" />
          </button>
          <img src={thumbnail_url} alt={name} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
