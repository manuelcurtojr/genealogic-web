'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface SlidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function SlidePanel({ open, onClose, title, children }: SlidePanelProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-ink-800 border-l border-hair shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-hair flex-shrink-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-fg-mute hover:text-fg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </>
  )
}
