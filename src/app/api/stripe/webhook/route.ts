/**
 * Webhook de Stripe.
 *
 * Eventos manejados:
 *  - account.updated → actualizar kennels.stripe_account_status
 *  - checkout.session.completed → marcar reservation_payment como paid
 *  - payment_intent.succeeded → idem (failsafe si llegó antes checkout)
 *
 * Configurar en dashboard.stripe.com/webhooks:
 *   URL: https://genealogic.io/api/stripe/webhook
 *   Events: account.updated, checkout.session.completed, payment_intent.succeeded
 *   Copiar Signing Secret → ENV STRIPE_WEBHOOK_SECRET
 */
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { constructWebhookEvent, isStripeConfigured } from '@/lib/stripe/server'
import { createKennelAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'  // necesita firma raw, no edge
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 500 })
  }
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'missing_signature' }, { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = constructWebhookEvent(body, signature, 'STRIPE_WEBHOOK_SECRET_CONNECT')
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'invalid_signature'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  try {
    switch (event.type) {
      case 'account.updated': {
        const acc = event.data.object as Stripe.Account
        let status: 'onboarding' | 'active' | 'restricted' = 'onboarding'
        if (acc.charges_enabled && acc.details_submitted) status = 'active'
        else if (acc.requirements?.disabled_reason) status = 'restricted'
        await admin
          .from('kennels')
          .update({ stripe_account_status: status })
          .eq('stripe_account_id', acc.id)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const paymentRowId = session.metadata?.payment_row_id
        if (paymentRowId && session.payment_status === 'paid') {
          await admin
            .from('reservation_payments')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              paid_via: 'stripe',
              stripe_payment_intent_id: session.payment_intent as string | null,
            })
            .eq('id', paymentRowId)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const paymentRowId = pi.metadata?.payment_row_id
        if (paymentRowId) {
          await admin
            .from('reservation_payments')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              paid_via: 'stripe',
              stripe_payment_intent_id: pi.id,
              stripe_charge_id: (pi.latest_charge as string) || null,
            })
            .eq('id', paymentRowId)
            .neq('status', 'paid') // idempotencia: no machacar si ya está
        }
        break
      }
    }
    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[stripe webhook]', event.type, e)
    return NextResponse.json({ error: 'handler_error' }, { status: 500 })
  }
}
