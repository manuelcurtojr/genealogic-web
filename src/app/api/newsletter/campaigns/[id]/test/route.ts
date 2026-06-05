/**
 * POST /api/newsletter/campaigns/[id]/test
 * Body: { to_email }
 *
 * Envía una versión "[PRUEBA]" del email al email indicado. Útil para
 * previsualizar el render real en la bandeja de entrada antes de mandarlo
 * a toda la audiencia.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { sendCampaignTest, isResendConfigured } from '@/lib/newsletter/send'
import { userHasAddon } from '@/lib/kennel/addons-server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isResendConfigured()) {
    return NextResponse.json({ error: 'Resend no está configurado en el servidor' }, { status: 500 })
  }
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'newsletter'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Newsletter' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const toEmail = (body.to_email as string)?.trim()
  if (!toEmail || !/^\S+@\S+\.\S+$/.test(toEmail)) {
    return NextResponse.json({ error: 'to_email inválido' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: c } = await admin
    .from('newsletter_campaigns')
    .select('id, kennel:kennels(owner_id)')
    .eq('id', id)
    .maybeSingle()
  if (!c) return NextResponse.json({ error: 'campaign_not_found' }, { status: 404 })
  if (c.kennel?.owner_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const res = await sendCampaignTest({ campaignId: id, toEmail })
  if ('error' in res) {
    return NextResponse.json({ error: res.error }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
