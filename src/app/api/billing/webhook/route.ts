import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { priceIdToPlan } from '@/lib/stripe'
import crypto from 'crypto'

export const runtime = 'nodejs'

/**
 * POST /api/billing/webhook
 *
 * Webhook de Stripe. Eventos manejados:
 *   - checkout.session.completed       → marcar plan + stripe_subscription_id
 *   - customer.subscription.updated    → status (active/past_due/canceled)
 *   - customer.subscription.deleted    → bajar a free
 *   - invoice.paid                     → guardar en plan_invoices
 *   - invoice.payment_failed           → marcar status past_due
 *
 * Verificación de firma HMAC con STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET no configurado' }, { status: 503 })
  }

  const sigHeader = request.headers.get('stripe-signature') || ''
  const raw = await request.text()

  // Verificar firma (formato Stripe: "t=timestamp,v1=signature")
  let valid = false
  try {
    const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=').map(s => s.trim())))
    const timestamp = parts.t
    const signature = parts.v1
    if (timestamp && signature) {
      const payload = `${timestamp}.${raw}`
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
      valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    }
  } catch { /* invalid */ }

  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try { event = JSON.parse(raw) }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id
        if (!userId) break
        const customerId = session.customer
        const subscriptionId = session.subscription
        // Pedir el plan al objeto subscription (no viene en session)
        const plan = session.metadata?.plan === 'premium' ? 'premium' : 'pro'
        await admin.from('profiles').update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_subscription_status: 'active',
          plan, plan_started_at: new Date().toISOString(),
        }).eq('id', userId)
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const customerId = sub.customer
        const status = sub.status
        const priceId = sub.items?.data?.[0]?.price?.id
        const plan = priceId ? priceIdToPlan(priceId) : null
        const updates: any = { stripe_subscription_status: status }
        if (status === 'active' && plan) updates.plan = plan
        if (sub.cancel_at_period_end) {
          updates.plan_expires_at = new Date(sub.current_period_end * 1000).toISOString()
        }
        await admin.from('profiles').update(updates).eq('stripe_customer_id', customerId)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const customerId = sub.customer
        await admin.from('profiles').update({
          plan: 'free',
          stripe_subscription_status: 'canceled',
          plan_expires_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)
        break
      }
      case 'invoice.paid': {
        const inv = event.data.object
        const customerId = inv.customer
        const { data: profile } = await admin.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
        if (profile?.id) {
          await admin.from('plan_invoices').upsert({
            user_id: profile.id,
            stripe_invoice_id: inv.id,
            stripe_payment_intent_id: inv.payment_intent || null,
            number: inv.number || null,
            amount_cents: inv.amount_paid || inv.amount_due || 0,
            currency: (inv.currency || 'eur').toUpperCase(),
            status: 'paid',
            description: inv.description || (inv.lines?.data?.[0]?.description) || null,
            hosted_invoice_url: inv.hosted_invoice_url || null,
            pdf_url: inv.invoice_pdf || null,
            paid_at: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : new Date().toISOString(),
          }, { onConflict: 'stripe_invoice_id' })
        }
        break
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object
        const customerId = inv.customer
        await admin.from('profiles').update({
          stripe_subscription_status: 'past_due',
        }).eq('stripe_customer_id', customerId)
        break
      }
    }
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Stripe webhook handler error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
