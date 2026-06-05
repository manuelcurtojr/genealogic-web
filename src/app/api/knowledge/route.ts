import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { userHasAddon } from '@/lib/kennel/addons-server'

const ALLOWED_CATEGORIES = ['general', 'precio', 'salud', 'reserva', 'entrega', 'filosofia', 'faq', 'condiciones']

/**
 * POST /api/knowledge
 * Crea una entrada de Biblioteca para el kennel del usuario.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'emailbot'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Emailbot' }, { status: 403 })
  }

  const body = await request.json()
  const { kennel_id, category, title, content, is_active } = body

  if (!kennel_id || !title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'kennel_id, title y content son obligatorios' }, { status: 400 })
  }
  if (category && !ALLOWED_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
  }

  // Calcular siguiente posición
  const { data: maxRow } = await supabase
    .from('knowledge_entries')
    .select('position')
    .eq('kennel_id', kennel_id)
    .eq('category', category || 'general')
    .order('position', { ascending: false })
    .limit(1)
  const nextPos = ((maxRow?.[0]?.position || 0) + 1)

  const { data, error } = await supabase
    .from('knowledge_entries')
    .insert({
      kennel_id,
      category: category || 'general',
      title: title.trim(),
      content: content.trim(),
      position: nextPos,
      is_active: is_active !== false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}
