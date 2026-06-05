import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { userHasAddon } from '@/lib/kennel/addons-server'

const ALLOWED = ['active', 'derived_to_human', 'closed']

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
  if (body.status) {
    if (!ALLOWED.includes(body.status)) return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    updates.status = body.status
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('emailbot_threads').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ thread: data })
}
