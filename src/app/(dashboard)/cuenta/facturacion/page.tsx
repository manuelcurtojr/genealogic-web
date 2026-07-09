import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { isIosUserAgent } from '@/lib/platform'
import BillingClient from '@/components/billing/billing-client'
import { isSubscriptionCheckoutAvailable } from '@/lib/stripe/server'
import FeedbackButton from '@/components/feedback/feedback-button'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Facturación · Genealogic Pro' }

export default async function FacturacionPage() {
  // App Store 3.1.1 — facturación nunca accesible desde el WebView iOS.
  const h = await headers()
  if (isIosUserAgent(h.get('user-agent'))) redirect('/dashboard')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Datos de billing tradicionales
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, stripe_subscription_id, stripe_subscription_status, billing_email, billing_name, billing_tax_id, billing_country, billing_address, billing_city, billing_postal_code, plan, plan_is_founder, trial_started_at, trial_ends_at')
    .eq('id', user.id)
    .single()

  const { data: invoices } = await supabase
    .from('plan_invoices')
    .select('id, number, amount_cents, currency, status, description, hosted_invoice_url, pdf_url, paid_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  // Stripe ya está configurado en producción — sin gate Early Access.
  const stripeReady = isSubscriptionCheckoutAvailable()

  return (
    <div className="space-y-6">
      <BillingClient
        profile={profile as any}
        invoices={invoices || []}
        stripeReady={stripeReady}
        hasKennel={!!kennel}
      />
      <FeedbackButton scope="billing" pageLabel="Facturación / Pagos (/cuenta/facturacion)" />
    </div>
  )
}
