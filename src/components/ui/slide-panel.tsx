'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Portal } from '@/components/ui/portal'

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
    <Portal>
      <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Panel — header y footer fijos, sólo scrollea el medio. En iOS
          respeta safe-area top/bottom para no quedar bajo el notch ni la
          home bar (en web ambas vars son 0px, sin efecto). */}
      <div
        className={`fixed top-0 right-0 h-dvh w-full max-w-md z-[70] bg-white border-l border-hairline shadow-[-12px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
        style={{
          paddingTop: 'var(--safe-area-top)',
          paddingBottom: 'var(--safe-area-bottom)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline flex-shrink-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {children}
        </div>
      </div>
      </>
    </Portal>
  )
}
