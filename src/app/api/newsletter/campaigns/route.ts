/**
 * POST /api/newsletter/campaigns — crear nueva campaña (draft).
 * Body: { kennel_id, title?, subject? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { userHasAddon } from '@/lib/kennel/addons-server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'newsletter'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Newsletter' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { kennel_id, title, subject } = body
  if (!kennel_id) return NextResponse.json({ error: 'kennel_id requerido' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: k } = await admin
    .from('kennels').select('id, owner_id, name').eq('id', kennel_id).maybeSingle()
  if (!k || k.owner_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('newsletter_campaigns')
    .insert({
      kennel_id,
      title: title || 'Nueva campaña',
      subject: subject || `Novedades de ${k.name}`,
      body_markdown: '',
      audience_type: 'all',
      status: 'draft',
      created_by: user.id,
    })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
