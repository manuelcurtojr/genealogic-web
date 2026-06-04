import { createClient } from '@/lib/supabase/server'
import { sendPasswordResetEmail } from '@/lib/auth/password-reset'
import { NextRequest } from 'next/server'
import { logAdminAction } from '@/lib/admin/audit-log'
import { getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 })

    const { email } = await request.json()
    if (!email) return Response.json({ error: 'Missing email' }, { status: 400 })

    // Manda el email de recuperación con nuestra plantilla Resend (remitente
    // Genealogic) + enlace token_hash robusto — no el email de Supabase Auth.
    await sendPasswordResetEmail(email)

    // Audit log — dispara email "reset password" en nombre del admin.
    await logAdminAction({
      adminId: user.id,
      action: 'password_reset',
      targetTable: 'profiles',
      payload: { target_email: email },
      ip: getClientIp(request.headers),
      userAgent: request.headers.get('user-agent'),
    })
    return Response.json({ ok: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
