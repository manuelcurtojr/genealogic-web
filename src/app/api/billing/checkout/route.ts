import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOrGetCustomer, createCheckoutSession } from '@/lib/stripe'

/**
 * POST /api/billing/checkout
 * Body: { plan: 'pro'|'premium', interval: 'monthly'|'annual' }
 * Devuelve { url } a Stripe Checkout.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { plan, interval } = body

  const priceMap: Record<string, string | undefined> = {
    'pro_monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
    'pro_annual': process.env.STRIPE_PRICE_PRO_ANNUAL,
    'premium_monthly': process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    'premium_annual': process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
  }
  const key = `${plan}_${interval}`
  const priceId = priceMap[key]
  if (!priceId) {
    return NextResponse.json({ error: `Price no configurado para ${key}. Define la env var correspondiente.` }, { status: 400 })
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
    const session = await createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${origin}/cuenta/suscripcion?checkout=success`,
      cancelUrl: `${origin}/cuenta/suscripcion?checkout=cancelled`,
      metadata: { user_id: user.id, plan, interval },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
