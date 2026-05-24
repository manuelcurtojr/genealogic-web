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
import { setContractStatus } from '@/lib/contracts/contracts'

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
