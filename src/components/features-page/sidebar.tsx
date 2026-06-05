/**
 * Sidebar lateral de /features con navegación entre categorías y
 * features. Estilo Linear / Stripe docs:
 *   · Sticky en desktop (lg+).
 *   · En mobile aparece arriba como un dropdown.
 *   · El item activo se resalta con bg + border-left orange.
 *
 * Usa scroll-spy básico: el componente padre sabe qué feature está
 * visible y pasa `activeSlug`.
 */
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CATEGORIES } from './data'
import { ChevronDown } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

interface Props {
  /** Slug actualmente visible (scroll-spy). Si null, ningún item resaltado. */
  activeSlug?: string | null
}

export default function FeaturesSidebar({ activeSlug }: Props) {
  const t = useT()
  // En mobile: collapsible dropdown
  const [mobileOpen, setMobileOpen] = useState(false)

  // Detecta scroll-spy desde el cliente — actualiza la query string para
  // que el sidebar marque el activo aunque el padre no nos pase activeSlug.
  const [scrollSpyActive, setScrollSpyActive] = useState<string | null>(activeSlug || null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(e => e.isIntersecting)
        if (visible) {
          const id = visible.target.id
          if (id) setScrollSpyActive(id)
        }
      },
      { rootMargin: '-40% 0px -50% 0px' }, // dispara cuando el bloque está en el centro de la viewport
    )

    for (const cat of CATEGORIES) {
      for (const f of cat.features) {
        const el = document.getElementById(f.slug)
        if (el) observer.observe(el)
      }
      const catEl = document.getElementById(`cat-${cat.slug}`)
      if (catEl) observer.observe(catEl)
    }
    return () => observer.disconnect()
  }, [])

  const active = scrollSpyActive

  return (
    <>
      {/* Mobile collapsible header */}
      <div className="lg:hidden sticky top-14 z-30 bg-canvas/95 backdrop-blur-md border-b border-hairline -mx-4 sm:-mx-6 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setMobileOpen(o => !o)}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <span className="text-[13px] font-semibold text-ink">
            {t('Explorar features')}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>
        {mobileOpen && (
          <nav className="pb-3 max-h-[60vh] overflow-y-auto">
            {CATEGORIES.map(cat => (
              <div key={cat.slug} className="mb-2">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted px-2 py-1">
                  {cat.label}
                </p>
                <ul className="space-y-0.5">
                  {cat.features.map(f => {
                    const Icon = f.icon
                    const isActive = active === f.slug
                    return (
                      <li key={f.slug}>
                        <a
                          href={`#${f.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                            isActive
                              ? 'bg-surface-card text-ink font-semibold'
                              : 'text-body hover:bg-surface-soft hover:text-ink'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="truncate">{f.title}</span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
        <nav className="space-y-5">
          {CATEGORIES.map(cat => (
            <div key={cat.slug}>
              <Link
                href={`#cat-${cat.slug}`}
                className="block px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-muted hover:text-ink transition"
              >
                {cat.label}
              </Link>
              <ul className="mt-1.5 space-y-0.5">
                {cat.features.map(f => {
                  const Icon = f.icon
                  const isActive = active === f.slug
                  return (
                    <li key={f.slug}>
                      <a
                        href={`#${f.slug}`}
                        className={`group flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 text-[13px] transition-colors border-l-2 ${
                          isActive
                            ? 'border-[#FE6620] text-ink font-semibold bg-surface-soft'
                            : 'border-transparent text-body hover:text-ink hover:border-hairline'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-[#FE6620]' : 'text-muted group-hover:text-ink'}`} />
                        <span className="truncate">{f.title}</span>
                        {f.proOnly && (
                          <span className="ml-auto text-[9px] font-bold tracking-wider text-[#FE6620]">PRO</span>
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
        {/* CTA al final del sidebar */}
        <div className="mt-8 rounded-xl border border-hairline bg-gradient-to-br from-orange-50/60 to-blue-50/40 p-4">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#FE6620]">{t('¿Listo?')}</p>
          <p className="mt-1.5 text-[13px] font-semibold text-ink leading-snug">
            {t('Empieza gratis. Kennel Pro 14 días de prueba sin tarjeta.')}
          </p>
          <Link
            href="/register?intent=breeder"
            className="mt-3 inline-flex items-center justify-center w-full rounded-lg bg-ink text-on-primary px-3 py-2 text-[12.5px] font-bold hover:opacity-90 transition"
          >
            {t('Crear cuenta')}
          </Link>
        </div>
      </aside>
    </>
  )
}
