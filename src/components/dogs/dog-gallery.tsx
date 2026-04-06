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
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightboxOpen])

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {thumbnail_url ? (
          <img
            src={thumbnail_url}
            alt={name}
            className="w-full aspect-square object-cover cursor-pointer hover:opacity-90 transition"
            onClick={() => setLightboxOpen(true)}
          />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center text-white/15 text-6xl">
            {sex === 'male' ? '♂' : '♀'}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && thumbnail_url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white transition z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={thumbnail_url}
            alt={name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
