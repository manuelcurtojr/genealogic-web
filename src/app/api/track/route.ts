import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'

/**
 * POST /api/track
 * Pageview tracking ligero y anónimo (GDPR-friendly).
 *
 * Body: { kennel_id?, dog_id?, path, referrer? }
 *
 * Genera visitor_hash = sha256(ip + user-agent + dia) — sin IP plana, sin cookies.
 * Se inserta vía service-role bypassing RLS porque el visitante es anónimo.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || !body.path) {
      return NextResponse.json({ ok: false, error: 'path required' }, { status: 400 })
    }
    const { kennel_id, dog_id, path, referrer } = body

    // No track de bots evidentes
    const ua = request.headers.get('user-agent') || ''
    if (/bot|crawler|spider|curl|wget|preview|prerender/i.test(ua)) {
      return NextResponse.json({ ok: true, skipped: 'bot' })
    }

    // Hash anónimo del visitante (válido solo dentro del día actual)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
            || request.headers.get('x-real-ip')
            || 'unknown'
    const day = new Date().toISOString().slice(0, 10)
    const visitorHash = crypto.createHash('sha256')
      .update(`${ip}|${ua}|${day}`)
      .digest('hex')
      .slice(0, 32)

    const country = request.headers.get('x-vercel-ip-country') || null

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    await admin.from('page_views').insert({
      kennel_id: kennel_id || null,
      dog_id: dog_id || null,
      path: String(path).slice(0, 500),
      visitor_hash: visitorHash,
      referrer: referrer ? String(referrer).slice(0, 500) : null,
      country,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
