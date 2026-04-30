'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, FileText, Download } from 'lucide-react'

interface LightboxProps {
  files: string[]
  startIndex: number
  onClose: () => void
}

function isImage(url: string) { return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url) }
function isPdf(url: string) { return /\.pdf(\?|$)/i.test(url) }

export default function Lightbox({ files, startIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(startIndex)
  const hasMultiple = files.length > 1

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCurrent(c => c <= 0 ? files.length - 1 : c - 1)
      if (e.key === 'ArrowRight') setCurrent(c => c >= files.length - 1 ? 0 : c + 1)
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [files.length, onClose])

  const url = files[current]
  const img = isImage(url)
  const pdf = isPdf(url)

  return (
    <div className="fixed inset-0 z-[90] bg-black/95 flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-sm text-fg-dim">{current + 1} / {files.length}</span>
        <div className="flex items-center gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-chip flex items-center justify-center text-fg-dim hover:text-fg transition" title="Descargar">
            <Download className="w-4 h-4" />
          </a>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-chip flex items-center justify-center text-fg-dim hover:text-fg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-16 pb-20 min-h-0">
        {img ? (
          <img src={url} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        ) : pdf ? (
          <iframe src={url} className="w-full h-full max-w-4xl rounded-lg bg-white" />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <FileText className="w-16 h-16 text-fg-mute" />
            <p className="text-fg-dim text-sm">Vista previa no disponible</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="bg-paper-50 text-ink-900 hover:opacity-90 px-6 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2">
              <Download className="w-4 h-4" /> Descargar archivo
            </a>
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button onClick={e => { e.stopPropagation(); setCurrent(c => c <= 0 ? files.length - 1 : c - 1) }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-fg hover:text-fg transition">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={e => { e.stopPropagation(); setCurrent(c => c >= files.length - 1 ? 0 : c + 1) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-fg hover:text-fg transition">
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" onClick={e => e.stopPropagation()}>
          {files.map((f, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden transition flex-shrink-0 ${i === current ? 'ring-2 ring-[#D74709] opacity-100' : 'opacity-40 hover:opacity-70'}`}>
              {isImage(f) ? (
                <img src={f} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-chip flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#D74709]" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
