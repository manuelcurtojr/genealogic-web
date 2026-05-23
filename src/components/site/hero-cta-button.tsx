'use client'

/**
 * Botón de CTA del hero que soporta 3 modos:
 *
 * 1. Link normal: cualquier href que no sea especial → <Link href> Next.js
 * 2. Modal contacto: href === '#contact' | '#contacto' | '#form' →
 *    abre un dialog con el ContactFormInner (popup centrado, sin navegar).
 * 3. Si href es relative '.' o vacío → navega al home del kennel.
 *
 * Heredita el tema activo automáticamente (CSS vars) — no hay nada hardcoded.
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ContactFormInner from './sections/contact-form-inner'

type Variant = 'primary' | 'outline' | 'ghost'

export function HeroCtaButton({
  href, label, variant = 'primary',
}: {
  href: string
  label: string
  variant?: Variant
}) {
  const [open, setOpen] = useState(false)

  // Cierra modal con Esc
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    // Lock body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const isContactModal = /^#(contact|contacto|form)/i.test(href.trim())

  const cls =
    variant === 'outline'
      ? 'inline-flex items-center justify-center border border-white/35 backdrop-blur-sm bg-white/5 text-white px-7 py-3.5 text-[14px] font-semibold hover:bg-white/15 hover:border-white/60 transition-all'
      : variant === 'ghost'
        ? 'inline-flex items-center justify-center text-white px-7 py-3.5 text-[14px] font-semibold hover:bg-white/10 transition-all'
        : 'btn-brand inline-flex items-center justify-center px-7 py-3.5 text-[14px] font-semibold shadow-2xl shadow-black/30 uppercase tracking-[0.08em]'

  const style = variant !== 'primary' ? { borderRadius: 'var(--button-radius, 12px)' } : undefined

  if (isContactModal) {
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className={cls} style={style}>
          {label}
        </button>
        {open && <ContactModal onClose={() => setOpen(false)} />}
      </>
    )
  }

  return (
    <Link href={href || '.'} className={cls} style={style}>
      {label}
    </Link>
  )
}

function ContactModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[modalFade_180ms_ease-out]"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        className="relative w-full max-w-md bg-canvas border border-hairline shadow-2xl overflow-hidden animate-[modalSlide_220ms_ease-out]"
        style={{ borderRadius: 'var(--button-radius, 12px)' }}
      >
        {/* Cabecera con tricolor stripe si el tema la tiene */}
        <div className="p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted mb-3">
                <span className="text-theme-accent font-mono">01</span>
                <span className="inline-block h-px w-8 bg-theme-accent opacity-60" />
                Contacto directo
              </p>
              <h2
                className="text-2xl md:text-3xl font-bold text-ink tracking-[-0.02em]"
                style={{ fontFamily: 'var(--font-display, inherit)' }}
              >
                Hablar con el criador
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 h-9 w-9 inline-flex items-center justify-center text-muted hover:text-ink border border-hairline hover:border-theme-accent transition-colors"
              style={{ borderRadius: 'var(--button-radius, 8px)' }}
            >
              ✕
            </button>
          </div>
          <ContactFormInner />
        </div>
      </div>
      <style>{`
        @keyframes modalFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalSlide { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}
