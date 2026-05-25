/**
 * Placeholder unificado para features que están en early-access (sólo
 * habilitadas para el kennel del fundador). El resto de criadores ven
 * esta tarjeta con "Próximamente" + descripción + ETA + CTA opcional.
 *
 * Uso:
 *   if (!isEarlyAccessKennel(kennel.id)) return <ComingSoon featureId="stripe_payments" />
 */
import Link from 'next/link'
import { Sparkles, Lock } from 'lucide-react'
import { EARLY_ACCESS_FEATURES, type EarlyAccessFeatureId } from '@/lib/early-access'

export default function ComingSoon({
  featureId,
  description,
  backHref,
  backLabel,
}: {
  featureId: EarlyAccessFeatureId
  /** Descripción más larga para la página. Si no, se omite. */
  description?: string
  /** Botón de vuelta al sitio anterior. Default: /dashboard. */
  backHref?: string
  backLabel?: string
}) {
  const feature = EARLY_ACCESS_FEATURES[featureId]
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="rounded-2xl border-2 border-dashed border-hairline bg-canvas p-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-surface-card mb-4">
          <Sparkles className="w-6 h-6 text-ink" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-3">
          <Lock className="w-3 h-3" />
          Próximamente
        </div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">{feature.label}</h1>
        <p className="mt-3 text-body max-w-md mx-auto">
          {description || `Esta función estará disponible para todos los criaderos en las ${feature.eta}.`}
        </p>
        <p className="mt-2 text-xs text-muted">
          ETA: <strong className="text-ink">{feature.eta}</strong>
        </p>
        <Link
          href={backHref || '/dashboard'}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-hairline bg-canvas px-5 py-2.5 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink"
        >
          {backLabel || '← Volver al escritorio'}
        </Link>
      </div>
      <p className="mt-4 text-center text-[11px] text-muted">
        ¿Quieres ser cobaya y probarlo antes? Escríbenos a{' '}
        <a href="mailto:hola@genealogic.io" className="underline text-ink">
          hola@genealogic.io
        </a>
      </p>
    </div>
  )
}

/** Versión "inline" (chip / botón disabled). Para usar dentro de UIs existentes. */
export function ComingSoonChip({ featureId }: { featureId: EarlyAccessFeatureId }) {
  const feature = EARLY_ACCESS_FEATURES[featureId]
  return (
    <span
      title={`${feature.label} — disponible para todos en ${feature.eta}`}
      className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
    >
      <Lock className="w-2.5 h-2.5" />
      Próximamente
    </span>
  )
}
