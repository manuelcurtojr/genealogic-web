import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getStripe, getPriceIds } from '@/lib/stripe'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan, period, withDiscount } = await request.json() // plan: 'amateur'|'pro', period: 'monthly'|'yearly'
    if (!['amateur', 'pro'].includes(plan) || !['monthly', 'yearly'].includes(period)) {
      return Response.json({ error: 'Invalid plan or period' }, { status: 400 })
    }

    const stripe = await getStripe()
    const prices = await getPriceIds()

    // Get the right price ID
    const priceKey = `${plan}${period === 'monthly' ? 'Monthly' : 'Yearly'}` as keyof typeof prices
    const priceId = prices[priceKey]
    if (!priceId) return Response.json({ error: 'Price not configured' }, { status: 500 })

    // Get or create Stripe customer
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id, email, display_name').eq('id', user.id).single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || '',
        name: profile?.display_name || '',
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    // Create checkout session
    const origin = request.headers.get('origin') || 'https://genealogic.io'

    // Check if user has ever had a subscription (no discount for returning users)
    const { data: existingSub } = await admin.from('subscriptions').select('id').eq('user_id', user.id).limit(1)
    const isFirstSubscription = !existingSub?.length

    const sessionParams: any = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?upgraded=true`,
      cancel_url: `${origin}/pricing`,
      metadata: { supabase_user_id: user.id, plan },
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan },
        trial_period_days: isFirstSubscription ? 14 : undefined, // 14-day free trial for new subscribers
      },
    }

    // Apply 50% discount on first month (only for monthly, first subscription)
    if (withDiscount && isFirstSubscription && period === 'monthly') {
      const { data: couponSetting } = await admin.from('platform_settings').select('value').eq('key', 'STRIPE_FIRST_MONTH_COUPON').single()
      const couponId = couponSetting?.value || 'APYSgodR'
      sessionParams.discounts = [{ coupon: couponId }]
      // Can't combine trial with discounts, so remove trial when using coupon
      delete sessionParams.subscription_data.trial_period_days
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return Response.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
