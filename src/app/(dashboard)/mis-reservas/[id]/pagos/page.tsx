/**
 * Pagos de una reserva — lado cliente.
 * Solo lectura + acción "Pagar ahora" (si Stripe está activo en el kennel).
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getMyReservation } from '@/lib/owner/reservations'
import {
  listReservationPayments,
  formatPaymentAmount,
  PAYMENT_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/payments/payments'
import { startCheckoutAction } from './actions'
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagos · Mi reserva · Genealogic' }

export default async function MyPaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ paid?: string; cancelled?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const reservation = await getMyReservation(user.id, id)
  if (!reservation) notFound()

  // El cliente siempre ve el calendario de pagos de su reserva (FPE). El
  // botón «Pagar ahora» (Stripe) solo aparece si el kennel tiene Stripe
  // Connect activo; si no, ve los importes para pagar por transferencia.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: kennelInfo } = await admin
    .from('kennels')
    .select('stripe_account_status')
    .eq('id', reservation.kennel?.id)
    .maybeSingle()

  const stripeReady = kennelInfo?.stripe_account_status === 'active'
  const payments = await listReservationPayments(reservation.id)
  const currency = reservation.currency || 'EUR'
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount_cents, 0)
  const totalPending = payments
    .filter((p) => p.status !== 'paid' && p.status !== 'cancelled')
    .reduce((sum, p) => sum + p.amount_cents, 0)

  return (
    <div>
      <Link
        href={`/mis-reservas/${reservation.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← Mi reserva
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">Pagos</h1>
      <p className="text-sm text-body mb-6">
        Reserva con <strong>{reservation.kennel?.name}</strong>
      </p>

      {sp.paid && (
        <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 inline-flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          ✓ Pago completado. Tardamos unos segundos en reflejarlo en la lista —
          recarga la página si no aparece todavía.
        </div>
      )}
      {sp.cancelled && (
        <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          Has cancelado el pago. Puedes reintentarlo cuando quieras.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
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
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-10 text-center">
          <CreditCard className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="text-base font-semibold text-ink">Sin pagos por ahora</p>
          <p className="mt-2 text-sm text-muted max-w-md mx-auto">
            El criador aún no ha creado pagos para esta reserva. Cuando lo haga,
            aparecerán aquí con opción a pagar online (si está conectado a Stripe).
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {payments.map((p) => {
            const statusMeta = PAYMENT_STATUS_LABELS[p.status]
            const payable = ['pending', 'requested'].includes(p.status)
            return (
              <li
                key={p.id}
                className="rounded-xl border border-hairline bg-canvas p-4 flex items-start justify-between gap-3 flex-wrap"
              >
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

                {payable && stripeReady ? (
                  <form
                    action={async () => {
                      'use server'
                      await startCheckoutAction(p.id)
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-lg bg-ink text-on-primary px-4 py-2 text-xs font-semibold hover:opacity-90"
                    >
                      Pagar ahora →
                    </button>
                  </form>
                ) : payable ? (
                  <div className="text-[11px] text-muted max-w-[180px] text-right">
                    El criador aún no ha activado pagos online. Contacta para
                    pagar por transferencia.
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {!stripeReady && payments.some((p) => ['pending', 'requested'].includes(p.status)) && (
        <div className="mt-5 rounded-xl border border-hairline bg-canvas p-4 text-sm text-muted flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            El criador no tiene pagos online activos todavía. Pónte en contacto con{' '}
            <strong>{reservation.kennel?.name}</strong> para pagar por transferencia
            bancaria o el método que prefiera.
          </span>
        </div>
      )}
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
