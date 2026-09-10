'use server'

/**
 * Acciones de FICHEROS de contrato de una reserva (PDFs en el bucket `contracts`).
 *  - addUploadedContractAction: registra un contrato SUBIDO (escaneo de papel).
 *  - setContractPdfAction: guarda el pdf_url de un contrato tras autogenerarlo.
 *  - deleteUploadedContractAction: borra un contrato SUBIDO.
 *
 * El fichero se sube/borra CLIENT-SIDE (la sesión del criador, con RLS de storage);
 * aquí solo tocamos la fila de reservation_contracts con service-role, tras
 * verificar que el criador es dueño del kennel de la reserva.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertOwner(reservationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Sesión no válida' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: r } = await admin
    .from('puppy_reservations')
    .select('id, kennel_id, kennel:kennels(owner_id)')
    .eq('id', reservationId)
    .maybeSingle()
  if (!r) return { ok: false as const, error: 'Reserva no encontrada' }
  if (r.kennel?.owner_id !== user.id) return { ok: false as const, error: 'Sin permiso' }
  return { ok: true as const, user, admin, reservation: r as { id: string; kennel_id: string } }
}

/** El path debe caer bajo contracts/<owner_uid>/<reservation_id>/ (RLS de storage
 *  = carpeta por uid del dueño; anti-abuso). */
function pathOk(path: string, ownerUid: string, reservationId: string): boolean {
  return typeof path === 'string' && path.startsWith(`${ownerUid}/${reservationId}/`)
}

export async function addUploadedContractAction(input: {
  reservationId: string
  path: string
  filename: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await assertOwner(input.reservationId)
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { admin, user, reservation } = ctx
  if (!pathOk(input.path, user.id, reservation.id)) return { ok: false, error: 'Ruta inválida' }

  const title = (input.filename || '').replace(/\.pdf$/i, '').trim() || 'Contrato firmado'
  const { error } = await admin.from('reservation_contracts').insert({
    reservation_id: reservation.id,
    kennel_id: reservation.kennel_id,
    kind: 'reservation',
    title,
    status: 'signed_full',
    is_uploaded: true,
    original_filename: input.filename || null,
    pdf_url: input.path,
    pdf_generated_at: new Date().toISOString(),
    created_by: user.id,
    preview_token: crypto.randomUUID(),
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/reservas/${reservation.id}`)
  return { ok: true }
}

export async function setContractPdfAction(
  contractId: string,
  reservationId: string,
  path: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await assertOwner(reservationId)
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { admin, user, reservation } = ctx
  if (!pathOk(path, user.id, reservation.id)) return { ok: false, error: 'Ruta inválida' }

  const { error } = await admin
    .from('reservation_contracts')
    .update({ pdf_url: path, pdf_generated_at: new Date().toISOString() })
    .eq('id', contractId)
    .eq('reservation_id', reservation.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/reservas/${reservation.id}`)
  return { ok: true }
}

export async function deleteUploadedContractAction(
  contractId: string,
  reservationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await assertOwner(reservationId)
  if (!ctx.ok) return { ok: false, error: ctx.error }
  const { admin, reservation } = ctx
  // Solo se borran desde aquí los contratos SUBIDOS (los de Genealogic tienen
  // su propio ciclo de vida en el flujo de contratos).
  const { error } = await admin
    .from('reservation_contracts')
    .delete()
    .eq('id', contractId)
    .eq('reservation_id', reservation.id)
    .eq('is_uploaded', true)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/reservas/${reservation.id}`)
  return { ok: true }
}
