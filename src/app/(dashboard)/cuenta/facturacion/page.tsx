import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BillingClient from '@/components/billing/billing-client'

export const metadata = { title: 'Facturación · Genealogic Pro' }

export default async function FacturacionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, stripe_subscription_id, stripe_subscription_status, billing_email, billing_name, billing_tax_id, billing_country, billing_address, billing_city, billing_postal_code, plan, plan_is_founder')
    .eq('id', user.id)
    .single()

  const { data: invoices } = await supabase
    .from('plan_invoices')
    .select('id, number, amount_cents, currency, status, description, hosted_invoice_url, pdf_url, paid_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <BillingClient
      profile={profile as any}
      invoices={invoices || []}
    />
  )
}
