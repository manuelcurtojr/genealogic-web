import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { logAdminAction } from '@/lib/admin/audit-log'
import { notifySuperAdmin } from '@/lib/admin/notify'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Not admin' }, { status: 403 })

  // Rate limit: max 20 impersonates por admin por hora. Suficiente para
  // soporte legítimo, frena abuso si una sesión admin se compromete.
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(`impersonate:${user.id}`, { tokens: 20, windowMs: 60 * 60_000 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: rateLimitHeaders(rl, 20) },
    )
  }

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { data: targetProfile } = await supabase.from('profiles').select('email').eq('id', userId).single()
  if (!targetProfile?.email) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const origin = request.nextUrl.origin

  const { data, error } = await adminSupabase.auth.admin.generateLink({
    type: 'magiclink',
    email: targetProfile.email,
    options: {
      redirectTo: `${origin}/dashboard`,
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log + alerta al super admin (admin → admin: por si hay otro admin
  // y queremos saber quién impersonó a quién).
  await logAdminAction({
    adminId: user.id,
    action: 'impersonate',
    targetTable: 'profiles',
    targetId: userId,
    payload: { target_email: targetProfile.email },
    ip,
    userAgent: request.headers.get('user-agent'),
  })
  notifySuperAdmin({
    kind: 'system_alert',
    subject: `Admin impersonate`,
    body: `Admin ${user.email} impersonó al usuario ${targetProfile.email} (id: ${userId}).\nIP: ${ip}`,
    dedupeKey: `audit:impersonate:${user.id}:${userId}:${Date.now()}`,
  }).catch(() => {})

  // generateLink returns properties.hashed_token and properties.action_link
  const hashedToken = data?.properties?.hashed_token
  if (hashedToken) {
    // Use our auth callback with the hashed token
    const url = `${origin}/auth/callback?token_hash=${hashedToken}&type=magiclink&next=/dashboard`
    return NextResponse.json({ url })
  }

  // Fallback: return the action_link directly (Supabase hosted auth)
  const actionLink = data?.properties?.action_link
  if (actionLink) return NextResponse.json({ url: actionLink })

  return NextResponse.json({ error: 'Could not generate link' }, { status: 500 })
}
