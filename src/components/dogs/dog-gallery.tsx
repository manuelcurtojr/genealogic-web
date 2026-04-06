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

  return (
    <>
      {/* Square gallery with carousel arrows */}
      <div className="relative w-full flex justify-center bg-white/[0.03] py-4">
        <div className="relative w-full max-w-[500px] aspect-square rounded-xl overflow-hidden">
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={name}
              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
              onClick={() => setLightboxOpen(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl">
              <img src="/icon.svg" alt="" className="w-24 h-24 opacity-10" />
            </div>
          )}
        </div>

        {/* Carousel arrows */}
        {thumbnail_url && (
          <>
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-black/50 transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-black/50 transition">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Lightbox */}
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
