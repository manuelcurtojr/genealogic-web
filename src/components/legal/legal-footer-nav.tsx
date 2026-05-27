'use client'

/**
 * Navegación inferior entre políticas (anterior / siguiente).
 * Se calcula a partir de LEGAL_PAGES y el pathname actual.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react'
import { LEGAL_PAGES } from './legal-sidebar'

export default function LegalFooterNav() {
  const pathname = usePathname() || ''
  const idx = LEGAL_PAGES.findIndex((p) => p.href === pathname)

  const prev = idx > 0 ? LEGAL_PAGES[idx - 1] : null
  const next = idx >= 0 && idx < LEGAL_PAGES.length - 1 ? LEGAL_PAGES[idx + 1] : null

  return (
    <div className="mt-8 space-y-4">
      {/* Prev / Next */}
      {(prev || next) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              href={prev.href}
              className="group flex items-center gap-3 rounded-xl border border-hairline bg-canvas px-4 py-3.5 transition-all hover:border-ink/30 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-soft text-muted transition-colors group-hover:text-ink">
                <ChevronLeft className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Anterior
                </p>
                <p className="mt-0.5 text-[13.5px] font-medium text-ink truncate">
                  {prev.label}
                </p>
              </div>
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}

          {next ? (
            <Link
              href={next.href}
              className="group flex items-center gap-3 rounded-xl border border-hairline bg-canvas px-4 py-3.5 text-right transition-all hover:border-ink/30 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:text-right"
            >
              <div className="min-w-0 flex-1 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Siguiente
                </p>
                <p className="mt-0.5 text-[13.5px] font-medium text-ink truncate">
                  {next.label}
                </p>
              </div>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-soft text-muted transition-colors group-hover:text-ink">
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          ) : null}
        </div>
      )}

      {/* Contacto */}
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-hairline bg-surface-soft/40 px-6 py-5 text-[13px] text-body sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted" />
          <p>
            ¿Necesitas aclarar algo o ejercer un derecho RGPD? Escríbenos a{' '}
            <a
              href="mailto:hola@genealogic.io"
              className="font-medium text-ink underline underline-offset-4"
            >
              hola@genealogic.io
            </a>
            . Respondemos en menos de 72&nbsp;horas.
          </p>
        </div>
      </div>
    </div>
  )
}
