import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe, getStripeWebhookSecret, getPlanFromPriceId, getPriceIds, getBillingPeriod } from '@/lib/stripe'
import { activateSubscription, cancelSubscription } from '@/lib/subscription-helpers'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) return Response.json({ error: 'No signature' }, { status: 400 })

  const stripe = await getStripe()
  const webhookSecret = await getStripeWebhookSecret()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan as 'amateur' | 'pro'
        if (!userId || !plan) break

        const sub = await stripe.subscriptions.retrieve(session.subscription as string) as any
        const priceId = sub.items?.data?.[0]?.price?.id || ''
        const prices = await getPriceIds()
        const billingPeriod = getBillingPeriod(priceId, prices)

        await activateSubscription(supabase, {
          userId,
          plan,
          billingPeriod,
          storePlatform: 'stripe',
          currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          cancelAtPeriodEnd: false,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: sub.id,
        })

        break
      }

      case 'customer.subscription.updated': {
        const subUpdated = event.data.object as any
        const userId2 = subUpdated.metadata?.supabase_user_id
        if (!userId2) break

        const priceId2 = subUpdated.items?.data?.[0]?.price?.id || ''
        const plan2 = await getPlanFromPriceId(priceId2)
        if (!plan2) break

        const prices2 = await getPriceIds()

        await supabase.from('subscriptions').update({
          plan: plan2,
          billing_period: getBillingPeriod(priceId2, prices2),
          status: subUpdated.status === 'active' ? 'active' : subUpdated.status,
          current_period_end: subUpdated.current_period_end ? new Date(subUpdated.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: subUpdated.cancel_at_period_end || false,
        }).eq('stripe_subscription_id', subUpdated.id)

        if (subUpdated.status === 'active') {
          await supabase.from('profiles').update({ role: plan2 }).eq('id', userId2)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subDeleted = event.data.object as any
        const userId3 = subDeleted.metadata?.supabase_user_id
        if (!userId3) break

        await cancelSubscription(supabase, userId3, subDeleted.id)
        break
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }

  return Response.json({ received: true })
}
