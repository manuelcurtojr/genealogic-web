import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Lazy-initialized Stripe instance (uses key from platform_settings)
let stripeInstance: Stripe | null = null

export async function getStripe(): Promise<Stripe> {
  if (stripeInstance) return stripeInstance

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'STRIPE_SECRET_KEY')
    .single()

  if (!data?.value) throw new Error('Stripe secret key not configured')

  stripeInstance = new Stripe(data.value)
  return stripeInstance
}

export async function getStripeWebhookSecret(): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'STRIPE_WEBHOOK_SECRET')
    .single()

  return data?.value || ''
}

// Price IDs mapping — stored as env vars or platform_settings
export interface PriceConfig {
  amateurMonthly: string
  amateurYearly: string
  proMonthly: string
  proYearly: string
}

export async function getPriceIds(): Promise<PriceConfig> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', [
      'STRIPE_AMATEUR_MONTHLY_PRICE_ID',
      'STRIPE_AMATEUR_YEARLY_PRICE_ID',
      'STRIPE_PRO_MONTHLY_PRICE_ID',
      'STRIPE_PRO_YEARLY_PRICE_ID',
    ])

  const map = Object.fromEntries((data || []).map(d => [d.key, d.value]))

  return {
    amateurMonthly: map.STRIPE_AMATEUR_MONTHLY_PRICE_ID || '',
    amateurYearly: map.STRIPE_AMATEUR_YEARLY_PRICE_ID || '',
    proMonthly: map.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    proYearly: map.STRIPE_PRO_YEARLY_PRICE_ID || '',
  }
}

// Map Stripe price ID → plan name
export async function getPlanFromPriceId(priceId: string): Promise<'amateur' | 'pro' | null> {
  const prices = await getPriceIds()
  if (priceId === prices.amateurMonthly || priceId === prices.amateurYearly) return 'amateur'
  if (priceId === prices.proMonthly || priceId === prices.proYearly) return 'pro'
  return null
}

export function getBillingPeriod(priceId: string, prices: PriceConfig): 'monthly' | 'yearly' {
  if (priceId === prices.amateurYearly || priceId === prices.proYearly) return 'yearly'
  return 'monthly'
}
