/**
 * POST /api/track — Endpoint first-party de analítica web.
 *
 * Body: { kennel_id?, dog_id?, path, referrer? }
 *
 * Filtros:
 *   - DNT=1                            → 204 (respetamos opt-out)
 *   - UA vacío o coincide con bot RE   → 204
 *   - path bajo /admin /api /_next ... → 204 (shouldIgnorePath)
 *   - mismo (session_id + path) en últimos 60s → 204 (dedupe)
 *
 * No persistimos IP ni UA crudo. Solo `session_id` = sha256(ip+UA+día)
 * que rota a medianoche UTC → GDPR-friendly, sin cookies, sin terceros.
 *
 * Captura geo desde headers de Vercel (x-vercel-ip-country/region/city) +
 * device/browser/os derivado del UA via parseUserAgent.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  BOT_UA_RE,
  cleanReferrer,
  parseUserAgent,
  sessionHash,
  shouldIgnorePath,
} from '@/lib/analytics-shared'

export const runtime = 'edge'

const NO_CONTENT = () => new Response(null, { status: 204 })

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('dnt') === '1') return NO_CONTENT()
    const ua = request.headers.get('user-agent') ?? ''
    if (!ua || BOT_UA_RE.test(ua)) return NO_CONTENT()

    const body = await request.json().catch(() => null)
    if (!body || !body.path) return NO_CONTENT()

    const { kennel_id, dog_id } = body as { kennel_id?: string; dog_id?: string }
    const path = String(body.path || '/').split('?')[0]!.split('#')[0]!
    if (!path.startsWith('/') || path.length > 512) return NO_CONTENT()
    if (shouldIgnorePath(path)) return NO_CONTENT()

    // session_id hash diario
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '0.0.0.0'
    const session_id = await sessionHash(ip, ua)

    // Geo Vercel + device
    const country = request.headers.get('x-vercel-ip-country')
    const region = request.headers.get('x-vercel-ip-country-region')
    const cityRaw = request.headers.get('x-vercel-ip-city')
    const city = cityRaw ? decodeURIComponent(cityRaw) : null
    const { device, browser, os } = parseUserAgent(ua)

    // Referrer limpio (sólo si NO es nuestro propio host)
    const selfHost = request.headers.get('host') ?? ''
    const referrer = cleanReferrer(body.referrer, selfHost)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !secret) return NO_CONTENT()
    const supabase = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Dedupe: misma (kennel, session, path) en últimos 60s → skip
    if (kennel_id) {
      const sixtySecAgo = new Date(Date.now() - 60_000).toISOString()
      const { data: dup } = await supabase
        .from('page_views')
        .select('id')
        .eq('kennel_id', kennel_id)
        .eq('session_id', session_id)
        .eq('path', path)
        .gte('created_at', sixtySecAgo)
        .limit(1)
      if (Array.isArray(dup) && dup.length > 0) return NO_CONTENT()
    }

    await supabase.from('page_views').insert({
      kennel_id: kennel_id || null,
      dog_id: dog_id || null,
      path,
      session_id,
      visitor_hash: session_id, // backfill legacy column
      referrer,
      country,
      region,
      city,
      device,
      browser,
      os,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NO_CONTENT()
  }
}
