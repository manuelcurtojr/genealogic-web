/**
 * Banner para mostrar en perfiles públicos de perros/criaderos sin owner
 * asignado (típicamente importados). Invita al user a reclamarlo.
 *
 * Componente server-safe — no usa hooks. Solo render condicional.
 */
import Link from 'next/link'
import { ShieldCheck, ArrowRight } from 'lucide-react'

export default function ClaimBanner({
  type,
  targetId,
  targetName,
}: {
  type: 'dog' | 'kennel'
  targetId: string
  targetName: string
}) {
  const isKennel = type === 'kennel'
  const href = isKennel ? `/reclamar/criadero/${targetId}` : `/reclamar/perro/${targetId}`
  // En criaderos importados, el gancho es que sus perros YA están dentro → es el
  // mejor canal de captación (criador encuentra su afijo ya poblado → reclama → Free).
  const title = isKennel
    ? 'Tus perros ya están aquí. Reclama tu criadero gratis.'
    : '¿Es tuyo este perro? Reclámalo gratis.'
  const subtitle = isKennel
    ? `${targetName} se creó al importar genealogías y aún no tiene dueño. Verifícalo en menos de 72h y gestiónalo.`
    : `${targetName} no tiene propietario asignado. Verifícalo en menos de 72h.`

  return (
    <div className="rounded-xl border-2 border-dashed border-ink/20 bg-surface-soft px-4 py-3.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-ink/10 flex items-center justify-center flex-shrink-0">
        <ShieldCheck className="w-4 h-4 text-ink" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-[11px] text-muted truncate">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-3 py-2 text-xs font-bold hover:opacity-90 flex-shrink-0"
      >
        Reclamar gratis
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
