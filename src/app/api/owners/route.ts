import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/owners
 * Crea un cliente (owner) en el kennel del usuario. RLS verifica ownership.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    kennel_id, full_name, email, phone, address, city, country,
    id_doc_type, id_doc_number, notes,
  } = body

  if (!kennel_id || !full_name?.trim()) {
    return NextResponse.json({ error: 'kennel_id y full_name requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('owners')
    .insert({
      kennel_id,
      full_name: full_name.trim(),
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country: country || null,
      id_doc_type: id_doc_type || null,
      id_doc_number: id_doc_number || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ owner: data })
}
