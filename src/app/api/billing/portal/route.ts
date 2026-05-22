import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBillingPortalSession, createOrGetCustomer } from '@/lib/stripe'

/**
 * POST /api/billing/portal
 * Devuelve { url } al Stripe Billing Portal del cliente actual.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, display_name, stripe_customer_id')
    .eq('id', user.id)
    .single()

  try {
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      // Crear cliente sobre la marcha si nunca ha pasado por checkout
      const c = await createOrGetCustomer({
        email: profile?.email || user.email!,
        name: profile?.display_name,
        metadata: { user_id: user.id },
      })
      customerId = c.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const origin = request.nextUrl.origin
    const { url } = await createBillingPortalSession({
      customerId,
      returnUrl: `${origin}/cuenta/suscripcion`,
    })

    return NextResponse.json({ url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
