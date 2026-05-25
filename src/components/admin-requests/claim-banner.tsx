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
  const href = type === 'dog'
    ? `/reclamar/perro/${targetId}`
    : `/reclamar/criadero/${targetId}`

  return (
    <div className="rounded-xl border-2 border-dashed border-ink/20 bg-surface-soft px-4 py-3.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-ink/10 flex items-center justify-center flex-shrink-0">
        <ShieldCheck className="w-4 h-4 text-ink" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">
          ¿Es {type === 'dog' ? 'tuyo este perro' : 'tuyo este criadero'}? Reclámalo
        </p>
        <p className="text-[11px] text-muted truncate">
          {targetName} no tiene propietario asignado. Sube pruebas y verifícalo en menos de 72h.
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-3 py-2 text-xs font-bold hover:opacity-90 flex-shrink-0"
      >
        Reclamar
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
