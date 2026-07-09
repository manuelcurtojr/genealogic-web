import Link from 'next/link'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

interface ComingSoonProps {
  title: string
  description: string
  /** Lista corta de bullets explicando qué tendrá la feature. */
  features?: string[]
  backHref?: string
  backLabel?: string
}

/**
 * Pantalla placeholder para features Pro aún no implementadas.
 * Usado por las páginas del sidebar Pro (Estadísticas, Cuenta) hasta que
 * se porten desde el monorepo Pawdoq.
 */
export default async function ComingSoon({
  title,
  description,
  features,
  backHref = '/dashboard',
  backLabel = 'Volver al escritorio',
}: ComingSoonProps) {
  const t = getTranslator(await getLocale())
  return (
    <div className="max-w-2xl mx-auto py-10 lg:py-16">
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          <Sparkles className="w-3 h-3" />
          {t('Próximamente')}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          {t('Tier Pro')}
        </span>
      </div>

      <h1 className="text-3xl lg:text-4xl font-bold text-ink mb-3 tracking-tight">{title}</h1>
      <p className="text-[15px] lg:text-base text-body leading-relaxed mb-8">{description}</p>

      {features && features.length > 0 && (
        <div className="rounded-xl border border-hairline bg-canvas p-5 mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-3">
            {t('Qué tendrá esta página')}
          </p>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-body">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-muted flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition"
      >
        <ArrowLeft className="w-4 h-4" />
        {t(backLabel)}
      </Link>
    </div>
  )
}
