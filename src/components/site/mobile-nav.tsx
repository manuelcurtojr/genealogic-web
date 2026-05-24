'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

/**
 * Burger nav para mobile. Tematizado: usa CSS vars del theme activo
 * para que en BMW M sea negro, en Lambo oro, en Clásico blanco, etc.
 */
export function MobileNav({
  items, kennelName,
}: {
  items: { href: string; label: string }[]
  kennelName: string
}) {
  const [open, setOpen] = useState(false)

  // Lock body scroll cuando el menu está abierto + Esc para cerrar
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="inline-flex items-center justify-center h-10 w-10 border border-hairline hover:border-theme-accent text-ink transition-colors"
        style={{ borderRadius: 'var(--button-radius, 8px)' }}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] animate-[mnFade_180ms_ease-out]"
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-canvas border-l border-hairline shadow-2xl flex flex-col animate-[mnSlide_220ms_ease-out]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
              <p
                className="text-[15px] font-bold text-ink truncate"
                style={{ fontFamily: 'var(--font-display, inherit)' }}
              >
                {kennelName}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="h-9 w-9 inline-flex items-center justify-center text-muted hover:text-theme-accent border border-hairline hover:border-theme-accent transition-colors"
                style={{ borderRadius: 'var(--button-radius, 8px)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3">
              {items.map((it, i) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-hairline last:border-0 text-[14px] font-semibold uppercase tracking-[0.12em] text-ink hover:bg-surface-soft hover:text-theme-accent transition-colors"
                >
                  <span className="text-theme-accent font-mono text-[10px] w-6">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {it.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <style>{`
        @keyframes mnFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mnSlide { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
      `}</style>
    </>
  )
}
