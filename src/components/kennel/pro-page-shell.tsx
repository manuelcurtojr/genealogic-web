/**
 * Wrappers compartidos por las páginas secundarias de la web Pro.
 *
 * - ProPageShell: padding + header con eyebrow + h1 + descripción opcional
 * - OwnerDraftBanner: aviso al owner cuando una página no es pública aún
 * - EmptyState: placeholder para owner sin contenido (vista paralela)
 */
import Link from 'next/link'
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react'

export function ProPageShell({
  eyebrow, title, description, children, fullWidth = false,
}: {
  eyebrow?: string
  title: string
  description?: string
  children: React.ReactNode
  /** Si true, sin max-w (usa el ancho del dashboard). Para galería, instalaciones,
   *  catálogo de perros. Por defecto las páginas con texto/contenido legible
   *  se quedan en max-w-5xl. */
  fullWidth?: boolean
}) {
  return (
    <div className={`${fullWidth ? '' : 'mx-auto max-w-5xl'} px-0 py-8 sm:py-12 space-y-8 sm:space-y-10`}>
      <header className={fullWidth ? '' : ''}>
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-[32px] sm:text-[40px] font-semibold leading-[1.08] tracking-[-0.04em] text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-[15px] sm:text-[16px] text-body leading-[1.55] max-w-prose">
            {description}
          </p>
        )}
      </header>
      {children}
    </div>
  )
}

export function OwnerDraftBanner({ message, ctaHref, ctaLabel }: { message: string; ctaHref?: string; ctaLabel?: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 mt-0.5 text-amber-700 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[13px] sm:text-[13.5px] font-semibold text-amber-900">
            Solo tú estás viendo esto.
          </p>
          <p className="mt-0.5 text-[12.5px] sm:text-[13px] text-amber-900/80 leading-[1.55]">
            {message}
          </p>
          {ctaHref && ctaLabel && (
            <Link
              href={ctaHref}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-[12px] font-bold text-white hover:opacity-90 transition"
            >
              {ctaLabel} <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export function EmptyContentState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-8 sm:p-12 text-center">
      <Sparkles className="mx-auto h-7 w-7 text-muted" />
      <p className="mt-4 text-[15px] font-semibold text-ink">{title}</p>
      <p className="mt-1.5 text-[13.5px] text-body max-w-sm mx-auto leading-[1.55]">{description}</p>
    </div>
  )
}
