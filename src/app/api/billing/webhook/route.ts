import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { priceIdToPlan } from '@/lib/stripe'
import { sendTransactionalEmail } from '@/lib/email/send'
import crypto from 'crypto'

export const runtime = 'nodejs'

/**
 * POST /api/billing/webhook
 *
 * Webhook de Stripe para SUSCRIPCIONES SaaS (Pro/Premium). Eventos:
 *   - checkout.session.completed    → marcar plan + customer_id + welcome email
 *   - customer.subscription.updated → actualizar status, cambio plan
 *   - customer.subscription.deleted → bajar a free + email cancelled
 *   - invoice.paid                  → guardar en plan_invoices
 *   - invoice.payment_failed        → past_due + email aviso pago
 *
 * Idempotencia via tabla stripe_events: cada evento se intenta insertar
 * por event.id; si ya existe (Stripe reintenta), respondemos 200 sin
 * re-procesar (evita welcome 2 veces, emails duplicados, etc).
 *
 * Verificación de firma HMAC con STRIPE_WEBHOOK_SECRET.
 *
 * Notar: webhook de Connect + pagos de reservas vive en
 * /api/stripe/webhook (separado por separación de concerns + permite
 * dos endpoints distintos en dashboard de Stripe si hace falta).
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try { event = JSON.parse(raw) }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // ─── Idempotencia: insertar event.id → si ya existe, no re-procesar ───
  const { error: dupeErr } = await admin
    .from('stripe_events')
    .insert({ event_id: event.id, type: event.type })
  if (dupeErr && (dupeErr.code === '23505' || dupeErr.message?.includes('duplicate'))) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id
        if (!userId) break
        const customerId = session.customer
        const subscriptionId = session.subscription
        const plan = session.metadata?.plan === 'premium' ? 'premium' : 'pro'
        await admin.from('profiles').update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_subscription_status: 'active',
          plan,
          plan_started_at: new Date().toISOString(),
        }).eq('id', userId)

        // Email de bienvenida al plan (best-effort, dedupeado por sub_id)
        try {
          const { data: profile } = await admin
            .from('profiles')
            .select('display_name, email, billing_email')
            .eq('id', userId)
            .single()
          const toEmail = profile?.billing_email || profile?.email
          if (toEmail) {
            await sendTransactionalEmail(
              toEmail,
              {
                template: 'subscription_activated',
                props: { recipientName: profile?.display_name || null, plan: plan as 'pro' | 'premium' },
              },
              { userId, dedupeKey: `sub_activated:${subscriptionId}` },
            )
          }
        } catch (err) {
          console.error('[billing webhook] subscription_activated email failed', err)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const customerId = sub.customer
        const status = sub.status
        const priceId = sub.items?.data?.[0]?.price?.id
        const plan = priceId ? priceIdToPlan(priceId) : null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // Email de cancelación al user (best-effort)
        try {
          const { data: profile } = await admin
            .from('profiles')
            .select('id, display_name, email, billing_email')
            .eq('stripe_customer_id', customerId)
            .single()
          const toEmail = profile?.billing_email || profile?.email
          if (toEmail && profile?.id) {
            await sendTransactionalEmail(
              toEmail,
              {
                template: 'subscription_cancelled',
                props: { recipientName: profile.display_name || null },
              },
              { userId: profile.id, dedupeKey: `sub_cancelled:${sub.id}` },
            )
          }
        } catch (err) {
          console.error('[billing webhook] subscription_cancelled email failed', err)
        }
        break
      }

      case 'invoice.paid': {
        const inv = event.data.object
        const customerId = inv.customer
        const { data: profile } = await admin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()
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
            paid_at: inv.status_transitions?.paid_at
              ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
              : new Date().toISOString(),
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

        // Email de aviso pago fallido (best-effort)
        try {
          const { data: profile } = await admin
            .from('profiles')
            .select('id, display_name, email, billing_email')
            .eq('stripe_customer_id', customerId)
            .single()
          const toEmail = profile?.billing_email || profile?.email
          if (toEmail && profile?.id) {
            await sendTransactionalEmail(
              toEmail,
              {
                template: 'payment_failed',
                props: {
                  recipientName: profile.display_name || null,
                  hostedInvoiceUrl: inv.hosted_invoice_url || null,
                  amountDueCents: inv.amount_due || 0,
                  currency: (inv.currency || 'eur').toLowerCase(),
                },
              },
              { userId: profile.id, dedupeKey: `inv_failed:${inv.id}` },
            )
          }
        } catch (err) {
          console.error('[billing webhook] payment_failed email failed', err)
        }
        break
      }
    }
    return NextResponse.json({ received: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Stripe webhook handler error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
