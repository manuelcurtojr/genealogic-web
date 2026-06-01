/**
 * GET /api/cron/admin-alerts
 *
 * Cron periódico (cada 15 min via vercel.json) que detecta condiciones
 * sospechosas y notifica al super admin. Diseñado para ser idempotente:
 * usa email_log dedupe_key con buckets de tiempo para no spamear.
 *
 * Detecciones actuales:
 *   1. Solicitudes URGENTES sin tocar > 24h.
 *   2. Solicitudes pending > 72h.
 *   3. Spike de signups en última hora (> 20 nuevos).
 *   4. Spike de claims en última hora (> 5).
 *   5. Emails con status='failed' en última hora (> 10).
 *   6. Webhooks Stripe sin procesar (signature error reciente).
 *
 * Cron auth: header `Authorization: Bearer <CRON_SECRET>` o
 * `?secret=<CRON_SECRET>`. Vercel Cron pasa este header automáticamente
 * si CRON_SECRET está en env vars.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/cron/auth'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { notifySuperAdmin } from '@/lib/admin/notify'

export const runtime = 'nodejs'
export const maxDuration = 30

interface Alert {
  kind: 'system_alert'
  subject: string
  body: string
  dedupeKey: string
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://genealogic.io'

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const alerts: Alert[] = []
  const now = new Date()

  // Buckets de 6h para deduplicar (un mismo problema solo dispara 1 alerta cada 6h)
  const bucket = Math.floor(now.getTime() / (6 * 60 * 60_000))

  // ───────────────────────────────────────────────────────────────────────
  // 1. Solicitudes URGENTES sin tocar > 24h
  // ───────────────────────────────────────────────────────────────────────
  const day_ago = new Date(now.getTime() - 24 * 60 * 60_000).toISOString()
  const { count: urgentStuck } = await admin
    .from('admin_requests')
    .select('id', { count: 'exact', head: true })
    .eq('priority', 'urgent')
    .not('status', 'in', '("approved","rejected","cancelled")')
    .lt('created_at', day_ago)
  if ((urgentStuck || 0) > 0) {
    alerts.push({
      kind: 'system_alert',
      subject: `${urgentStuck} solicitud(es) urgente(s) llevan +24h sin tocar`,
      body: `Hay ${urgentStuck} solicitudes con priority='urgent' creadas hace más de 24h y aún sin resolver.\n\nRevísalas cuanto antes — los SLA prometidos al usuario eran 72h máximo.`,
      dedupeKey: `cron-alert:urgent-stuck:${bucket}`,
    })
  }

  // ───────────────────────────────────────────────────────────────────────
  // 2. Pending > 72h
  // ───────────────────────────────────────────────────────────────────────
  const three_days_ago = new Date(now.getTime() - 72 * 60 * 60_000).toISOString()
  const { count: pendingStuck } = await admin
    .from('admin_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lt('created_at', three_days_ago)
  if ((pendingStuck || 0) >= 3) {
    alerts.push({
      kind: 'system_alert',
      subject: `${pendingStuck} solicitudes pending llevan +72h`,
      body: `${pendingStuck} solicitudes están en estado 'pending' desde hace más de 72h.\n\nNo cumple SLA. Triáralas.`,
      dedupeKey: `cron-alert:pending-stuck:${bucket}`,
    })
  }

  // ───────────────────────────────────────────────────────────────────────
  // 3. Spike de signups en última hora
  // ───────────────────────────────────────────────────────────────────────
  const hour_ago = new Date(now.getTime() - 60 * 60_000).toISOString()
  const { count: signupsLastHour } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', hour_ago)
  if ((signupsLastHour || 0) >= 20) {
    alerts.push({
      kind: 'system_alert',
      subject: `${signupsLastHour} signups en la última hora`,
      body: `Spike inusual: ${signupsLastHour} usuarios se han registrado en la última hora.\n\nPuede ser tracción real (campaña, viral) o bot/abuso. Revisa /admin/users para confirmar.`,
      dedupeKey: `cron-alert:signup-spike:${bucket}`,
    })
  }

  // ───────────────────────────────────────────────────────────────────────
  // 4. Spike de claims en última hora
  // ───────────────────────────────────────────────────────────────────────
  const { count: claimsLastHour } = await admin
    .from('admin_requests')
    .select('id', { count: 'exact', head: true })
    .in('type', ['claim_dog', 'claim_kennel'])
    .gte('created_at', hour_ago)
  if ((claimsLastHour || 0) >= 5) {
    alerts.push({
      kind: 'system_alert',
      subject: `${claimsLastHour} claims en la última hora`,
      body: `${claimsLastHour} claims (perro/criadero) recibidos en la última hora. Inusual — revisa si es spam o tráfico legítimo.`,
      dedupeKey: `cron-alert:claim-spike:${bucket}`,
    })
  }

  // ───────────────────────────────────────────────────────────────────────
  // 5. Emails con status='failed' > 10 en última hora
  // ───────────────────────────────────────────────────────────────────────
  const { count: emailsFailed } = await admin
    .from('email_log')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('created_at', hour_ago)
  if ((emailsFailed || 0) >= 10) {
    alerts.push({
      kind: 'system_alert',
      subject: `${emailsFailed} emails fallidos en última hora`,
      body: `Resend está rechazando ${emailsFailed} emails en la última hora. Posibles causas: API key inválida, cuota agotada, dominio bloqueado.\n\nRevisa Resend dashboard.`,
      dedupeKey: `cron-alert:email-failed:${bucket}`,
    })
  }

  // ───────────────────────────────────────────────────────────────────────
  // 6. Nuevos usuarios registrados — 1 aviso por usuario (catch-all)
  // ───────────────────────────────────────────────────────────────────────
  // /api/track-signup ya avisa al instante en las altas por formulario email,
  // pero los registros por OAuth (Google/Apple) pasan por /auth/callback y NO
  // llaman a track-signup → quedaban sin aviso. Este barrido cubre TODAS las
  // vías: lee profiles creados en la última ventana y manda un aviso por cada
  // uno. Usa la MISMA dedupe_key que track-signup (`admin_alert:signup:<id>`):
  //   · altas email → track-signup ya mandó → aquí se hace skip (no duplica)
  //   · altas OAuth → nadie avisó → aquí se manda
  // Ventana de 90 min: cubre el hueco de 30 min entre pasadas del cron + margen
  // para tolerar una ejecución fallida, sin arriesgar avisar usuarios históricos.
  const ninety_min_ago = new Date(now.getTime() - 90 * 60_000).toISOString()
  const { data: newUsers } = await admin
    .from('profiles')
    .select('id, email, display_name, created_at, signup_meta')
    .gte('created_at', ninety_min_ago)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signupAlerts = (newUsers || []).map((u: any) => {
    const meta = u.signup_meta || {}
    const source = meta.utm_source
      ? `${meta.utm_source}${meta.utm_medium ? ` / ${meta.utm_medium}` : ''}`
      : meta.referrer
        ? `referrer: ${meta.referrer}`
        : 'directo / OAuth'
    return {
      subject: 'Nuevo usuario registrado',
      body: `Email: ${u.email || 'sin email'}\nNombre: ${u.display_name || '—'}\nFuente: ${source}\nRegistrado: ${new Date(u.created_at).toLocaleString('es-ES')}`,
      dedupeKey: `admin_alert:signup:${u.id}`,
    }
  })

  // ───────────────────────────────────────────────────────────────────────
  // Enviar: alertas de sistema (al panel) + un aviso por nuevo usuario
  // ───────────────────────────────────────────────────────────────────────
  const results = await Promise.all([
    ...alerts.map(a => notifySuperAdmin({
      kind: a.kind,
      subject: a.subject,
      body: a.body,
      dedupeKey: a.dedupeKey,
      ctaUrl: `${SITE_URL}/admin`,
      ctaLabel: 'Ir al panel',
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...signupAlerts.map((a: any) => notifySuperAdmin({
      kind: 'signup' as const,
      subject: a.subject,
      body: a.body,
      dedupeKey: a.dedupeKey,
      ctaUrl: `${SITE_URL}/admin/users`,
      ctaLabel: 'Ver usuarios',
    })),
  ])

  return NextResponse.json({
    ok: true,
    checked_at: now.toISOString(),
    alerts_detected: alerts.length,
    new_users_in_window: signupAlerts.length,
    alerts_sent: results.filter(r => r.ok && !r.skipped).length,
    alerts_skipped: results.filter(r => r.skipped).length,
  })
}
