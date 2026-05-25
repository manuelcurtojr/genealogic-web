/**
 * POST /api/newsletter/unsubscribe — público (sin auth)
 * Body: { token, campaign_id? }
 *
 * También aceptamos GET con query params para compatibilidad con clientes
 * de email que no usan POST (List-Unsubscribe One-Click usa POST estándar).
 */
import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeByToken } from '@/lib/newsletter/send'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let token = ''
  let campaignId: string | null = null

  // Soportar JSON, form-urlencoded y query string (List-Unsubscribe-Post)
  const ct = request.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const body = await request.json().catch(() => ({}))
    token = body.token || ''
    campaignId = body.campaign_id || null
  } else {
    const form = await request.formData().catch(() => null)
    if (form) {
      token = (form.get('token') as string) || ''
      campaignId = (form.get('campaign_id') as string) || null
    }
  }
  if (!token) {
    const sp = new URL(request.url).searchParams
    token = sp.get('token') || ''
    campaignId = campaignId || sp.get('campaign') || null
  }

  if (!token) return NextResponse.json({ error: 'token requerido' }, { status: 400 })

  const res = await unsubscribeByToken({ token, campaignId })
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: 400 })
  return NextResponse.json({ ok: true, email: res.email, kennel: res.kennelName })
}

export async function GET(request: NextRequest) {
  // Redirect a la página visual /newsletter/unsubscribe?token=...
  const sp = new URL(request.url).searchParams
  const target = new URL('/newsletter/unsubscribe', request.url)
  const token = sp.get('token')
  const campaign = sp.get('campaign')
  if (token) target.searchParams.set('token', token)
  if (campaign) target.searchParams.set('campaign', campaign)
  return NextResponse.redirect(target)
}
