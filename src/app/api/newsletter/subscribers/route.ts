import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { kennel_id, email, full_name, source, tags, is_active } = body
  if (!kennel_id || !email) {
    return NextResponse.json({ error: 'kennel_id y email son obligatorios' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      kennel_id,
      email: email.trim().toLowerCase(),
      full_name: full_name || null,
      source: source || 'manual',
      tags: tags || [],
      is_active: is_active !== false,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ese email ya está en la lista' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ subscriber: data })
}
