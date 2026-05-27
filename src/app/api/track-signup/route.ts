/**
 * POST /api/track-signup
 *
 * Endpoint que se llama desde la página de registro JUSTO DESPUÉS de que
 * el user creó su cuenta. Lee la cookie `signup_meta` que el middleware
 * persistió al primer hit (UTM + referrer + landing_page) y la guarda
 * en `profiles.signup_meta` para attribution histórica.
 *
 * Adicionalmente: dispara una alerta al super admin notificando del
 * nuevo registro con la fuente.
 *
 * Best-effort: si algo falla NO rompe el flujo de signup. Devuelve 200
 * siempre que el user esté logueado.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notifySuperAdmin } from '@/lib/admin/notify'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  // Leer cookie signup_meta (la setea el middleware al primer hit con UTM)
  const rawCookie = request.cookies.get('signup_meta')?.value
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let meta: Record<string, any> = {}
  if (rawCookie) {
    try { meta = JSON.parse(rawCookie) } catch { /* ignore */ }
  }

  // Añadir signup_device basado en user-agent + IP geo (mejora attribution)
  const ua = request.headers.get('user-agent') || ''
  const isMobile = /Mobile|Android|iPhone/.test(ua)
  meta.signup_device = isMobile ? 'mobile' : 'desktop'
  meta.signup_user_agent = ua.slice(0, 300)
  meta.signup_at = new Date().toISOString()

  // Persistir en profiles.signup_meta (solo si está vacío — first-touch wins).
  // Service-role porque queremos garantizar la escritura aunque el RLS de
  // profiles tenga políticas restrictivas para UPDATE.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: profile } = await admin
    .from('profiles')
    .select('signup_meta, email, display_name, created_at')
    .eq('id', user.id)
    .single()

  // Solo escribimos si signup_meta está vacío (primera vez se llama).
  const existing = profile?.signup_meta || {}
  const isFirstCall = Object.keys(existing).length === 0
  if (isFirstCall) {
    await admin
      .from('profiles')
      .update({ signup_meta: meta })
      .eq('id', user.id)

    // Alerta al super admin (best-effort).
    const source = meta.utm_source
      ? `${meta.utm_source}${meta.utm_medium ? ` / ${meta.utm_medium}` : ''}`
      : meta.referrer
        ? `referrer: ${meta.referrer}`
        : 'directo'
    const landing = meta.landing_page || '/'
    notifySuperAdmin({
      kind: 'signup',
      subject: `Nuevo usuario registrado`,
      body: `Email: ${profile?.email || user.email || 'sin email'}\nNombre: ${profile?.display_name || '—'}\nFuente: ${source}\nLanding: ${landing}\nDispositivo: ${meta.signup_device}`,
      dedupeKey: `admin_alert:signup:${user.id}`,
      ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://genealogic.io'}/admin/users`,
      ctaLabel: 'Ver usuarios',
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, persisted: isFirstCall })
}
