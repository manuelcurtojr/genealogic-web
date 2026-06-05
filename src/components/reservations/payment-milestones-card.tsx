'use client'

/**
 * PaymentMilestonesCard — sidebar del detalle de reserva del criador
 * (/reservas/[id]/page.tsx).
 *
 * Muestra el estado de los DOS hitos económicos clave y permite marcarlos
 * con un dialog inline (importe + método de pago). Cuando el criador
 * confirma, llama a quickMarkPaymentReceivedAction que crea un
 * reservation_payments + marca pagado en una sola transacción, y propaga
 * deposit_paid_at / paid_in_full_at a la reserva para que el timeline del
 * cliente lo refleje.
 *
 * Para gestión más fina (varios milestones, fechas límite, descripciones)
 * el criador tiene /reservas/[id]/pagos. Este es el atajo "ya cobré, marca
 * y olvida".
 */

import { useState, useTransition } from 'react'
import { Wallet, Check, X, Loader2 } from 'lucide-react'
import type { PaidVia } from '@/lib/payments/payments'

interface Milestone {
  kind: 'deposit' | 'final'
  label: string
  description: string
  doneAt: string | null
  amountCents: number | null
  suggestedAmount?: number | null
}

interface Props {
  reservationId: string
  currency: string
  deposit: Milestone
  finalPayment: Milestone
  onMark: (
    reservationId: string,
    kind: 'deposit' | 'final',
    amountStr: string,
    paidVia: PaidVia,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
}

const PAID_VIA_OPTIONS: Array<{ value: PaidVia; label: string }> = [
  { value: 'bank_transfer', label: 'Transferencia' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'stripe', label: 'Stripe (manual)' },
  { value: 'other', label: 'Otro' },
]

export default function PaymentMilestonesCard({
  reservationId, currency, deposit, finalPayment, onMark,
}: Props) {
  return (
    <section className="rounded-2xl border border-hairline bg-canvas p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-4 inline-flex items-center gap-1.5">
        <Wallet className="h-3.5 w-3.5" />
        Cobros
      </h3>
      <div className="space-y-3">
        <MilestoneRow
          milestone={deposit}
          currency={currency}
          reservationId={reservationId}
          onMark={onMark}
        />
        <MilestoneRow
          milestone={finalPayment}
          currency={currency}
          reservationId={reservationId}
          onMark={onMark}
        />
      </div>
      <p className="mt-4 text-[11px] text-muted leading-snug">
        Atajo: marca el cobro y queda registrado.{' '}
        <a href={`/reservas/${reservationId}/pagos`} className="text-ink hover:text-[#FE6620] underline">
          Más opciones →
        </a>
      </p>
    </section>
  )
}

function MilestoneRow({
  milestone, currency, reservationId, onMark,
}: {
  milestone: Milestone
  currency: string
  reservationId: string
  onMark: Props['onMark']
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>(
    milestone.suggestedAmount != null ? (milestone.suggestedAmount / 100).toString() : '',
  )
  const [paidVia, setPaidVia] = useState<PaidVia>('bank_transfer')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const isDone = !!milestone.doneAt

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await onMark(reservationId, milestone.kind, amount, paidVia)
      if (res.ok) {
        setOpen(false)
      } else {
        setError(res.error)
      }
    })
  }

  if (isDone) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-emerald-900 truncate">
                {milestone.label}
              </p>
              <p className="text-[11px] text-emerald-800">
                {milestone.amountCents != null && (
                  <>{formatAmount(milestone.amountCents, currency)} · </>
                )}
                {milestone.doneAt && formatDate(milestone.doneAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-hairline bg-surface-soft/40 px-3 py-2.5">
      {!open ? (
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-hairline bg-canvas text-muted">
              <Wallet className="h-3 w-3" />
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-ink truncate">{milestone.label}</p>
              <p className="text-[11px] text-muted truncate">{milestone.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-shrink-0 rounded-md bg-ink text-on-primary px-2.5 py-1 text-[11px] font-semibold hover:opacity-90 transition-opacity"
          >
            Marcar
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold text-ink">{milestone.label}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted hover:text-ink"
              aria-label="Cancelar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-stretch min-w-0 rounded-lg border border-hairline bg-canvas overflow-hidden focus-within:ring-2 focus-within:ring-ink/10">
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Importe"
              className="flex-1 min-w-0 bg-transparent px-2.5 py-2 text-[13px] text-ink placeholder:text-muted/60 focus:outline-none"
            />
            <span className="flex items-center px-2 text-[12px] text-muted border-l border-hairline bg-surface-soft/50 select-none">
              {currency === 'EUR' ? '€' : currency}
            </span>
          </div>
          <select
            value={paidVia}
            onChange={(e) => setPaidVia(e.target.value as PaidVia)}
            className="w-full rounded-lg border border-hairline bg-canvas px-2.5 py-2 text-[12.5px] text-ink focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30"
          >
            {PAID_VIA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {error && (
            <p className="text-[11px] text-rose-700">{error}</p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={pending || !amount}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-700 text-white px-3 py-1.5 text-[12px] font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Confirmar cobro
          </button>
        </div>
      )}
    </div>
  )
}

function formatAmount(cents: number, currency: string): string {
  const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency })
  return fmt.format(cents / 100)
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}
