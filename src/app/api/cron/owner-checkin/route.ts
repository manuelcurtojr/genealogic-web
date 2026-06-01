/**
 * GET /api/cron/owner-checkin
 *
 * Cron diario que manda un email "founder check-in" a los propietarios
 * (onboarding_intent='owner') que se registraron hace ~2 días. El email va
 * en primera persona de Manuel y pide que RESPONDAN si tuvieron problemas o
 * necesitan ayuda — el reply-to apunta a manuel@genealogic.io.
 *
 * Por qué un cron y no enviarlo en el signup:
 *   - Cubre TODAS las vías de alta (email, Google, Apple) leyendo de profiles.
 *     Los registros OAuth pasan por /auth/callback y nunca dispararon el
 *     welcome email; este barrido no se los salta.
 *   - 2 días de margen: deja que el owner pruebe primero, así el check-in
 *     llega con contexto (ya intentó crear su perro, o se atascó).
 *
 * Se manda 1 sola vez por usuario (dedupe via email_log con
 * dedupe_key=owner_checkin:{userId}). Respeta opt-out de marketing
 * (el template está en categoría 'marketing').
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
  // Ventana: registrados entre hace 3 días y hace 2 días. La franja de 1 día
  // cubre desfases del cron sin reenviar (el dedupe es la red de seguridad).
  const iso3d = new Date(now.getTime() - 3 * 86400000).toISOString()
  const iso2d = new Date(now.getTime() - 2 * 86400000).toISOString()

  const { data: owners } = await admin
    .from('profiles')
    .select('id, display_name, email, created_at')
    .eq('onboarding_intent', 'owner')
    .gte('created_at', iso3d)
    .lt('created_at', iso2d)
    .not('email', 'is', null)

  let sent = 0
  let skipped = 0

  for (const u of (owners || []) as Array<{
    id: string
    display_name: string | null
    email: string | null
    created_at: string
  }>) {
    if (!u.email) { skipped++; continue }

    // ¿Ya creó algún perro? Personaliza el copy (felicita vs ofrece ayuda).
    const { count: dogCount } = await admin
      .from('dogs')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', u.id)

    const result = await sendTransactionalEmail(
      u.email,
      {
        template: 'owner_checkin',
        props: {
          displayName: u.display_name,
          hasDog: (dogCount || 0) > 0,
        },
      },
      {
        userId: u.id,
        dedupeKey: `owner_checkin:${u.id}`,
      },
    )

    if (result.ok && !result.skipped) sent++
    else skipped++
  }

  return NextResponse.json({
    ok: true,
    candidates: (owners || []).length,
    sent,
    skipped,
    ranAt: now.toISOString(),
  })
}
