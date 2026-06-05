import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { userHasAddon } from '@/lib/kennel/addons-server'

const ALLOWED_CATEGORIES = ['general', 'precio', 'salud', 'reserva', 'entrega', 'filosofia', 'faq', 'condiciones']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'emailbot'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Emailbot' }, { status: 403 })
  }

  const body = await request.json()
  const updates: any = {}
  if ('category' in body) {
    if (!ALLOWED_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
    }
    updates.category = body.category
  }
  if ('title' in body) updates.title = body.title?.trim()
  if ('content' in body) updates.content = body.content?.trim()
  if ('is_active' in body) updates.is_active = !!body.is_active
  if ('position' in body) updates.position = body.position

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('knowledge_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'emailbot'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Emailbot' }, { status: 403 })
  }

  const { error } = await supabase.from('knowledge_entries').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
