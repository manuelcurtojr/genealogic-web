import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Verify caller is admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Not admin' }, { status: 403 })

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  // Get target user email
  const { data: targetProfile } = await supabase.from('profiles').select('email').eq('id', userId).single()
  if (!targetProfile?.email) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Use service role to generate magic link
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await adminSupabase.auth.admin.generateLink({
    type: 'magiclink',
    email: targetProfile.email,
    options: {
      redirectTo: `${request.nextUrl.origin}/dashboard`,
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // The link contains the token — we need to construct the proper verification URL
  const actionLink = data?.properties?.action_link
  if (!actionLink) return NextResponse.json({ error: 'Could not generate link' }, { status: 500 })

  return NextResponse.json({ url: actionLink })
}
