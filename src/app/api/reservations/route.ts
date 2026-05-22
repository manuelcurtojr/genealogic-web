import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/reservations
 * Crea una reserva nueva en el kennel del usuario autenticado.
 * RLS verifica que el kennel_id pertenezca al usuario.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    kennel_id, status, owner_id, litter_id, dog_id,
    preference_sex, preference_color, preference_notes,
    deposit_amount_cents, total_price_cents,
  } = body

  if (!kennel_id) return NextResponse.json({ error: 'kennel_id requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('puppy_reservations')
    .insert({
      kennel_id,
      status: status || 'interested',
      owner_id: owner_id || null,
      litter_id: litter_id || null,
      dog_id: dog_id || null,
      preference_sex: preference_sex || null,
      preference_color: preference_color || null,
      preference_notes: preference_notes || null,
      deposit_amount_cents: deposit_amount_cents ?? null,
      total_price_cents: total_price_cents ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reservation: data })
}
