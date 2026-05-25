import { NextRequest, NextResponse } from 'next/server'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { getEffectiveConfig, validateForm, splitFormValues } from '@/lib/kennel/contact-form'
import { sendTransactionalEmail } from '@/lib/email/send'

/**
 * POST /api/contact-kennel
 *
 * Recibe { kennel_id, values } donde values es el mapa { fieldId: valor }
 * según la config del formulario del kennel. Valida + separa canónicos
 * vs extras + inserta en puppy_reservations.
 *
 * Compatible con el formato anterior (campos planos) por retrocompat.
 */
export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { kennel_id, values: rawValues, ...legacyTopLevel } = body || {}

  if (!kennel_id || typeof kennel_id !== 'string') {
    return NextResponse.json({ error: 'kennel_id requerido' }, { status: 400 })
  }

  const admin = createKennelAdminClient()

  // Verificar kennel y cargar config
  const { data: kennel, error: kErr } = await admin
    .from('kennels')
    .select('id, name, contact_form_config')
    .eq('id', kennel_id)
    .maybeSingle()
  if (kErr || !kennel) {
    return NextResponse.json({ error: 'Criadero no encontrado' }, { status: 404 })
  }

  const config = getEffectiveConfig(kennel.contact_form_config)

  // Soporte legacy: si llegan campos planos en body en vez de { values }, mapearlos
  const values: Record<string, any> = rawValues && typeof rawValues === 'object'
    ? rawValues
    : {
        // Fallback compatibilidad con la versión anterior del button
        name: legacyTopLevel.applicant_name,
        email: legacyTopLevel.applicant_email,
        phone: legacyTopLevel.applicant_phone,
        message: legacyTopLevel.applicant_message,
        puppy_sex: legacyTopLevel.preference_sex,
      }

  // Validar contra la config
  const { errors, ok } = validateForm(config, values)
  if (!ok) {
    const firstError = Object.values(errors)[0] || 'Datos inválidos'
    return NextResponse.json({ error: firstError, fields: errors }, { status: 400 })
  }

  // Separar valores canónicos vs extras
  const { canonical, extra } = splitFormValues(config, values)

  // Normalizar preference_sex si vino como "Macho/Hembra/Indiferente"
  const sexRaw = canonical.preference_sex
  if (sexRaw && typeof sexRaw === 'string') {
    const lower = sexRaw.toLowerCase()
    if (lower.includes('macho') || lower === 'male') canonical.preference_sex = 'male'
    else if (lower.includes('hembra') || lower === 'female') canonical.preference_sex = 'female'
    else canonical.preference_sex = null as any
  }

  if (canonical.applicant_email) {
    canonical.applicant_email = String(canonical.applicant_email).trim().toLowerCase()
  }

  const insertPayload: Record<string, any> = {
    kennel_id: kennel.id,
    status: 'interested',
    source: 'public_form',
    ...canonical,
    applicant_extra_data: Object.keys(extra).length > 0 ? extra : null,
  }

  const { data: insertedRes, error: insertErr } = await admin
    .from('puppy_reservations')
    .insert(insertPayload)
    .select('id')
    .single()

  if (insertErr) {
    console.error('contact-kennel insert error', insertErr)
    return NextResponse.json({ error: 'Error guardando la solicitud' }, { status: 500 })
  }

  // Email al criador notificándole la reserva nueva (best-effort, async,
  // no bloquea el response al solicitante).
  ;(async () => {
    try {
      const { data: ownerProfile } = await (admin as ReturnType<typeof createKennelAdminClient>)
        .from('profiles')
        .select('id, display_name, email')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('id', (await (admin as any).from('kennels').select('owner_id').eq('id', kennel_id).single()).data?.owner_id || '')
        .maybeSingle()

      if (ownerProfile?.email) {
        // Resolver nombre de raza si vino preference_breed_id en el form
        // (no es campo canónico tipado — viene como string libre del form).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const breedId = (canonical as any).preference_breed_id || values?.preference_breed_id
        let preferredBreed: string | null = null
        if (breedId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: b } = await (admin as any).from('breeds').select('name').eq('id', breedId).single()
          preferredBreed = b?.name || null
        }

        await sendTransactionalEmail(
          ownerProfile.email,
          {
            template: 'reservation_new',
            props: {
              breederName: ownerProfile.display_name || null,
              kennelName: kennel.name,
              clientName: String(canonical.applicant_name || 'Cliente'),
              clientEmail: String(canonical.applicant_email || ''),
              clientMessage: canonical.applicant_message ? String(canonical.applicant_message) : null,
              reservationId: insertedRes!.id,
              preferredSex: (canonical.preference_sex as 'male' | 'female' | null) || null,
              preferredBreed,
            },
          },
          {
            userId: ownerProfile.id,
            dedupeKey: `reservation_new:${insertedRes!.id}`,
          },
        )
      }
    } catch (err) {
      console.error('[email] reservation_new failed', err)
    }
  })()

  return NextResponse.json({ ok: true, id: insertedRes?.id })
}
