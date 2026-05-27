'use client'

/**
 * LegalHero — cabecera dinámica en /(legal). Muestra:
 *   - Breadcrumb (Inicio / Legal / Título)
 *   - Título grande de la política activa
 *   - Descripción contextual
 *
 * Funciona como Client Component porque necesitamos pathname para resolver
 * cuál política se está mostrando. Si la ruta no está en el catálogo,
 * usa fallback genérico "Documentación legal".
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LEGAL_PAGES } from './legal-sidebar'
import { ChevronRight } from 'lucide-react'

export default function LegalHero() {
  const pathname = usePathname() || ''
  const current = LEGAL_PAGES.find((p) => p.href === pathname)

  const title = current?.label || 'Documentación legal'
  const desc =
    current?.desc ||
    'Genealogic — política de uso, privacidad, cookies y propiedad intelectual.'
  const Icon = current?.icon

  return (
    <header className="relative overflow-hidden rounded-2xl border border-hairline bg-canvas">
      {/* Decoración sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at top right, var(--ink, #111) 0%, transparent 60%)',
        }}
      />

      <div className="relative px-6 py-7 sm:px-9 sm:py-9">
        {/* Breadcrumb */}
        <nav
          aria-label="Migas de pan"
          className="flex items-center gap-1.5 text-[12px] text-muted"
        >
          <Link href="/" className="hover:text-ink transition-colors">
            Inicio
          </Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className="text-body">Legal</span>
          {current && (
            <>
              <ChevronRight className="h-3 w-3 opacity-60" />
              <span className="text-ink font-medium">{current.label}</span>
            </>
          )}
        </nav>

        <div className="mt-4 flex items-start gap-4">
          {Icon && (
            <div className="hidden sm:flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-hairline bg-surface-soft">
              <Icon className="h-5 w-5 text-ink" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] sm:text-[36px] font-semibold leading-[1.1] tracking-[-0.035em] text-ink">
              {title}
            </h1>
            <p className="mt-2 text-[14px] text-body max-w-[60ch] leading-relaxed">
              {desc}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-2.5 py-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Vigente
              </span>
              <span>·</span>
              <span>Manuel Curtó SL · B56932098</span>
              <span>·</span>
              <a
                href="mailto:hola@genealogic.io"
                className="hover:text-ink transition-colors underline-offset-4 hover:underline"
              >
                hola@genealogic.io
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
