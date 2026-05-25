/**
 * MarketingHeader — header único compartido por TODAS las páginas públicas:
 *   /, /criadores, /propietarios, /blog, /pricing, /api-docs
 *   + páginas públicas de perro/criadero cuando el visitante no está logueado.
 *
 * Reemplaza a:
 *   - PublicHeader (legacy)
 *   - StickyHeader (que vivía dentro de landing-page.tsx)
 *
 * Layout:
 *   - Mobile: hamburguesa + wordmark + búsqueda + login icon
 *   - Desktop: hamburguesa + wordmark + nav inline + búsqueda + login + CTA
 *
 * Hamburguesa visible en ambos breakpoints (en desktop como atajo al drawer).
 * El nav inline destaca la doble propuesta de valor con dos entradas
 * "Para criadores" / "Para propietarios" — clave para que cada persona se
 * sienta en casa.
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Search, Store, Dog, BookOpen, Tag, Zap, LogIn, Sparkles } from 'lucide-react'
import SearchBar from '@/components/layout/search-bar'
import { Wordmark } from '@/components/ui/wordmark'
import { Button } from '@/components/ui/button'

export default function MarketingHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!drawerOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <>
      <header className="sticky top-0 z-50 bg-canvas/90 backdrop-blur-md border-b border-hairline">
        {/* Mobile — hamburguesa + ISOTIPO (no wordmark) + search.
            Sin botón de login a la derecha: ya está en el drawer. */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            className="w-10 h-10 -ml-1 flex items-center justify-center text-ink hover:bg-surface-card rounded-lg transition shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" aria-label="Genealogic" className="shrink-0 inline-flex items-center">
            <img
              src="/icon.svg?v=2"
              alt="Genealogic"
              className="h-7 w-7"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <SearchBar />
          </div>
        </div>

        {/* Desktop — nav minimal: 3 items clave (las dos audiencias + precios).
            Perros/Criaderos/Blog viven en el drawer (la búsqueda ya cubre
            navegación directa al catálogo). */}
        <div className="hidden lg:flex items-center gap-5 px-6 py-3 max-w-[1280px] mx-auto">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            className="w-10 h-10 -ml-1 flex items-center justify-center text-ink hover:bg-surface-card rounded-lg transition shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Wordmark size="text-xl" />
          <nav className="flex items-center gap-6 ml-4 text-[14px] font-medium text-body">
            <Link href="/criadores" className="hover:text-ink transition">Criadores</Link>
            <Link href="/propietarios" className="hover:text-ink transition">Propietarios</Link>
            <Link href="/pricing" className="hover:text-ink transition">Precios</Link>
          </nav>
          <div className="flex-1 max-w-md ml-auto">
            <SearchBar />
          </div>
          <Button href="/login" variant="ghost" size="sm">
            Iniciar sesión
          </Button>
          <Button href="/register" variant="primary" size="sm">
            Empezar gratis
          </Button>
        </div>
      </header>

      {/* Drawer — sale por la izquierda (más cerca del icono hamburguesa) */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-full max-w-sm z-[70] bg-canvas border-r border-hairline shadow-2xl flex flex-col animate-slide-in-left">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-hairline">
              <Wordmark size="text-lg" asLink={false} />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar menú"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-card transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-2">
              <DrawerSection label="Explorar">
                <DrawerLink href="/search" icon={Search} onClick={() => setDrawerOpen(false)}>
                  Buscar perros
                </DrawerLink>
                <DrawerLink href="/kennels" icon={Store} onClick={() => setDrawerOpen(false)}>
                  Criaderos
                </DrawerLink>
              </DrawerSection>

              <DrawerSection label="Producto">
                <DrawerLink href="/criadores" icon={Store} onClick={() => setDrawerOpen(false)}>
                  Para criadores
                </DrawerLink>
                <DrawerLink href="/propietarios" icon={Dog} onClick={() => setDrawerOpen(false)}>
                  Para propietarios
                </DrawerLink>
                <DrawerLink href="/pricing" icon={Tag} onClick={() => setDrawerOpen(false)}>
                  Precios
                </DrawerLink>
                <DrawerLink href="/api-docs" icon={Zap} onClick={() => setDrawerOpen(false)}>
                  API pública
                </DrawerLink>
              </DrawerSection>

              <DrawerSection label="Recursos">
                <DrawerLink href="/blog" icon={BookOpen} onClick={() => setDrawerOpen(false)}>
                  Blog
                </DrawerLink>
                <DrawerLink href="/soporte" icon={Sparkles} onClick={() => setDrawerOpen(false)}>
                  Soporte
                </DrawerLink>
              </DrawerSection>
            </nav>

            <div className="border-t border-hairline p-4 space-y-2">
              <Link
                href="/register"
                onClick={() => setDrawerOpen(false)}
                className="block w-full text-center rounded-lg bg-ink text-on-primary px-4 py-2.5 text-sm font-bold hover:opacity-90 transition"
              >
                Empezar gratis
              </Link>
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-sm font-semibold text-body hover:text-ink hover:border-ink/30 transition"
              >
                <LogIn className="w-3.5 h-3.5" /> Iniciar sesión
              </Link>
            </div>
          </aside>
        </>
      )}

      <style jsx>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left { animation: slide-in-left 0.25s ease-out; }
      `}</style>
    </>
  )
}

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted px-3 mt-2 mb-1">{label}</p>
      {children}
    </div>
  )
}

function DrawerLink({ href, icon: Icon, onClick, children }: {
  href: string
  icon: React.ElementType
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-body hover:text-ink hover:bg-surface-card transition"
    >
      <Icon className="w-[18px] h-[18px]" />
      {children}
    </Link>
  )
}
