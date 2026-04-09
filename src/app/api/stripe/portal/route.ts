import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).single()

    if (!profile?.stripe_customer_id) {
      return Response.json({ error: 'No subscription found' }, { status: 400 })
    }

    const stripe = await getStripe()
    const origin = request.headers.get('origin') || 'https://genealogic.io'

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings`,
    })

    return Response.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe portal error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
