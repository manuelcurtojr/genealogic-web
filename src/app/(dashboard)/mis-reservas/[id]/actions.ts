/**
 * Server actions del panel del cliente para una reserva.
 * Por ahora: enviar mensaje al criador.
 */
'use server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { insertMessage } from '@/lib/reservations/messages'

export async function sendClientMessageAction(
  reservationId: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!body || !body.trim()) return { ok: false, error: 'Mensaje vacío' }
    if (body.length > 4000) return { ok: false, error: 'Mensaje demasiado largo (max 4000 chars)' }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Sesión no válida' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: reservation } = await admin
      .from('puppy_reservations')
      .select('id, kennel_id, client_user_id, applicant_name')
      .eq('id', reservationId)
      .maybeSingle()

    if (!reservation) return { ok: false, error: 'Reserva no encontrada' }
    if (reservation.client_user_id !== user.id) return { ok: false, error: 'Sin permiso' }

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    await insertMessage({
      reservationId: reservation.id,
      kennelId: reservation.kennel_id,
      senderRole: 'client',
      senderUserId: user.id,
      senderName: profile?.full_name || reservation.applicant_name || user.email || 'Cliente',
      senderEmail: user.email ?? null,
      body: body.trim(),
      origin: 'panel',
    })

    revalidatePath(`/mis-reservas/${reservationId}`)
    revalidatePath(`/reservas/${reservationId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}
