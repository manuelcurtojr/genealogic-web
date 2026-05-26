import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOrGetCustomer, createCheckoutSession } from '@/lib/stripe'

/**
 * POST /api/billing/checkout
 * Body: { plan: 'kennel'|'kennel_pro' (canon) o 'pro'|'premium' (legacy),
 *         interval: 'monthly'|'annual' }
 * Devuelve { url } a Stripe Checkout.
 *
 * Acepta los nombres legacy (pro/premium) y los nuevos (kennel/kennel_pro)
 * y los mapea a las env vars STRIPE_PRICE_KENNEL_* / STRIPE_PRICE_KENNEL_PRO_*
 * con fallback a las legacy STRIPE_PRICE_PRO_* / STRIPE_PRICE_PREMIUM_*.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { plan: rawPlan, interval } = body as { plan?: string; interval?: string }

  // Normalizar plan recibido al canon nuevo
  const plan =
    rawPlan === 'kennel_pro' || rawPlan === 'premium' ? 'kennel_pro' :
    rawPlan === 'kennel' || rawPlan === 'pro' || rawPlan === 'starter' ? 'kennel' :
    null

  if (!plan || (interval !== 'monthly' && interval !== 'annual')) {
    return NextResponse.json({ error: 'invalid_plan_or_interval' }, { status: 400 })
  }

  // Mapeo plan+interval → env var (preferir nuevos, fallback legacy)
  const priceMap: Record<string, string | undefined> = {
    'kennel_monthly':     process.env.STRIPE_PRICE_KENNEL_MONTHLY     || process.env.STRIPE_PRICE_PRO_MONTHLY,
    'kennel_annual':      process.env.STRIPE_PRICE_KENNEL_ANNUAL      || process.env.STRIPE_PRICE_PRO_ANNUAL,
    'kennel_pro_monthly': process.env.STRIPE_PRICE_KENNEL_PRO_MONTHLY || process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    'kennel_pro_annual':  process.env.STRIPE_PRICE_KENNEL_PRO_ANNUAL  || process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
  }
  const key = `${plan}_${interval}`
  const priceId = priceMap[key]
  if (!priceId) {
    return NextResponse.json(
      { error: `Price no configurado para ${key}. Define la env var STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}.` },
      { status: 503 },
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, display_name, stripe_customer_id')
    .eq('id', user.id)
    .single()

  try {
    const { id: customerId } = await createOrGetCustomer({
      email: profile?.email || user.email!,
      name: profile?.display_name,
      metadata: { user_id: user.id },
      existingId: profile?.stripe_customer_id || null,
    })

    if (!profile?.stripe_customer_id) {
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const origin = request.nextUrl.origin
    // 15 días de trial gratis con tarjeta requerida. Stripe maneja todo el
    // ciclo trialing → active → past_due → unpaid → canceled y nuestro
    // webhook actualiza profiles.plan en consecuencia.
    const TRIAL_DAYS = 15
    const session = await createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${origin}/cuenta/facturacion?checkout=success`,
      cancelUrl: `${origin}/pricing?cancelled=1`,
      metadata: { user_id: user.id, plan, interval },
      trialDays: TRIAL_DAYS,
    })

    return NextResponse.json({ url: session.url })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
