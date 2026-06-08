/**
 * Server actions de Stripe Connect del criador (configuración del kennel).
 */
'use server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  ensureConnectAccount,
  createAccountLink,
  getAccountStatus,
  isStripeConfigured,
} from '@/lib/stripe/server'

export async function startStripeOnboardingAction(): Promise<void> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe no está configurado en el servidor (falta STRIPE_SECRET_KEY)')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: kennel } = await admin
    .from('kennels')
    .select('id, name, country, stripe_account_id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!kennel) throw new Error('kennel_not_found')

  const accountId = await ensureConnectAccount({
    kennelEmail: user.email || 'criador@genealogic.io',
    kennelName: kennel.name,
    country: kennel.country || 'ES',
    existingAccountId: kennel.stripe_account_id,
  })

  if (accountId !== kennel.stripe_account_id) {
    await admin
      .from('kennels')
      .update({ stripe_account_id: accountId, stripe_account_status: 'onboarding' })
      .eq('id', kennel.id)
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.genealogic.io'
  const url = await createAccountLink({
    accountId,
    returnUrl: `${origin}/kennel/pagos?refresh=1`,
    refreshUrl: `${origin}/kennel/pagos?refresh=1`,
  })
  redirect(url)
}

export async function syncStripeStatusAction(): Promise<void> {
  if (!isStripeConfigured()) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: kennel } = await admin
    .from('kennels')
    .select('id, stripe_account_id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!kennel?.stripe_account_id) return

  const status = await getAccountStatus(kennel.stripe_account_id)
  await admin
    .from('kennels')
    .update({ stripe_account_status: status })
    .eq('id', kennel.id)
  revalidatePath('/kennel/pagos')
}
