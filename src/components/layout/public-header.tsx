/**
 * Header para visitantes no logueados.
 *
 * Se monta en:
 *   - (public)/layout.tsx (blog, pricing, api-docs)
 *   - (dashboard)/layout.tsx cuando el user es NO logueado (dog/kennel public)
 *
 * Estructura:
 *   - Mobile: hamburguesa + wordmark + search · drawer derecho con nav
 *   - Desktop: hamburguesa + wordmark + nav inline + search + login/register
 *
 * La hamburguesa se muestra tanto en mobile como en desktop por petición —
 * en desktop el drawer ofrece atajos rápidos sin sustituir al nav inline.
 */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, User, Search, Dog, Store, BookOpen, Tag, Zap, LogIn } from 'lucide-react'
import SearchBar from './search-bar'
import { Wordmark } from '@/components/ui/wordmark'
import { Button } from '@/components/ui/button'

export default function PublicHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Cerrar con ESC + lock scroll
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
      <header className="sticky top-0 z-50 bg-white border-b border-hairline">
        {/* Mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            className="w-10 h-10 -ml-1 flex items-center justify-center text-ink hover:bg-surface-card rounded-lg transition shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Wordmark size="text-lg" />
          <div className="flex-1 min-w-0">
            <SearchBar />
          </div>
          <Link
            href="/login"
            aria-label="Iniciar sesión"
            className="w-10 h-10 rounded-full bg-surface-card border border-hairline flex items-center justify-center text-ink hover:bg-hairline transition shrink-0"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-4 px-6 py-3 max-w-[1280px] mx-auto">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            className="w-10 h-10 -ml-1 flex items-center justify-center text-ink hover:bg-surface-card rounded-lg transition shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Wordmark size="text-xl" />
          <nav className="flex items-center gap-5 ml-2 text-[13.5px] font-medium text-body">
            <Link href="/search" className="hover:text-ink transition">Perros</Link>
            <Link href="/kennels" className="hover:text-ink transition">Criaderos</Link>
            <Link href="/blog" className="hover:text-ink transition">Blog</Link>
            <Link href="/pricing" className="hover:text-ink transition">Precios</Link>
          </nav>
          <div className="flex-1 max-w-md">
            <SearchBar />
          </div>
          <Button href="/login" variant="ghost" size="sm">
            Iniciar sesión
          </Button>
          <Button href="/register" variant="primary" size="sm">
            Registrarse
          </Button>
        </div>
      </header>

      {/* Drawer público */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed top-0 right-0 h-full w-full max-w-sm z-[70] bg-canvas border-l border-hairline shadow-2xl flex flex-col animate-slide-in">
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
                <DrawerLink href="/" icon={Dog} onClick={() => setDrawerOpen(false)}>
                  Para criadores
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
              </DrawerSection>
            </nav>

            <div className="border-t border-hairline p-4 space-y-2">
              <Link
                href="/register"
                onClick={() => setDrawerOpen(false)}
                className="block w-full text-center rounded-lg bg-ink text-on-primary px-4 py-2.5 text-sm font-bold hover:opacity-90 transition"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                onClick={() => setDrawerOpen(false)}
                className="block w-full text-center rounded-lg border border-hairline bg-canvas px-4 py-2.5 text-sm font-semibold text-body hover:text-ink hover:border-ink/30 transition inline-flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" /> Iniciar sesión
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
        .animate-slide-in {
          animation: slide-in 0.25s ease-out;
        }
      `}</style>
    </>
  )
}

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted px-3 mt-2 mb-1">
        {label}
      </p>
      {children}
    </div>
  )
}

function DrawerLink({
  href, icon: Icon, onClick, children,
}: {
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
