/**
 * Server actions para enriquecer una reserva SIN tocar el esquema: se guardan
 * dentro de `applicant_extra_data` (jsonb ya existente).
 *
 *  - Notas del criador: array `_notes` = [{ id, at, body }]. Cada nota es
 *    independiente y lleva su fecha (mejor que un único campo de texto).
 *  - Raza(s) de interés: clave `preference_breed` = { label, value } — LA MISMA
 *    que rellena el cliente en el formulario de contacto, así el campo del
 *    criador y el del cliente quedan sincronizados.
 *
 * La clave `_notes` (prefijo "_") se filtra de la vista "Respuestas del
 * formulario" para que no se mezcle con lo que rellenó el cliente.
 */
'use server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

type Extra = Record<string, unknown>

async function assertOwner(reservationId: string): Promise<{
  userId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any
  extra: Extra
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: reservation } = await admin
    .from('puppy_reservations')
    .select('id, applicant_extra_data, kennel:kennels(owner_id)')
    .eq('id', reservationId)
    .maybeSingle()
  if (!reservation) throw new Error('reservation_not_found')
  if (reservation.kennel?.owner_id !== user.id) throw new Error('forbidden')
  const extra = (reservation.applicant_extra_data && typeof reservation.applicant_extra_data === 'object')
    ? (reservation.applicant_extra_data as Extra)
    : {}
  return { userId: user.id, admin, extra }
}

function revalidate(reservationId: string) {
  revalidatePath('/embudo')
  revalidatePath(`/reservas/${reservationId}`)
}

type NoteRow = { id: string; at: string; body: string; editedAt?: string }

/** Añade una nota independiente con su fecha. Devuelve la nota creada (id real). */
export async function addReservationNote(
  reservationId: string,
  body: string,
): Promise<{ ok: true; note: NoteRow } | { ok: false; error: string }> {
  try {
    const text = (body || '').trim()
    if (!text) return { ok: false, error: 'Nota vacía' }
    const { admin, extra } = await assertOwner(reservationId)
    const note: NoteRow = { id: randomUUID(), at: new Date().toISOString(), body: text }
    const notes = Array.isArray(extra._notes) ? [...(extra._notes as unknown[])] : []
    notes.push(note)
    await admin.from('puppy_reservations')
      .update({ applicant_extra_data: { ...extra, _notes: notes } })
      .eq('id', reservationId)
    revalidate(reservationId)
    return { ok: true, note }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'error' }
  }
}

/** Edita el texto de una nota existente (marca editedAt). */
export async function editReservationNote(
  reservationId: string,
  noteId: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const text = (body || '').trim()
    if (!text) return { ok: false, error: 'Nota vacía' }
    const { admin, extra } = await assertOwner(reservationId)
    const notes = (Array.isArray(extra._notes) ? (extra._notes as NoteRow[]) : [])
      .map((n) => (n.id === noteId ? { ...n, body: text, editedAt: new Date().toISOString() } : n))
    await admin.from('puppy_reservations')
      .update({ applicant_extra_data: { ...extra, _notes: notes } })
      .eq('id', reservationId)
    revalidate(reservationId)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'error' }
  }
}

/** Borra una nota por id. */
export async function deleteReservationNote(
  reservationId: string,
  noteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { admin, extra } = await assertOwner(reservationId)
    const notes = (Array.isArray(extra._notes) ? (extra._notes as Array<{ id: string }>) : [])
      .filter((n) => n.id !== noteId)
    await admin.from('puppy_reservations')
      .update({ applicant_extra_data: { ...extra, _notes: notes } })
      .eq('id', reservationId)
    revalidate(reservationId)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'error' }
  }
}

/**
 * Fija la(s) raza(s) de interés. Guarda en la MISMA clave que el formulario
 * de contacto (`preference_breed`) para mantener la sincronía: value es un
 * string si hay una sola raza (formato del form) o un array si hay varias.
 */
export async function setReservationBreeds(
  reservationId: string,
  breeds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const clean = (breeds || []).map((s) => (s || '').trim()).filter(Boolean)
    const { admin, extra } = await assertOwner(reservationId)
    const next: Extra = { ...extra }
    if (clean.length === 0) {
      delete next.preference_breed
    } else {
      next.preference_breed = { label: 'Raza de interés', value: clean.length === 1 ? clean[0] : clean }
    }
    await admin.from('puppy_reservations')
      .update({ applicant_extra_data: next })
      .eq('id', reservationId)
    revalidate(reservationId)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'error' }
  }
}
