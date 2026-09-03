'use client'

/**
 * Módulo de COBROS para el panel lateral del embudo. Permite, sin salir del
 * panel: fijar/editar el precio total, ver pagado/pendiente y registrar tantos
 * pagos como se hayan acordado (2, 3, 6…), o anularlos. Reutiliza las server
 * actions de @/lib/pipelines/payment-actions (que a su vez usan el core de
 * pagos). La gestión fina (fechas límite, links Stripe) sigue en /reservas/[id]/pagos.
 */
import { useState, useEffect, useCallback, useTransition } from 'react'
import { Wallet, Plus, X, Check, Loader2, Pencil, Trash2, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import {
  listPaymentsForPanel,
  logManualPayment,
  setReservationTotal,
  voidReservationPayment,
} from '@/lib/pipelines/payment-actions'

type Payment = {
  id: string
  amount_cents: number
  currency: string
  type: string
  description: string | null
  status: string
  paid_at: string | null
  paid_via: string | null
  due_date: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Señal / Reserva', milestone: 'Pago intermedio', final: 'Pago final', custom: 'Otro',
}
const VIA_LABELS: Record<string, string> = {
  bank_transfer: 'Transferencia', cash: 'Efectivo', stripe: 'Stripe', other: 'Otro',
}

function money(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency || 'EUR', maximumFractionDigits: 2 }).format(cents / 100)
  } catch {
    return `${(cents / 100).toLocaleString('es-ES')} €`
  }
}

export default function ReservationPaymentsCard({
  reservationId, currency = 'EUR', totalPriceCents,
}: {
  reservationId: string
  currency?: string
  totalPriceCents: number | null
}) {
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const [total, setTotal] = useState<number | null>(totalPriceCents)
  const [pending, start] = useTransition()

  const reload = useCallback(() => {
    listPaymentsForPanel(reservationId).then((rows) => setPayments(rows as Payment[]))
  }, [reservationId])
  useEffect(() => { reload() }, [reload])

  const paidCents = (payments || []).filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount_cents, 0)
  const pendingCents = total != null ? Math.max(0, total - paidCents) : null
  const pct = total && total > 0 ? Math.min(100, Math.round((paidCents / total) * 100)) : 0

  return (
    <section className="mt-6 pt-4 border-t border-hairline">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted inline-flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5" /> Cobros
        </h3>
        <Link href={`/reservas/${reservationId}/pagos`} className="text-[11px] text-muted hover:text-ink inline-flex items-center gap-0.5">
          Plan de pagos <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Resumen: total / pagado / pendiente */}
      <div className="rounded-xl border border-hairline bg-surface-soft/40 p-3">
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <TotalEditor reservationId={reservationId} currency={currency} total={total} onSaved={setTotal} disabled={pending} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px]">
          <span className="text-emerald-700 font-semibold">Pagado {money(paidCents, currency)}</span>
          {pendingCents != null && (
            <span className={pendingCents === 0 ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
              {pendingCents === 0 ? 'Completado ✓' : `Faltan ${money(pendingCents, currency)}`}
            </span>
          )}
        </div>
        {total != null && total > 0 && (
          <div className="mt-2 h-1.5 rounded-full bg-hairline overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* Lista de pagos */}
      <div className="mt-3 space-y-1.5">
        {payments == null ? (
          <div className="flex items-center gap-2 text-[12px] text-muted py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando pagos…</div>
        ) : payments.length === 0 ? (
          <p className="text-[12px] text-muted py-1">Sin pagos registrados todavía.</p>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-hairline px-2.5 py-1.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink">{money(p.amount_cents, p.currency || currency)}</span>
                  <span className="text-[10.5px] text-muted">{TYPE_LABELS[p.type] || p.type}</span>
                  {p.status === 'paid'
                    ? <span className="text-[9.5px] font-bold uppercase rounded px-1 py-0.5 bg-emerald-50 text-emerald-700">Pagado</span>
                    : <span className="text-[9.5px] font-bold uppercase rounded px-1 py-0.5 bg-gray-100 text-gray-600">Pendiente</span>}
                </div>
                <p className="text-[11px] text-muted truncate">
                  {[p.paid_via ? VIA_LABELS[p.paid_via] || p.paid_via : null,
                    p.paid_at ? new Date(p.paid_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
                    p.description].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { if (window.confirm('¿Anular este pago?')) start(async () => { await voidReservationPayment(p.id); reload() }) }}
                disabled={pending}
                className="flex-shrink-0 text-muted hover:text-rose-600 disabled:opacity-40"
                aria-label="Anular pago"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <AddPaymentForm reservationId={reservationId} currency={currency} onAdded={reload} />
    </section>
  )
}

function TotalEditor({
  reservationId, currency, total, onSaved, disabled,
}: {
  reservationId: string; currency: string; total: number | null; onSaved: (v: number | null) => void; disabled: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(total != null ? (total / 100).toString() : '')
  const [pending, start] = useTransition()

  if (!editing) {
    return (
      <button type="button" onClick={() => { setVal(total != null ? (total / 100).toString() : ''); setEditing(true) }} disabled={disabled}
        className="inline-flex items-center gap-1.5 group">
        <span className="text-muted">Total acordado:</span>
        <span className="font-semibold text-ink">{total != null ? money(total, currency) : 'sin fijar'}</span>
        <Pencil className="w-3 h-3 text-muted group-hover:text-ink" />
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1.5 w-full">
      <span className="text-muted text-[12px]">Total:</span>
      <input type="number" step="0.01" min="0" value={val} onChange={(e) => setVal(e.target.value)} autoFocus
        className="w-24 rounded-md border border-hairline bg-canvas px-2 py-1 text-[13px] text-ink focus:outline-none focus:border-ink" placeholder="€" />
      <button type="button" disabled={pending}
        onClick={() => start(async () => {
          const cents = val.trim() === '' ? null : Math.round(parseFloat(val.replace(',', '.')) * 100)
          const r = await setReservationTotal(reservationId, cents)
          if (r.ok) { onSaved(cents); setEditing(false) }
        })}
        className="rounded-md bg-ink text-on-primary p-1 disabled:opacity-40">
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-muted hover:text-ink"><X className="w-3.5 h-3.5" /></button>
    </div>
  )
}

function AddPaymentForm({
  reservationId, currency, onAdded,
}: {
  reservationId: string; currency: string; onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('milestone')
  const [via, setVia] = useState('bank_transfer')
  const [desc, setDesc] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-hairline px-3 py-2 text-[12.5px] font-semibold text-body hover:border-ink/40 hover:text-ink transition">
        <Plus className="w-3.5 h-3.5" /> Añadir pago
      </button>
    )
  }
  return (
    <div className="mt-3 rounded-xl border border-hairline bg-surface-soft/40 p-3 space-y-2">
      <div className="flex items-stretch rounded-lg border border-hairline bg-canvas overflow-hidden">
        <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus placeholder="Importe"
          className="flex-1 min-w-0 bg-transparent px-2.5 py-2 text-[13px] text-ink focus:outline-none" />
        <span className="flex items-center px-2 text-[12px] text-muted border-l border-hairline bg-surface-soft/50">{currency === 'EUR' ? '€' : currency}</span>
      </div>
      <div className="flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="flex-1 rounded-lg border border-hairline bg-canvas px-2 py-2 text-[12.5px] text-ink focus:outline-none">
          <option value="deposit">Señal / Reserva</option>
          <option value="milestone">Pago intermedio</option>
          <option value="final">Pago final</option>
          <option value="custom">Otro</option>
        </select>
        <select value={via} onChange={(e) => setVia(e.target.value)} className="flex-1 rounded-lg border border-hairline bg-canvas px-2 py-2 text-[12.5px] text-ink focus:outline-none">
          <option value="bank_transfer">Transferencia</option>
          <option value="cash">Efectivo</option>
          <option value="stripe">Stripe</option>
          <option value="other">Otro</option>
        </select>
      </div>
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción (opcional)"
        className="w-full rounded-lg border border-hairline bg-canvas px-2.5 py-2 text-[12.5px] text-ink focus:outline-none" />
      {error && <p className="text-[11px] text-rose-700">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="button" disabled={pending || !amount}
          onClick={() => {
            setError(null)
            const cents = Math.round(parseFloat(amount.replace(',', '.')) * 100)
            start(async () => {
              const r = await logManualPayment(reservationId, cents, via as never, type as never, desc.trim() || null)
              if (r.ok) { setAmount(''); setDesc(''); setOpen(false); onAdded() }
              else setError(r.error)
            })
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-700 text-white px-3 py-1.5 text-[12px] font-semibold hover:bg-emerald-800 disabled:opacity-50">
          {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Registrar cobro
        </button>
        <button type="button" onClick={() => { setOpen(false); setError(null) }} className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-body hover:text-ink">Cancelar</button>
      </div>
    </div>
  )
}
