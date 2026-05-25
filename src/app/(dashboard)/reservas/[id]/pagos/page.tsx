/**
 * Pagos de una reserva — lado criador.
 *
 *  - Lista de pagos con estado y acciones
 *  - Form "Crear pago" (importe, tipo, descripción, fecha límite)
 *  - Acciones por pago: marcar pagado manualmente / cancelar
 *  - Si el kennel no tiene Stripe conectado, aviso para conectarlo en /kennel/pagos
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  listReservationPayments,
  formatPaymentAmount,
  PAYMENT_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/payments/payments'
import {
  createPaymentAction,
  markPaidManuallyAction,
  cancelPaymentAction,
} from './actions'
import { CreditCard, Plus, AlertCircle } from 'lucide-react'
import { isEarlyAccessKennel } from '@/lib/early-access'
import ComingSoon from '@/components/early-access/coming-soon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagos · Reserva · Genealogic' }

export default async function BreederPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: reservation } = await admin
    .from('puppy_reservations')
    .select(
      `id, applicant_name, currency, total_price_cents,
       kennel:kennels(id, name, owner_id, stripe_account_id, stripe_account_status)`,
    )
    .eq('id', id)
    .maybeSingle()
  if (!reservation) notFound()
  if (reservation.kennel?.owner_id !== user.id) redirect('/reservas')

  // Gate Early Access: pagos solo activos para el kennel del fundador
  if (!isEarlyAccessKennel(reservation.kennel?.id)) {
    return <ComingSoon featureId="stripe_payments" backHref={`/reservas/${reservation.id}`} backLabel="← Volver a la reserva" />
  }

  const payments = await listReservationPayments(reservation.id)
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount_cents, 0)
  const totalPending = payments
    .filter((p) => p.status !== 'paid' && p.status !== 'cancelled')
    .reduce((sum, p) => sum + p.amount_cents, 0)
  const currency = reservation.currency || 'EUR'
  const stripeReady = reservation.kennel?.stripe_account_status === 'active'

  return (
    <div>
      <Link
        href={`/reservas/${reservation.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← {reservation.applicant_name}
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">Pagos</h1>
      <p className="text-sm text-body mb-6">
        Gestiona los pagos de esta reserva. El cliente verá la lista y, si Stripe está
        conectado, podrá pagar online.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat
          label="Pagado"
          value={formatPaymentAmount(totalPaid, currency)}
          color="text-emerald-700"
        />
        <Stat
          label="Pendiente"
          value={formatPaymentAmount(totalPending, currency)}
          color="text-amber-700"
        />
        <Stat
          label="Total reserva"
          value={
            reservation.total_price_cents != null
              ? formatPaymentAmount(reservation.total_price_cents, currency)
              : '—'
          }
        />
      </div>

      {!stripeReady && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Stripe no está conectado</p>
            <p className="text-amber-800 mt-0.5">
              Sin Stripe, puedes crear pagos y marcarlos como pagados manualmente
              (transferencia, efectivo). Para cobrar online,{' '}
              <Link href="/kennel/pagos" className="underline font-semibold">
                conecta Stripe Connect →
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Lista pagos */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink mb-3">
            Lista de pagos ({payments.length})
          </h2>
          {payments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hairline bg-canvas p-8 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-muted mb-2" />
              <p className="text-sm text-muted">
                Aún no hay pagos. Crea el primero en el panel derecho.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {payments.map((p) => {
                const statusMeta = PAYMENT_STATUS_LABELS[p.status]
                return (
                  <li
                    key={p.id}
                    className="rounded-xl border border-hairline bg-canvas p-4"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-bold text-ink tabular-nums">
                            {formatPaymentAmount(p.amount_cents, p.currency)}
                          </p>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                            {PAYMENT_TYPE_LABELS[p.type]}
                          </span>
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusMeta.color}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                        {p.description && (
                          <p className="mt-1 text-sm text-body">{p.description}</p>
                        )}
                        <p className="mt-1 text-[11px] text-muted">
                          {p.due_date && (
                            <>Vence {new Date(p.due_date).toLocaleDateString('es-ES')} · </>
                          )}
                          {p.paid_at && (
                            <>
                              Pagado{' '}
                              {new Date(p.paid_at).toLocaleDateString('es-ES')}
                              {p.paid_via && ` (${p.paid_via})`}
                            </>
                          )}
                        </p>
                      </div>

                      {p.status === 'pending' || p.status === 'requested' ? (
                        <div className="flex gap-1">
                          <form action={markPaidManuallyAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <select
                              name="paid_via"
                              defaultValue="bank_transfer"
                              className="text-[11px] rounded-md border border-hairline bg-surface-card px-2 py-1 text-body"
                            >
                              <option value="bank_transfer">Transferencia</option>
                              <option value="cash">Efectivo</option>
                              <option value="stripe">Stripe (manual)</option>
                              <option value="other">Otro</option>
                            </select>
                            <button
                              type="submit"
                              className="ml-1 rounded-md bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-semibold hover:opacity-90"
                            >
                              Marcar pagado
                            </button>
                          </form>
                          <form action={cancelPaymentAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-hairline bg-canvas px-2 py-1 text-[11px] text-muted hover:text-red-600 hover:border-red-300"
                            >
                              Cancelar
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Form crear pago */}
        <aside>
          <CreatePaymentForm reservationId={reservation.id} currency={currency} />
        </aside>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  color = 'text-ink',
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

function CreatePaymentForm({
  reservationId,
  currency,
}: {
  reservationId: string
  currency: string
}) {
  return (
    <form
      action={async (fd) => {
        'use server'
        await createPaymentAction(reservationId, fd)
      }}
      className="rounded-2xl border border-hairline bg-canvas p-5"
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-ink mb-4 inline-flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Nuevo pago
      </h3>
      <div className="space-y-3">
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
            Importe ({currency})
          </span>
          <input
            type="text"
            name="amount"
            required
            placeholder="500.00"
            inputMode="decimal"
            className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
            Tipo
          </span>
          <select
            name="type"
            defaultValue="milestone"
            className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
          >
            <option value="deposit">Señal / Reserva</option>
            <option value="milestone">Pago intermedio</option>
            <option value="final">Pago final</option>
            <option value="custom">Otro</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
            Descripción
          </span>
          <input
            type="text"
            name="description"
            placeholder="Ej: Señal por reserva del cachorro"
            className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
            Fecha límite (opcional)
          </span>
          <input
            type="date"
            name="due_date"
            className="w-full rounded-lg border border-hairline bg-surface-card px-3 py-2 text-sm text-ink"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90"
        >
          Crear pago
        </button>
      </div>
    </form>
  )
}
