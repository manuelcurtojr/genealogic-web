import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe, getStripeWebhookSecret, getPlanFromPriceId, getPriceIds, getBillingPeriod } from '@/lib/stripe'
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

        // Get subscription details
        const sub = await stripe.subscriptions.retrieve(session.subscription as string) as any
        const priceId = sub.items?.data?.[0]?.price?.id || ''
        const prices = await getPriceIds()
        const billingPeriod = getBillingPeriod(priceId, prices)

        // Upsert subscription record
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: sub.id,
          plan,
          billing_period: billingPeriod,
          status: 'active',
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: false,
        }, { onConflict: 'user_id' })

        // Update user role
        await supabase.from('profiles').update({ role: plan }).eq('id', userId)

        // If upgrading to pro from amateur, migrate contacts to deals
        if (plan === 'pro') {
          await migrateContactsToDeals(supabase, userId)
        }

        // Create notification
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'info',
          title: 'Plan actualizado',
          message: `Tu plan ha sido actualizado a ${plan === 'pro' ? 'Profesional' : 'Amateur'}. ¡Disfruta de las nuevas funcionalidades!`,
          link: '/settings',
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

        // Update role
        if (subUpdated.status === 'active') {
          await supabase.from('profiles').update({ role: plan2 }).eq('id', userId2)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subDeleted = event.data.object as any
        const userId3 = subDeleted.metadata?.supabase_user_id
        if (!userId3) break

        // Downgrade to free
        await supabase.from('subscriptions').update({
          status: 'canceled',
          plan: 'free',
        }).eq('stripe_subscription_id', subDeleted.id)

        await supabase.from('profiles').update({ role: 'free' }).eq('id', userId3)

        await supabase.from('notifications').insert({
          user_id: userId3,
          type: 'info',
          title: 'Suscripción cancelada',
          message: 'Tu suscripción ha finalizado. Tu plan ha sido cambiado a Propietario (gratuito).',
          link: '/pricing',
        })

        break
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }

  return Response.json({ received: true })
}

// Migrate amateur inbox contacts to pro CRM deals
async function migrateContactsToDeals(supabase: any, userId: string) {
  // Check if user already has a pipeline
  const { data: pipelines } = await supabase
    .from('pipelines')
    .select('id, stages:pipeline_stages(id, position)')
    .eq('owner_id', userId)
    .order('created_at')
    .limit(1)

  let pipelineId: string
  let firstStageId: string

  if (pipelines?.length && pipelines[0].stages?.length) {
    pipelineId = pipelines[0].id
    const sorted = (pipelines[0].stages as any[]).sort((a: any, b: any) => a.position - b.position)
    firstStageId = sorted[0].id
  } else {
    // Create default pipeline with stages
    const { data: pipeline } = await supabase.from('pipelines').insert({
      owner_id: userId,
      name: 'Pipeline principal',
    }).select('id').single()
    if (!pipeline) return
    pipelineId = pipeline.id

    const stages = ['Nuevo contacto', 'En conversación', 'Interesado', 'Reservado', 'Vendido', 'Perdido']
    const stageInserts = stages.map((name, i) => ({
      pipeline_id: pipelineId,
      name,
      position: i,
      color: ['#3498db', '#f39c12', '#e67e22', '#9b59b6', '#27ae60', '#e74c3c'][i],
    }))

    const { data: insertedStages } = await supabase.from('pipeline_stages').insert(stageInserts).select('id, position')
    if (!insertedStages?.length) return
    firstStageId = insertedStages.sort((a: any, b: any) => a.position - b.position)[0].id
  }

  // Get contacts that don't have deals yet
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name')
    .eq('owner_id', userId)

  if (!contacts?.length) return

  // Check existing deals to avoid duplicates
  const { data: existingDeals } = await supabase
    .from('deals')
    .select('contact_id')
    .eq('owner_id', userId)

  const existingContactIds = new Set((existingDeals || []).map((d: any) => d.contact_id))

  const newDeals = contacts
    .filter((c: any) => !existingContactIds.has(c.id))
    .map((c: any) => ({
      owner_id: userId,
      title: `Solicitud de ${c.name}`,
      contact_id: c.id,
      pipeline_id: pipelineId,
      stage_id: firstStageId,
    }))

  if (newDeals.length > 0) {
    await supabase.from('deals').insert(newDeals)
  }
}
