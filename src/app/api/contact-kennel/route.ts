import { NextRequest, NextResponse } from 'next/server'
import { createKennelAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/contact-kennel
 *
 * Endpoint público para que un visitante envíe una solicitud de
 * contacto a un criadero. Crea un registro en puppy_reservations
 * con source='public_form' y status='interested' → aparece en
 * la bandeja de "Solicitudes" del criador (tab "Todas" de /reservas).
 *
 * Usa service_role para bypass RLS (las RLS no permiten INSERT
 * anónimo, lo cual es correcto — controlamos la inserción aquí).
 *
 * Validación mínima por ahora; añadir captcha + rate limit en futuro.
 */
export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    kennel_id,
    applicant_name,
    applicant_email,
    applicant_phone,
    applicant_message,
    preference_sex,
    preference_color,
  } = body || {}

  // Validación campos obligatorios
  if (!kennel_id || typeof kennel_id !== 'string') {
    return NextResponse.json({ error: 'kennel_id requerido' }, { status: 400 })
  }
  if (!applicant_name || typeof applicant_name !== 'string' || !applicant_name.trim()) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  }
  if (!applicant_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant_email)) {
    return NextResponse.json({ error: 'Email válido requerido' }, { status: 400 })
  }
  if (!applicant_message || typeof applicant_message !== 'string' || applicant_message.trim().length < 5) {
    return NextResponse.json({ error: 'Mensaje muy corto' }, { status: 400 })
  }

  const admin = createKennelAdminClient()

  // Verificar que el kennel existe + obtener owner_id (necesario para
  // que el criador vea su solicitud según RLS de SELECT)
  const { data: kennel, error: kErr } = await admin
    .from('kennels')
    .select('id, owner_id, name')
    .eq('id', kennel_id)
    .maybeSingle()
  if (kErr || !kennel) {
    return NextResponse.json({ error: 'Criadero no encontrado' }, { status: 404 })
  }

  // Insertar la solicitud
  const { data: insertedRes, error: insertErr } = await admin
    .from('puppy_reservations')
    .insert({
      kennel_id: kennel.id,
      owner_id: kennel.owner_id, // el criador es el "dueño" de la solicitud
      status: 'interested',
      source: 'public_form',
      applicant_name: applicant_name.trim(),
      applicant_email: applicant_email.trim().toLowerCase(),
      applicant_phone: applicant_phone?.trim() || null,
      applicant_message: applicant_message.trim(),
      preference_sex: ['male', 'female'].includes(preference_sex) ? preference_sex : null,
      preference_color: preference_color?.trim() || null,
    })
    .select('id')
    .single()

  if (insertErr) {
    console.error('contact-kennel insert error', insertErr)
    return NextResponse.json({ error: 'Error guardando la solicitud' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: insertedRes?.id })
}
