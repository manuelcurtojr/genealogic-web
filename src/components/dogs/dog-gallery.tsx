'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react'
import Lightbox from '@/components/ui/lightbox'
import AiUpscaledBadge from '@/components/dogs/ai-upscaled-badge'
import { videoEmbedUrl, type VideoProvider } from '@/lib/video'

export interface MediaItem {
  /** Foto, o PORTADA del vídeo. */
  url: string
  type: 'photo' | 'video'
  videoProvider?: VideoProvider | null
  /** Fuente del vídeo (URL storage para subidos, enlace YT/Vimeo). */
  videoUrl?: string | null
}

interface DogGalleryProps {
  media: MediaItem[]
  name: string
  sex: string | null
  upscaledPhotoUrl?: string | null
  upscaledOriginalUrl?: string | null
  upscaledAt?: string | null
  dogId?: string
  dogUrl?: string | null
  currentUserEmail?: string | null
}

export default function DogGallery({ media, name, sex, upscaledPhotoUrl, upscaledOriginalUrl, upscaledAt, dogId, dogUrl, currentUserEmail }: DogGalleryProps) {
  const [mobileIdx, setMobileIdx] = useState(0)
  const [desktopOffset, setDesktopOffset] = useState(0)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [videoItem, setVideoItem] = useState<MediaItem | null>(null)

  const hasMedia = media.length > 0
  const desktopVisible = 4
  const desktopMaxOffset = Math.max(0, media.length - desktopVisible)
  const emptySlots = Math.max(0, desktopVisible - media.length)

  // Fotos (para el lightbox de imágenes). Mapeo índice-media → índice-foto.
  const photoUrls = media.filter((m) => m.type === 'photo').map((m) => m.url)
  const photoIndexOf = (mediaIdx: number) =>
    media.slice(0, mediaIdx + 1).filter((m) => m.type === 'photo').length - 1

  const prevMobile = () => setMobileIdx((i) => Math.max(0, i - 1))
  const nextMobile = () => setMobileIdx((i) => Math.min(media.length - 1, i + 1))

  const openItem = (i: number) => {
    const m = media[i]
    if (!m) return
    if (m.type === 'video') setVideoItem(m)
    else setLightboxIdx(photoIndexOf(i))
  }

  // Slot = foto o portada de vídeo con ▶
  const Slot = ({ m, i, sizes, priority }: { m: MediaItem; i: number; sizes: string; priority?: boolean }) => (
    <div className="relative h-full w-full cursor-pointer" onClick={() => openItem(i)}>
      {m.type === 'video' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.url} alt={`${name} vídeo`} className="h-full w-full object-cover" />
      ) : (
        <Image src={m.url} alt={`${name} ${i + 1}`} fill sizes={sizes} priority={priority} className="object-cover transition-opacity hover:opacity-90" />
      )}
      {m.type === 'video' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
            <Play className="h-6 w-6 translate-x-0.5 fill-white text-white" />
          </span>
        </div>
      )}
      {m.type === 'photo' && upscaledAt && upscaledPhotoUrl && m.url === upscaledPhotoUrl && (
        <AiUpscaledBadge upscaledAt={upscaledAt} originalUrl={upscaledOriginalUrl} position="top-right" size="sm" />
      )}
    </div>
  )

  return (
    <>
      {/* ── Mobile ── */}
      <div className="lg:hidden relative w-full overflow-hidden bg-surface-soft">
        {hasMedia ? (
          <>
            <div className="relative aspect-square w-full">
              <Slot m={media[mobileIdx]} i={mobileIdx} sizes="100vw" priority />
              {media.length > 1 && (
                <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur-sm">
                  {mobileIdx + 1} / {media.length}
                </div>
              )}
            </div>
            {media.length > 1 && (
              <>
                <button onClick={prevMobile} className={`absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 ${mobileIdx === 0 ? 'pointer-events-none opacity-0' : ''}`}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={nextMobile} className={`absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 ${mobileIdx >= media.length - 1 ? 'pointer-events-none opacity-0' : ''}`}>
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

      {/* ── Desktop: 4 slots ── */}
      <div className="relative hidden w-full overflow-hidden bg-surface-soft lg:block">
        <div className="flex transition-transform duration-300" style={media.length > desktopVisible ? { transform: `translateX(-${desktopOffset * 25}%)` } : undefined}>
          {media.map((m, i) => (
            <div key={`m-${i}`} className="relative aspect-square w-1/4 flex-shrink-0">
              <Slot m={m} i={i} sizes="(max-width: 1024px) 25vw, 400px" priority={i < 4} />
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="relative aspect-square w-1/4 flex-shrink-0 border-l border-hairline bg-surface-card">
              <div className="flex h-full w-full items-center justify-center">
                <img src="/icon.svg?v=2" alt="" className="h-10 w-10 opacity-[0.08]" />
              </div>
            </div>
          ))}
        </div>
        {media.length > desktopVisible && (
          <>
            <button onClick={() => setDesktopOffset((o) => Math.max(0, o - 1))} className={`absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 ${desktopOffset === 0 ? 'pointer-events-none opacity-0' : ''}`}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setDesktopOffset((o) => Math.min(desktopMaxOffset, o + 1))} className={`absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 ${desktopOffset >= desktopMaxOffset ? 'pointer-events-none opacity-0' : ''}`}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Lightbox de FOTOS */}
      {lightboxIdx !== null && photoUrls.length > 0 && (
        <Lightbox
          files={photoUrls}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          reportTarget={dogId ? { type: 'photo', parentId: dogId, parentLabel: name, parentUrl: dogUrl || null, currentUserEmail: currentUserEmail || null } : undefined}
        />
      )}

      {/* Modal de VÍDEO — fondo oscuro, igual que las fotos */}
      {videoItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setVideoItem(null)}>
          <button onClick={() => setVideoItem(null)} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {videoItem.videoProvider === 'upload' ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={videoItem.videoUrl || ''} controls autoPlay playsInline className="max-h-[85vh] w-full rounded-lg bg-black" />
            ) : (
              <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: '16 / 9' }}>
                <iframe
                  src={videoEmbedUrl(videoItem.videoProvider as VideoProvider, videoItem.videoUrl || '') || ''}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={`${name} vídeo`}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
