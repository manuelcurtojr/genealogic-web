import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { priceIdToPlan } from '@/lib/stripe'
import { sendTransactionalEmail } from '@/lib/email/send'
import { notifySuperAdmin } from '@/lib/admin/notify'
import crypto from 'crypto'

export const runtime = 'nodejs'

/**
 * POST /api/billing/webhook
 *
 * Webhook de Stripe para SUSCRIPCIONES SaaS (Kennel Pro 49€). Kennel
 * Enterprise (149€) NO pasa por aquí — su alta es manual.
 *
 * Modelo: trial de 14 días SIN tarjeta inicial. El usuario obtiene acceso
 * completo desde el momento del checkout (status='trialing'). Antes del
 * día 14 le mandamos emails pidiendo método de pago. Si al día 14 NO hay
 * método configurado: `trial_settings.missing_payment_method='cancel'`
 * → sub cancelada → webhook baja plan a free. Si SÍ hay método pero el
 * cobro falla: Smart Retries reintentan ~3 semanas (past_due → unpaid →
 * canceled).
 *
 * Estados de Stripe → plan en nuestra DB:
 *   trialing  → plan = kennel (Kennel Pro, acceso completo)
 *   active    → plan = kennel (Kennel Pro, acceso completo)
 *   past_due  → mantenemos el plan + bandera de "pago pendiente"
 *   unpaid    → bajamos a free
 *   canceled  → bajamos a free
 *
 * NOTA: el rol técnico `kennel` representa al Kennel Pro nuevo (49€).
 * El rol `kennel_pro` representa al Kennel Enterprise (149€, manual).
 *
 * Eventos manejados:
 *   - checkout.session.completed       → set customer/sub ids, trial_*_at
 *   - customer.subscription.created    → set plan + trial dates (cubre el caso
 *                                        en que checkout.session llega después)
 *   - customer.subscription.updated    → status, cambio de plan, fin de trial
 *   - customer.subscription.trial_will_end → email "tu trial acaba en 3 días"
 *   - customer.subscription.deleted    → bajar a free + email cancelled
 *   - invoice.paid                     → guardar en plan_invoices
 *   - invoice.payment_failed           → status past_due + email aviso pago
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

  // ─── Helpers ──────────────────────────────────────────────────────────
  /** Normaliza el "plan canónico" desde un objeto de Stripe subscription. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planFromSub = (sub: any): 'kennel' | 'kennel_pro' | null => {
    const priceId = sub?.items?.data?.[0]?.price?.id
    if (!priceId) return null
    return priceIdToPlan(priceId)
  }

  /** Stripe → ISO date (sub.trial_end / current_period_end vienen en epoch s). */
  const epochToIso = (epoch: number | null | undefined): string | null =>
    epoch ? new Date(epoch * 1000).toISOString() : null

  /** Estados que conceden acceso al producto pagado. */
  const isAccessGrantingStatus = (status: string): boolean =>
    status === 'active' || status === 'trialing' || status === 'past_due'

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id
        if (!userId) break
        const customerId = session.customer
        const subscriptionId = session.subscription

        // El status real (trialing vs active) viene en el subscription object.
        // En checkout.session.completed solo tenemos los ids — pedimos la sub
        // a Stripe para conocer trial_end, current_period_end, etc.
        let sub: any = null
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const r: any = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
            headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
          })
          sub = await r.json()
        } catch { /* fallback abajo */ }

        const status = sub?.status || 'trialing'
        const plan = (sub && planFromSub(sub))
          || (session.metadata?.plan === 'kennel_pro' || session.metadata?.plan === 'premium' ? 'kennel_pro' : 'kennel')

        const trialStart = epochToIso(sub?.trial_start)
        const trialEnd = epochToIso(sub?.trial_end)

        await admin.from('profiles').update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_subscription_status: status,
          plan,
          plan_started_at: new Date().toISOString(),
          // first_paid_at: solo se rellena la primera vez (first-touch wins),
          // se usa para el funnel detallado en Sprint C.
          first_paid_at: new Date().toISOString(),
          trial_started_at: trialStart,
          trial_ends_at: trialEnd,
        }).eq('id', userId).is('first_paid_at', null)

        // En caso de second-charge o repeat: actualizamos sin first_paid_at
        await admin.from('profiles').update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_subscription_status: status,
          plan,
          plan_started_at: new Date().toISOString(),
          trial_started_at: trialStart,
          trial_ends_at: trialEnd,
        }).eq('id', userId).not('first_paid_at', 'is', null)

        // Notif al super admin: usuario activó plan de pago.
        // Crítico para enterarse de upgrades en tiempo real.
        notifySuperAdmin({
          kind: 'plan_upgrade',
          subject: `Nuevo plan activo: ${plan}`,
          body: `User ID: ${userId}\nPlan: ${plan}\nStatus: ${status}\nTrial: ${trialStart ? `desde ${trialStart} hasta ${trialEnd}` : 'sin trial'}\nSubscription: ${subscriptionId}`,
          dedupeKey: `billing:upgrade:${subscriptionId}`,
          ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://genealogic.io'}/admin/users/${userId}`,
          ctaLabel: 'Ver usuario',
        }).catch(() => {})

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
                props: {
                  recipientName: profile?.display_name || null,
                  // El template acepta los nombres canónicos + legacy
                  plan: plan as 'kennel' | 'kennel_pro',
                  trialEndsAt: trialEnd,
                },
              },
              { userId, dedupeKey: `sub_activated:${subscriptionId}` },
            )
          }
        } catch (err) {
          console.error('[billing webhook] subscription_activated email failed', err)
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object
        const customerId = sub.customer
        const status = sub.status as string
        const plan = planFromSub(sub)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = {
          stripe_subscription_status: status,
          trial_started_at: epochToIso(sub.trial_start),
          trial_ends_at: epochToIso(sub.trial_end),
        }

        if (isAccessGrantingStatus(status) && plan) {
          // trialing / active / past_due → conceden acceso al plan
          updates.plan = plan
        } else if (status === 'unpaid' || status === 'canceled' || status === 'incomplete_expired') {
          // Dunning agotado → degradar a free. Los datos del usuario se
          // conservan, solo se pierde el acceso a features de pago.
          updates.plan = 'free'
          updates.plan_expires_at = new Date().toISOString()
        }

        if (sub.cancel_at_period_end) {
          updates.plan_expires_at = epochToIso(sub.current_period_end)
        }

        await admin.from('profiles').update(updates).eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.trial_will_end': {
        // Fires ~3 días antes del fin de trial. Mandamos email recordatorio.
        const sub = event.data.object
        const customerId = sub.customer
        try {
          const { data: profile } = await admin
            .from('profiles')
            .select('id, display_name, email, billing_email, plan')
            .eq('stripe_customer_id', customerId)
            .single()
          const toEmail = profile?.billing_email || profile?.email
          if (toEmail && profile?.id) {
            await sendTransactionalEmail(
              toEmail,
              {
                template: 'trial_ending_soon',
                props: {
                  recipientName: profile.display_name || null,
                  plan: profile.plan as 'kennel' | 'kennel_pro',
                  trialEndsAt: epochToIso(sub.trial_end),
                },
              },
              { userId: profile.id, dedupeKey: `trial_ending:${sub.id}` },
            )
          }
        } catch (err) {
          console.error('[billing webhook] trial_ending_soon email failed', err)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const customerId = sub.customer
        await admin.from('profiles').update({
          plan: 'free',
          stripe_subscription_status: 'canceled',
          plan_expires_at: new Date().toISOString(),
          // Limpiamos trial dates para que la UI no muestre "trial activo"
          // residual cuando ya bajaron a free.
          trial_started_at: null,
          trial_ends_at: null,
        }).eq('stripe_customer_id', customerId)

        // Notif al super admin: churn. Crítico para análisis de retención.
        const { data: churnedProfile } = await admin
          .from('profiles')
          .select('id, email, display_name, plan')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()
        if (churnedProfile?.id) {
          notifySuperAdmin({
            kind: 'plan_downgrade',
            subject: `Churn: ${churnedProfile.email}`,
            body: `User canceló su plan.\nEmail: ${churnedProfile.email}\nNombre: ${churnedProfile.display_name || '—'}\nPlan anterior: ${churnedProfile.plan || '?'}\nSubscription: ${sub.id}\n\nConsidera escribirle un email personal para entender el motivo.`,
            dedupeKey: `billing:churn:${sub.id}`,
            ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://genealogic.io'}/admin/users/${churnedProfile.id}`,
            ctaLabel: 'Ver usuario',
          }).catch(() => {})
        }

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
