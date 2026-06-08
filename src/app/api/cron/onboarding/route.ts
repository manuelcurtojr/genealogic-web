/**
 * GET /api/cron/onboarding
 *
 * Red de seguridad del onboarding por email. Corre temprano (06:00, antes que
 * el resto de crons) y hace dos cosas:
 *
 *  1) SINCRONIZA auth.users → profiles (last_sign_in_at, email_confirmed_at)
 *     vía la RPC sync_user_auth_to_profiles. Sin esto, /api/cron/re-engagement
 *     no funciona (leía profiles.last_sign_in_at, que estaba siempre NULL).
 *
 *  2) MANDA los emails de arranque que el signup NO garantiza:
 *     - activación (founder) a quien confirmó su email pero NUNCA inició sesión
 *       (last_sign_in_at IS NULL). El welcome se disparaba en /register con un
 *       fetch sin sesión → fallaba con 401 y nadie recibía nada.
 *     - welcome (owner/breeder) a quien ya entró pero nunca lo recibió.
 *
 * Idempotente: dedupe via email_log con activation:{id} / welcome:{id}. Solo
 * mira altas de los últimos 30 días (no resucita bienvenidas a cuentas viejas).
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

  // 1) Sincronizar auth.users → profiles (last_sign_in_at, email_confirmed_at).
  let synced = true
  try {
    const { error } = await admin.rpc('sync_user_auth_to_profiles')
    if (error) synced = false
  } catch {
    synced = false
  }

  // 2) Candidatos: altas de los últimos 30 días con email (excluye admin).
  const now = new Date()
  const iso30d = new Date(now.getTime() - 30 * 86400000).toISOString()

  const { data: users } = await admin
    .from('profiles')
    .select('id, display_name, email, role, created_at, last_sign_in_at, email_confirmed_at')
    .gte('created_at', iso30d)
    .not('email', 'is', null)
    .neq('role', 'admin')

  let activationSent = 0
  let welcomeSent = 0
  let skipped = 0

  for (const u of (users || []) as Array<{
    id: string
    display_name: string | null
    email: string | null
    role: string | null
    created_at: string
    last_sign_in_at: string | null
    email_confirmed_at: string | null
  }>) {
    if (!u.email) { skipped++; continue }

    // Aún no confirmó su email → Supabase sigue gestionando la confirmación.
    if (!u.email_confirmed_at) { skipped++; continue }

    const ageDays = (now.getTime() - new Date(u.created_at).getTime()) / 86400000
    const hasLoggedIn = !!u.last_sign_in_at

    if (!hasLoggedIn) {
      // Confirmó pero NUNCA entró. Dejamos 1 día de margen por si entra solo.
      if (ageDays < 1) { skipped++; continue }
      const result = await sendTransactionalEmail(
        u.email,
        { template: 'owner_activation', props: { displayName: u.display_name } },
        { userId: u.id, dedupeKey: `activation:${u.id}` },
      )
      if (result.ok && !result.skipped) activationSent++
      else skipped++
    } else {
      // Ya entró pero quizá nunca recibió la bienvenida (welcome roto en signup).
      const isBreeder = u.role === 'breeder'
      const result = await sendTransactionalEmail(
        u.email,
        isBreeder
          ? { template: 'welcome_breeder', props: { displayName: u.display_name } }
          : { template: 'welcome_owner', props: { displayName: u.display_name } },
        { userId: u.id, dedupeKey: `welcome:${u.id}` },
      )
      if (result.ok && !result.skipped) welcomeSent++
      else skipped++
    }
  }

  return NextResponse.json({
    ok: true,
    synced,
    candidates: (users || []).length,
    activationSent,
    welcomeSent,
    skipped,
    ranAt: now.toISOString(),
  })
}
