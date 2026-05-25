/**
 * POST /api/newsletter/campaigns/[id]/send
 *
 * Lanza la campaña a toda su audiencia. SÍNCRONO con maxDuration=300.
 * El cliente debe mostrar spinner ("Enviando a X suscriptores...").
 *
 * Idempotente: si se reintenta, los UNIQUE evitan duplicados.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { sendCampaignNow, isResendConfigured } from '@/lib/newsletter/send'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isResendConfigured()) {
    return NextResponse.json({ error: 'Resend no está configurado en el servidor' }, { status: 500 })
  }
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: c } = await admin
    .from('newsletter_campaigns')
    .select('id, status, kennel:kennels(owner_id)')
    .eq('id', id)
    .maybeSingle()
  if (!c) return NextResponse.json({ error: 'campaign_not_found' }, { status: 404 })
  if (c.kennel?.owner_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (['sent', 'sending'].includes(c.status)) {
    return NextResponse.json({ error: `Ya se está enviando o se envió (status: ${c.status})` }, { status: 400 })
  }

  const res = await sendCampaignNow({ campaignId: id })
  if ('error' in res) {
    return NextResponse.json({ error: res.error }, { status: 500 })
  }
  return NextResponse.json({ ok: true, sent: res.sent, failed: res.failed })
}
