/**
 * KennelChromeNav — versión client del menú del chrome del kennel.
 *
 * Necesario para detectar la página activa con usePathname (los layouts
 * server no tienen acceso al pathname). Renderiza los links con active
 * state subrayado y tamaño de fuente más prominente (como sidebar Genealogic).
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
  const homeHref = `/kennels/${kennelSlug}`

  // Detecta el item activo. La home es activa solo si el pathname es
  // exactamente /kennels/<slug>; las subpáginas comparan por sub-path.
  function isActive(href: string): boolean {
    const fullHref = href === '' ? homeHref : `/kennels/${kennelSlug}/${href}`
    if (href === '') return pathname === homeHref
    return pathname === fullHref || pathname.startsWith(fullHref + '/')
  }

  if (variant === 'compact') {
    return (
      <nav className="ml-auto flex items-center gap-0 overflow-x-auto scrollbar-hide -mr-2 sm:mr-0">
        {items.map(item => {
          const active = isActive(item.href)
          const href = item.href === '' ? homeHref : `${homeHref}/${item.href}`
          return (
            <Link
              key={item.id}
              href={href}
              className={`text-[13.5px] font-semibold px-3 sm:px-3.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
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
  }

  // standalone (custom domain)
  return (
    <nav className="ml-auto hidden md:flex items-center gap-0">
      {items.map(item => {
        const active = isActive(item.href)
        const href = item.href === '' ? homeHref : `${homeHref}/${item.href}`
        return (
          <Link
            key={item.id}
            href={href}
            className={`text-[13px] font-semibold uppercase tracking-[0.1em] px-3 py-2 transition-colors whitespace-nowrap ${
              active ? 'text-ink' : 'text-body hover:text-[#FE6620]'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
