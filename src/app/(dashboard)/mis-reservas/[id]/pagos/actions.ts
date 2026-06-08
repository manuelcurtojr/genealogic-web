/**
 * Server action: cliente inicia Checkout para pagar un payment.
 * Requisitos:
 *  - El cliente debe ser el client_user_id de la reserva
 *  - El payment debe estar en pending o requested
 *  - El kennel del payment debe tener stripe_account_status = 'active'
 * Si todo OK, crea Checkout Session y devuelve URL para redirigir.
 */
'use server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  createPaymentCheckoutSession,
  isStripeConfigured,
} from '@/lib/stripe/server'
import { setStripeCheckoutSession } from '@/lib/payments/payments'

export async function startCheckoutAction(paymentId: string): Promise<void> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe no está configurado')
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: payment } = await admin
    .from('reservation_payments')
    .select(
      `id, amount_cents, currency, description, status, reservation_id,
       reservation:puppy_reservations(id, client_user_id, applicant_email,
         kennel:kennels(id, name, stripe_account_id, stripe_account_status))`,
    )
    .eq('id', paymentId)
    .maybeSingle()
  if (!payment) throw new Error('payment_not_found')
  if (payment.reservation?.client_user_id !== user.id) throw new Error('forbidden')
  if (!['pending', 'requested'].includes(payment.status)) {
    throw new Error('payment_not_payable')
  }
  const kennel = payment.reservation.kennel
  if (!kennel?.stripe_account_id || kennel.stripe_account_status !== 'active') {
    throw new Error('kennel_stripe_not_active')
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.genealogic.io'
  const { url, sessionId } = await createPaymentCheckoutSession({
    kennelStripeAccountId: kennel.stripe_account_id,
    amountCents: payment.amount_cents,
    currency: payment.currency || 'EUR',
    description:
      payment.description || `Pago para reserva en ${kennel.name}`,
    customerEmail: user.email || payment.reservation.applicant_email || '',
    successUrl: `${origin}/mis-reservas/${payment.reservation_id}/pagos?paid=1`,
    cancelUrl: `${origin}/mis-reservas/${payment.reservation_id}/pagos?cancelled=1`,
    reservationId: payment.reservation_id,
    paymentRowId: payment.id,
  })

  await setStripeCheckoutSession({ paymentId: payment.id, sessionId })
  redirect(url)
}
