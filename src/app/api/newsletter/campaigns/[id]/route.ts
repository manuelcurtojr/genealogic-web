/**
 * PATCH /api/newsletter/campaigns/[id] — actualizar fields editables
 * DELETE /api/newsletter/campaigns/[id] — borrar (solo si NO está sent/sending)
 *
 * Solo se permiten cambios en campañas que están en draft o scheduled.
 * Una vez enviada (sent/sending/failed), solo se puede consultar; no editar.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { userHasAddon } from '@/lib/kennel/addons-server'

export const runtime = 'nodejs'

const EDITABLE_FIELDS = [
  'title', 'subject', 'preheader', 'body_markdown',
  'cta_label', 'cta_url', 'hero_image_url', 'reply_to',
  'audience_type', 'audience_filter', 'scheduled_at',
]

async function assertOwnership(campaignId: string, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: c } = await admin
    .from('newsletter_campaigns')
    .select('id, kennel_id, status, kennel:kennels(owner_id)')
    .eq('id', campaignId)
    .maybeSingle()
  if (!c) return { error: 'campaign_not_found', status: 404 }
  if (c.kennel?.owner_id !== userId) return { error: 'forbidden', status: 403 }
  return { campaign: c }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'newsletter'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Newsletter' }, { status: 403 })
  }

  const guard = await assertOwnership(id, user.id)
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status })
  if (['sent', 'sending'].includes(guard.campaign.status)) {
    return NextResponse.json({ error: 'No se puede editar una campaña ya enviada' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {}
  for (const k of EDITABLE_FIELDS) if (k in body) updates[k] = body[k]
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, noop: true })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { error } = await admin
    .from('newsletter_campaigns').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'newsletter'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Newsletter' }, { status: 403 })
  }

  const guard = await assertOwnership(id, user.id)
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status })
  if (['sending'].includes(guard.campaign.status)) {
    return NextResponse.json({ error: 'No se puede borrar mientras se está enviando' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  await admin.from('newsletter_campaigns').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
