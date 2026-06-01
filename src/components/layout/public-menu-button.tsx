/**
 * Botón hamburguesa flotante + drawer público autocontenido.
 *
 * Pensado para overlays sobre hero images (dog detail, kennel detail)
 * donde el PublicHeader sticky queda oculto o no aplica visualmente.
 * Mismo aspecto que el botón de back/share del hero.
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Search, Store, Dog, BookOpen, Tag, Zap, LogIn } from 'lucide-react'
import { Wordmark } from '@/components/ui/wordmark'
import { useT } from '@/components/i18n/locale-provider'

export default function PublicMenuButton({ className }: { className?: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('Abrir menú')}
        className={className || 'w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition'}
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed top-0 right-0 h-full w-full max-w-sm z-[70] bg-canvas border-l border-hairline shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-hairline">
              <Wordmark size="text-lg" asLink={false} />
              <button
                onClick={() => setOpen(false)}
                aria-label={t('Cerrar menú')}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-card transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-2">
              <Section label={t('Explorar')}>
                <Item href="/search" icon={Search} onClick={() => setOpen(false)}>{t('Buscar perros')}</Item>
                <Item href="/kennels" icon={Store} onClick={() => setOpen(false)}>{t('Criaderos')}</Item>
              </Section>
              <Section label={t('Producto')}>
                <Item href="/" icon={Dog} onClick={() => setOpen(false)}>{t('Para criadores')}</Item>
                <Item href="/pricing" icon={Tag} onClick={() => setOpen(false)}>{t('Precios')}</Item>
                <Item href="/api-docs" icon={Zap} onClick={() => setOpen(false)}>{t('API pública')}</Item>
              </Section>
              <Section label={t('Recursos')}>
                <Item href="/blog" icon={BookOpen} onClick={() => setOpen(false)}>{t('Blog')}</Item>
              </Section>
            </nav>

            <div className="border-t border-hairline p-4 space-y-2">
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="block w-full text-center rounded-lg bg-ink text-on-primary px-4 py-2.5 text-sm font-bold hover:opacity-90 transition"
              >
                {t('Crear cuenta')}
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-sm font-semibold text-body hover:text-ink hover:border-ink/30 transition"
              >
                <LogIn className="w-3.5 h-3.5" /> {t('Iniciar sesión')}
              </Link>
            </div>
          </aside>
        </>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.25s ease-out; }
      `}</style>
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted px-3 mt-2 mb-1">{label}</p>
      {children}
    </div>
  )
}

function Item({ href, icon: Icon, onClick, children }: {
  href: string
  icon: React.ElementType
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-body hover:text-ink hover:bg-surface-card transition">
      <Icon className="w-[18px] h-[18px]" />
      {children}
    </Link>
  )
}
