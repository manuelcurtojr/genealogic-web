/**
 * Server action: cliente firma el contrato.
 * Solo permitido si el contrato está en 'sent' o 'signed_partial' (criador
 * ya firmó). Update a 'signed_full' si ya estaba en signed_partial, sino
 * 'signed_partial'.
 */
'use server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { setContractStatus, updateContractBody } from '@/lib/contracts/contracts'
import { generateContractBody } from '@/lib/contracts/render'
import { getContractTemplate } from '@/lib/contracts/templates-actions'

export async function signContractAsClientAction(
  reservationId: string,
  contractId: string,
  signatureName: string,
  acceptedTerms: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!acceptedTerms) {
      return { ok: false, error: 'Debes marcar la casilla de aceptación' }
    }
    const name = signatureName.trim()
    if (!name || name.length < 3) {
      return { ok: false, error: 'Escribe tu nombre completo para firmar' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Sesión no válida' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: reservation } = await admin
      .from('puppy_reservations')
      .select('id, client_user_id')
      .eq('id', reservationId)
      .maybeSingle()
    if (!reservation) return { ok: false, error: 'Reserva no encontrada' }
    if (reservation.client_user_id !== user.id) return { ok: false, error: 'Sin permiso' }

    const { data: contract } = await admin
      .from('reservation_contracts')
      .select('id, status, signed_at_breeder')
      .eq('id', contractId)
      .maybeSingle()
    if (!contract) return { ok: false, error: 'Contrato no encontrado' }
    if (!['sent', 'signed_partial'].includes(contract.status)) {
      return { ok: false, error: 'El contrato no está disponible para firma' }
    }

    const h = await headers()
    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null
    const nextStatus = contract.signed_at_breeder ? 'signed_full' : 'signed_partial'

    await setContractStatus(contractId, nextStatus, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signed_at_client: new Date().toISOString() as any,
      signature_client_name: name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signature_client_ip: (ip || null) as any,
    })

    revalidatePath(`/mis-reservas/${reservationId}/contrato`)
    revalidatePath(`/mis-reservas/${reservationId}`)
    revalidatePath(`/reservas/${reservationId}/contrato`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

/**
 * El cliente guarda sus datos personales (DNI/domicilio) ANTES de firmar.
 * Necesarios para que el contrato salga relleno. Tras guardar, regenera el
 * body del contrato con el MISMO motor que usa el criador, para que el cliente
 * vea sus datos ya rellenos en el preview y pueda firmar.
 */
export async function saveClientDetailsAction(
  reservationId: string,
  contractId: string,
  details: { idDoc: string; address: string; postalCode: string; city: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const idDoc = details.idDoc.trim()
    const address = details.address.trim()
    const postalCode = details.postalCode.trim()
    const city = details.city.trim()
    if (!idDoc || !address) {
      return { ok: false, error: 'Completa al menos tu documento y dirección' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Sesión no válida' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any

    // Permiso: la reserva debe ser del cliente autenticado.
    const { data: owned } = await admin
      .from('puppy_reservations')
      .select('id, client_user_id')
      .eq('id', reservationId)
      .maybeSingle()
    if (!owned) return { ok: false, error: 'Reserva no encontrada' }
    if (owned.client_user_id !== user.id) return { ok: false, error: 'Sin permiso' }

    // Guarda los datos del cliente en la reserva.
    const { error: updErr } = await admin
      .from('puppy_reservations')
      .update({
        applicant_id_doc_number: idDoc,
        applicant_id_doc_type: 'dni',
        applicant_address: address,
        applicant_postal_code: postalCode,
        applicant_city: city,
      })
      .eq('id', reservationId)
    if (updErr) return { ok: false, error: updErr.message }

    // Regenera el contrato con los datos nuevos. Mismo select que el criador
    // (assertBreeder) para que buildContractVars tenga todos los campos.
    const { data: reservation } = await admin
      .from('puppy_reservations')
      .select(
        `*,
         kennel:kennels(id, name, city, country, owner_id, legal_name, legal_id, legal_address, legal_representative, legal_representative_id, sign_city, jurisdiction),
         puppy:dogs!puppy_dog_id(id, name, sex, microchip, registration, birth_date, breed:breeds(name), color:colors(name)),
         dog:dogs!dog_id(id, name, sex, microchip, registration, birth_date, breed:breeds(name), color:colors(name))`,
      )
      .eq('id', reservationId)
      .maybeSingle()
    if (!reservation) return { ok: false, error: 'Reserva no encontrada' }

    const { data: contract } = await admin
      .from('reservation_contracts')
      .select('id, kind, source_template_id')
      .eq('id', contractId)
      .maybeSingle()
    if (!contract) return { ok: false, error: 'Contrato no encontrado' }

    let bodyMarkdown: string
    if (!contract.source_template_id) {
      bodyMarkdown = generateContractBody(reservation, contract.kind)
    } else {
      const tpl = await getContractTemplate(contract.source_template_id)
      bodyMarkdown = generateContractBody(reservation, contract.kind, tpl?.body_md ?? null)
    }
    await updateContractBody({ contractId, bodyMarkdown })

    revalidatePath(`/mis-reservas/${reservationId}/contrato`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}
