import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AI_MODELS } from '@/lib/ai/models'
import { userHasAddon } from '@/lib/kennel/addons-server'

/**
 * POST /api/emailbot/config — upsert config del Emailbot del kennel del usuario.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'emailbot'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Emailbot' }, { status: 403 })
  }

  const body = await request.json()
  const { kennel_id } = body
  if (!kennel_id) return NextResponse.json({ error: 'kennel_id requerido' }, { status: 400 })

  // Verificar ownership
  const { data: kennel } = await supabase
    .from('kennels').select('id, owner_id, slug').eq('id', kennel_id).single()
  if (!kennel || kennel.owner_id !== user.id) {
    return NextResponse.json({ error: 'Kennel no encontrado o no es tuyo' }, { status: 403 })
  }

  // Si llega bot_model, va a kennels (NO a emailbot_config). Validar contra catálogo.
  if (typeof body.bot_model === 'string') {
    const valid = AI_MODELS.some((m) => m.id === body.bot_model)
    if (!valid) {
      return NextResponse.json({ error: `Modelo no válido: ${body.bot_model}` }, { status: 400 })
    }
    const { error: kErr } = await supabase
      .from('kennels')
      .update({ bot_model: body.bot_model })
      .eq('id', kennel_id)
    if (kErr) return NextResponse.json({ error: kErr.message }, { status: 500 })
  }

  // Construir update solo con keys permitidas (las propias de emailbot_config)
  const allowed = ['is_enabled', 'inbound_address', 'reply_from_name', 'reply_from_email', 'signature', 'fallback_after_n_replies', 'working_hours']
  const updates: any = {}
  for (const k of allowed) if (k in body) updates[k] = body[k]

  // Si no existe row, crearla con defaults
  const { data: existing } = await supabase
    .from('emailbot_config').select('kennel_id').eq('kennel_id', kennel_id).maybeSingle()

  if (!existing) {
    const defaults = {
      kennel_id,
      is_enabled: false,
      inbound_address: `${kennel.slug}@inbound.genealogic.io`,
      fallback_after_n_replies: 3,
      ...updates,
    }
    const { data, error } = await supabase
      .from('emailbot_config').insert(defaults).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ config: data })
  }

  if (Object.keys(updates).length === 0) {
    const { data } = await supabase.from('emailbot_config').select('*').eq('kennel_id', kennel_id).single()
    return NextResponse.json({ config: data })
  }

  const { data, error } = await supabase
    .from('emailbot_config').update(updates).eq('kennel_id', kennel_id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data })
}
