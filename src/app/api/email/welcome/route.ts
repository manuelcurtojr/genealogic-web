/**
 * POST /api/email/welcome
 * Body: { intent: 'breeder' | 'owner' }
 *
 * Manda el email de bienvenida al user autenticado según su intent.
 * Llamado desde /register tras un signUp exitoso. Idempotente — dedupe
 * por user_id + 'welcome' en email_log.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTransactionalEmail } from '@/lib/email/send'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const { intent } = (await req.json().catch(() => ({}))) as { intent?: string }
  const isBreeder = intent === 'breeder'

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  const toEmail = profile?.email || user.email
  if (!toEmail) return NextResponse.json({ ok: false, error: 'no_email' }, { status: 400 })

  const result = await sendTransactionalEmail(
    toEmail,
    isBreeder
      ? { template: 'welcome_breeder', props: { displayName: profile?.display_name || null } }
      : { template: 'welcome_owner', props: { displayName: profile?.display_name || null } },
    { userId: user.id, dedupeKey: `welcome:${user.id}` },
  )

  return NextResponse.json(result)
}
