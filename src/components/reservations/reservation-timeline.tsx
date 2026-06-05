/**
 * ReservationTimeline — visual vertical de los hitos de la reserva.
 *
 * Pensado para el panel del propietario en /mis-reservas/[id]. Hace el ciclo
 * completo desde "Solicitud enviada" hasta "Cachorro entregado" obvio de un
 * vistazo: el cliente sabe SIEMPRE qué falta y qué ya se cumplió.
 *
 * Estados visuales:
 *   - done    → círculo relleno ink con check blanco + texto ink + fecha
 *   - current → círculo amber con icono coloreado + ring pulsante + texto ink
 *   - pending → círculo border gris + icono muted + texto muted
 *
 * El hito "Reserva confirmada" (celebrate=true) se renderiza con highlight
 * emerald cuando está done: pequeña celebración visual sin ser hortera.
 *
 * Server component puro — recibe los steps ya calculados desde el server
 * (via getReservationTimelineSteps). Sin estado, sin lifecycle, sin JS extra.
 */

import {
  FileText, PenLine, Wallet, Sparkles, Dog, PackageCheck, Mail, Check,
} from 'lucide-react'
import type { TimelineStep } from '@/lib/owner/reservations'
import { formatDate } from '@/lib/owner/reservations'

const ICONS = {
  'file-text': FileText,
  'pen-line': PenLine,
  'wallet': Wallet,
  'sparkles': Sparkles,
  'dog': Dog,
  'package-check': PackageCheck,
  'mail': Mail,
} as const

export default function ReservationTimeline({
  steps,
  t,
}: {
  steps: TimelineStep[]
  t: (k: string) => string
}) {
  return (
    <ol className="space-y-1 min-w-0">
      {steps.map((step, i) => (
        <Step
          key={step.id}
          step={step}
          isLast={i === steps.length - 1}
          t={t}
        />
      ))}
    </ol>
  )
}

function Step({
  step, isLast, t,
}: {
  step: TimelineStep
  isLast: boolean
  t: (k: string) => string
}) {
  const Icon = ICONS[step.icon]
  const isCelebration = step.celebrate && step.state === 'done'

  // Estilos según estado
  const dotClass =
    step.state === 'done'
      ? isCelebration
        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
        : 'bg-ink text-on-primary'
      : step.state === 'current'
      ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-100/60'
      : 'bg-canvas text-muted border-2 border-hairline'

  const lineClass =
    step.state === 'done' && !isCelebration
      ? 'bg-ink/30'
      : step.state === 'done' && isCelebration
      ? 'bg-emerald-300'
      : 'bg-hairline'

  const labelClass =
    step.state === 'pending'
      ? 'text-muted'
      : isCelebration
      ? 'text-emerald-800 font-bold'
      : 'text-ink font-semibold'

  return (
    <li className="relative flex gap-4 min-w-0">
      {/* Columna izquierda: dot + línea vertical */}
      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${dotClass}`}>
          {step.state === 'done' && !isCelebration ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[28px] mt-1 mb-1 transition-colors ${lineClass}`} />
        )}
      </div>

      {/* Columna derecha: label + fecha + detail */}
      <div className={`flex-1 min-w-0 pb-5 ${isLast ? 'pb-0' : ''}`}>
        <div className="flex items-baseline justify-between gap-3 flex-wrap min-w-0">
          <p className={`text-[14px] leading-tight ${labelClass}`}>
            {t(step.label)}
            {step.state === 'current' && (
              <span className="ml-2 inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full align-middle">
                {t('Siguiente')}
              </span>
            )}
            {isCelebration && (
              <span className="ml-2 text-base align-middle">🎉</span>
            )}
          </p>
          {step.date && step.state === 'done' && (
            <span className="text-[11px] text-muted tabular-nums flex-shrink-0">
              {formatDate(step.date)}
            </span>
          )}
        </div>
        {step.detail && step.state !== 'pending' && (
          <p className="mt-0.5 text-[12px] text-muted truncate">
            {step.detail}
          </p>
        )}
      </div>
    </li>
  )
}
