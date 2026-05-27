/**
 * KennelChromeNav — menú del chrome del kennel.
 *
 * Desktop (md+):
 *   Nav inline con items horizontales, active state subrayado.
 *
 * Mobile (<md):
 *   Botón hamburguesa que abre panel lateral derecha (drawer) con
 *   backdrop, animación slide-in, links grandes. Cierra con X / backdrop /
 *   navegando a un link / Escape.
 *
 * Patrón coherente con el sidebar de Genealogic (drawer overlay full-height,
 * backdrop oscuro semi-transparente, slide desde el lateral).
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Menu, X } from 'lucide-react'

export type NavItem = {
  id: string
  href: string
  label: string
}

export default function KennelChromeNav({
  items, kennelSlug, variant,
}: {
  items: NavItem[]
  kennelSlug: string
  variant: 'compact' | 'standalone'
}) {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState(false)
  // Portal target — sólo cliente. Sin esto el drawer queda atrapado en el
  // stacking context del KennelChrome (backdrop-blur-md crea contexto nuevo)
  // y desaparece detrás del hero por mucho z-index que le metamos.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const homeHref = `/kennels/${kennelSlug}`

  function isActive(href: string): boolean {
    if (href === '') return pathname === homeHref
    const fullHref = `/kennels/${kennelSlug}/${href}`
    return pathname === fullHref || pathname.startsWith(fullHref + '/')
  }
  const hrefFor = (href: string) => href === '' ? homeHref : `${homeHref}/${href}`

  // Cierra el drawer al navegar a otra página
  useEffect(() => { setOpen(false) }, [pathname])

  // Cierra con Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  // ─── Nav inline (desktop md+) ─────────────────────────────────────────
  const desktopNav = (
    <nav className="hidden md:flex items-center gap-0 ml-auto">
      {items.map(item => {
        const active = isActive(item.href)
        if (variant === 'standalone') {
          return (
            <Link
              key={item.id}
              href={hrefFor(item.href)}
              className={`text-[13px] font-semibold uppercase tracking-[0.1em] px-3 py-2 transition-colors whitespace-nowrap ${
                active ? 'text-ink' : 'text-body hover:text-[#FE6620]'
              }`}
            >
              {item.label}
            </Link>
          )
        }
        // compact (default)
        return (
          <Link
            key={item.id}
            href={hrefFor(item.href)}
            className={`text-[13.5px] font-semibold px-3 lg:px-3.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              active
                ? 'text-ink bg-surface-card'
                : 'text-muted hover:text-ink hover:bg-surface-soft'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  // ─── Hamburger button (mobile <md) ────────────────────────────────────
  const mobileTrigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Abrir menú"
      className="md:hidden ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-surface-soft transition"
    >
      <Menu className="h-5 w-5" />
    </button>
  )

  // ─── Drawer (mobile <md) ──────────────────────────────────────────────
  // Se renderiza vía portal a document.body para escapar del stacking
  // context del header (backdrop-blur-md en KennelChrome crea uno nuevo).
  const drawer = (
    <div className="md:hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />
      {/* Panel — full screen en mobile, fondo blanco sólido (sin transparencia
          para que el hero no se vea por detrás) */}
      <aside
        className={`fixed inset-0 z-[9999] flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: '#ffffff',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-hairline" style={{ backgroundColor: '#ffffff' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Menú</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-surface-soft transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {items.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.id}
                href={hrefFor(item.href)}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-5 py-3.5 text-[15px] font-semibold transition-colors ${
                  active
                    ? 'text-ink bg-surface-card'
                    : 'text-body hover:text-ink hover:bg-surface-soft'
                }`}
              >
                <span>{item.label}</span>
                {active && <span className="text-[#FE6620] text-xl leading-none">·</span>}
              </Link>
            )
          })}
        </nav>
      </aside>
    </div>
  )

  return (
    <>
      {desktopNav}
      {mobileTrigger}
      {/* Portal a document.body — escapa de cualquier stacking context
          creado por ancestros (backdrop-filter, transform, etc). */}
      {mounted && typeof document !== 'undefined'
        ? createPortal(drawer, document.body)
        : null}
    </>
  )
}
