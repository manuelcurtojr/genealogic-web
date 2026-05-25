/**
 * GET /api/cron/re-engagement
 *
 * Cron diario que manda email a usuarios inactivos:
 *  - 14 días sin entrar → variante "te echamos de menos"
 *  - 30 días sin entrar → variante "última llamada"
 *
 * Solo se manda 1 vez por user (dedupe via email_log con
 * dedupe_key=re_engagement:14:{userId} y :30:{userId}).
 *
 * Respeta opt-out de marketing.
 */
import { NextResponse } from 'next/server'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { sendTransactionalEmail } from '@/lib/email/send'
import { isAuthorizedCron, cronUnauthorized } from '@/lib/cron/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return cronUnauthorized()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const now = new Date()
  const iso14 = new Date(now.getTime() - 14 * 86400000).toISOString()
  const iso15 = new Date(now.getTime() - 15 * 86400000).toISOString()
  const iso30 = new Date(now.getTime() - 30 * 86400000).toISOString()
  const iso31 = new Date(now.getTime() - 31 * 86400000).toISOString()

  // Buckets: users que su last_sign_in_at cae exactamente en {14, 30} días.
  // Usamos ventana de 1 día (15..14, 31..30) para cubrir desfases del cron.
  let sent14 = 0, sent30 = 0, skipped = 0

  for (const [bucket, gte, lt] of [
    ['14', iso15, iso14] as const,
    ['30', iso31, iso30] as const,
  ]) {
    const { data: users } = await admin
      .from('profiles')
      .select('id, display_name, email, onboarding_intent, last_sign_in_at')
      .gte('last_sign_in_at', gte)
      .lt('last_sign_in_at', lt)
      .not('email', 'is', null)

    for (const u of (users || []) as Array<{
      id: string
      display_name: string | null
      email: string | null
      onboarding_intent: 'breeder' | 'owner' | null
      last_sign_in_at: string
    }>) {
      if (!u.email) { skipped++; continue }

      const intent: 'breeder' | 'owner' = u.onboarding_intent === 'breeder' ? 'breeder' : 'owner'

      const result = await sendTransactionalEmail(
        u.email,
        {
          template: 're_engagement',
          props: {
            recipientName: u.display_name,
            daysAway: parseInt(bucket, 10),
            intent,
          },
        },
        {
          userId: u.id,
          dedupeKey: `re_engagement:${bucket}:${u.id}`,
        },
      )
      if (result.ok && !result.skipped) {
        if (bucket === '14') sent14++
        else sent30++
      } else {
        skipped++
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent14, sent30, skipped,
    ranAt: new Date().toISOString(),
  })
}
