import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BillingClient from '@/components/billing/billing-client'
import EmailbotUsageSection, {
  type UsageRow,
  type ScopeBreakdown,
} from '@/components/billing/emailbot-usage-section'
import { checkBotReplyQuota } from '@/lib/ai/quotas'
import { isSubscriptionCheckoutAvailable } from '@/lib/stripe/server'
import FeedbackButton from '@/components/feedback/feedback-button'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Facturación · Genealogic Pro' }

export default async function FacturacionPage() {
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

  // Datos del Emailbot (uso del mes + historial). Solo aplica a kennels.
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  // Stripe ya está configurado en producción — sin gate Early Access.
  const stripeReady = isSubscriptionCheckoutAvailable()

  let usageBlock: React.ReactNode = null
  if (kennel) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const [quota, monthRows, recentRows] = await Promise.all([
      checkBotReplyQuota({ kennelId: kennel.id, ownerId: user.id }),
      admin
        .from('ai_usage_logs')
        .select('scope, total_tokens, estimated_cost_usd, status')
        .eq('kennel_id', kennel.id)
        .gte('created_at', monthStart),
      admin
        .from('ai_usage_logs')
        .select('id, scope, provider, model, input_tokens, output_tokens, total_tokens, estimated_cost_usd, status, error_message, created_at')
        .eq('kennel_id', kennel.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    // Agregado por scope para el breakdown
    const breakdown: ScopeBreakdown = {
      bot_replies_count: 0, bot_replies_cost_usd: 0,
      test_count: 0, test_cost_usd: 0,
      import_url_count: 0, import_url_cost_usd: 0,
      import_file_count: 0, import_file_cost_usd: 0,
      total_cost_usd: 0, total_tokens: 0,
    }
    for (const r of (monthRows.data || []) as Array<{
      scope: string; total_tokens: number; estimated_cost_usd: number; status: string
    }>) {
      if (r.status !== 'success') continue
      breakdown.total_cost_usd += Number(r.estimated_cost_usd) || 0
      breakdown.total_tokens += Number(r.total_tokens) || 0
      switch (r.scope) {
        case 'emailbot_reply':
          breakdown.bot_replies_count++
          breakdown.bot_replies_cost_usd += Number(r.estimated_cost_usd) || 0
          break
        case 'emailbot_test':
          breakdown.test_count++
          breakdown.test_cost_usd += Number(r.estimated_cost_usd) || 0
          break
        case 'knowledge_import_url':
          breakdown.import_url_count++
          breakdown.import_url_cost_usd += Number(r.estimated_cost_usd) || 0
          break
        case 'knowledge_import_file':
          breakdown.import_file_count++
          breakdown.import_file_cost_usd += Number(r.estimated_cost_usd) || 0
          break
      }
    }

    usageBlock = (
      <EmailbotUsageSection
        quota={quota}
        breakdown={breakdown}
        recentRows={(recentRows.data || []) as UsageRow[]}
      />
    )
  }

  return (
    <div className="space-y-6">
      {usageBlock}
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
