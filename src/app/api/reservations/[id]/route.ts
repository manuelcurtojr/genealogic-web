import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_STATUS = ['interested', 'waitlisted', 'deposit_paid', 'assigned', 'contract_signed', 'paid_in_full', 'delivered', 'cancelled']

/**
 * PATCH /api/reservations/[id]
 * Actualiza una reserva. Soporta cambio de status (select inline del pipeline) o
 * edición completa desde el panel lateral. RLS garantiza ownership.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: any = {}

  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.includes(body.status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }
    updates.status = body.status
    // Auto-stamping de timestamps por status
    if (body.status === 'deposit_paid') updates.deposit_paid_at = new Date().toISOString()
    if (body.status === 'contract_signed') updates.contract_signed_at = new Date().toISOString()
    if (body.status === 'delivered') updates.delivered_at = new Date().toISOString()
  }

  for (const key of ['owner_id', 'litter_id', 'dog_id', 'preference_sex', 'preference_color', 'preference_notes', 'deposit_amount_cents', 'total_price_cents', 'position_in_queue']) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('puppy_reservations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reservation: data })
}

/**
 * DELETE /api/reservations/[id]
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('puppy_reservations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
