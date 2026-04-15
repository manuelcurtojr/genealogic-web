// Shared subscription helpers — used by both Stripe and Apple IAP webhooks
import { SupabaseClient } from '@supabase/supabase-js'

type StorePlatform = 'stripe' | 'apple'

interface ActivateParams {
  userId: string
  plan: 'amateur' | 'pro'
  billingPeriod: 'monthly' | 'yearly'
  storePlatform: StorePlatform
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
  // Stripe-specific
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  // Apple-specific
  appleOriginalTransactionId?: string
  appleTransactionId?: string
}

export async function activateSubscription(supabase: SupabaseClient, params: ActivateParams) {
  const {
    userId, plan, billingPeriod, storePlatform,
    currentPeriodEnd, cancelAtPeriodEnd,
    stripeCustomerId, stripeSubscriptionId,
    appleOriginalTransactionId, appleTransactionId,
  } = params

  // Upsert subscription record
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    store_platform: storePlatform,
    plan,
    billing_period: billingPeriod,
    status: 'active',
    current_period_end: currentPeriodEnd || null,
    cancel_at_period_end: cancelAtPeriodEnd || false,
    ...(stripeCustomerId && { stripe_customer_id: stripeCustomerId }),
    ...(stripeSubscriptionId && { stripe_subscription_id: stripeSubscriptionId }),
    ...(appleOriginalTransactionId && { apple_original_transaction_id: appleOriginalTransactionId }),
    ...(appleTransactionId && { apple_transaction_id: appleTransactionId }),
  }, { onConflict: 'user_id' })

  // Update user role
  await supabase.from('profiles').update({ role: plan }).eq('id', userId)

  // If upgrading to pro, migrate contacts to deals
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
}

export async function cancelSubscription(supabase: SupabaseClient, userId: string, subscriptionRef?: string) {
  // Update subscription status
  if (subscriptionRef) {
    // Try both Stripe and Apple identifiers
    await supabase.from('subscriptions').update({
      status: 'canceled',
      plan: 'free',
    }).or(`stripe_subscription_id.eq.${subscriptionRef},apple_original_transaction_id.eq.${subscriptionRef}`)
  } else {
    await supabase.from('subscriptions').update({
      status: 'canceled',
      plan: 'free',
    }).eq('user_id', userId)
  }

  // Downgrade to free
  await supabase.from('profiles').update({ role: 'free' }).eq('id', userId)

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'info',
    title: 'Suscripción cancelada',
    message: 'Tu suscripción ha finalizado. Tu plan ha sido cambiado a Propietario (gratuito).',
    link: '/pricing',
  })
}

// Migrate amateur inbox contacts to pro CRM deals
export async function migrateContactsToDeals(supabase: SupabaseClient, userId: string) {
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

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name')
    .eq('owner_id', userId)

  if (!contacts?.length) return

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

// Apple product ID to plan mapping
const APPLE_PRODUCT_MAP: Record<string, { plan: 'amateur' | 'pro'; billingPeriod: 'monthly' | 'yearly' }> = {
  'com.genealogic.app.amateur.monthly': { plan: 'amateur', billingPeriod: 'monthly' },
  'com.genealogic.app.amateur.yearly': { plan: 'amateur', billingPeriod: 'yearly' },
  'com.genealogic.app.pro.monthly': { plan: 'pro', billingPeriod: 'monthly' },
  'com.genealogic.app.pro.yearly': { plan: 'pro', billingPeriod: 'yearly' },
}

export function getApplePlan(productId: string) {
  return APPLE_PRODUCT_MAP[productId] || null
}
