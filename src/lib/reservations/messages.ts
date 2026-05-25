/**
 * Helpers server-only para `reservation_messages`.
 * Tipos compartidos en `./messages-shared.ts`.
 */
import 'server-only'
import { cache } from 'react'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { sendTransactionalEmail } from '@/lib/email/send'
import type {
  MessageRole,
  MessageOrigin,
  MessageAttachment,
  ReservationMessage,
} from './messages-shared'

export type { MessageRole, MessageOrigin, MessageAttachment, ReservationMessage }
export { formatMessageTime } from './messages-shared'

/** Lista los mensajes de una reserva en orden cronológico. */
export const listReservationMessages = cache(
  async (reservationId: string): Promise<ReservationMessage[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data } = await admin
      .from('reservation_messages')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: true })
    return (data as ReservationMessage[]) ?? []
  },
)

/** Cuenta mensajes no leídos para un rol concreto en una reserva. */
export async function countUnread(
  reservationId: string,
  role: 'client' | 'breeder',
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const readCol = role === 'client' ? 'read_at_client' : 'read_at_breeder'
  const otherRole = role === 'client' ? 'breeder' : 'client'
  const { count } = await admin
    .from('reservation_messages')
    .select('id', { count: 'exact', head: true })
    .eq('reservation_id', reservationId)
    .eq('sender_role', otherRole)
    .is(readCol, null)
  return count ?? 0
}

/** Marca todos los mensajes del rol opuesto como leídos para este rol. */
export async function markThreadRead(
  reservationId: string,
  role: 'client' | 'breeder',
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const readCol = role === 'client' ? 'read_at_client' : 'read_at_breeder'
  const otherRole = role === 'client' ? 'breeder' : 'client'
  await admin
    .from('reservation_messages')
    .update({ [readCol]: new Date().toISOString() })
    .eq('reservation_id', reservationId)
    .eq('sender_role', otherRole)
    .is(readCol, null)
}

/** Inserta un mensaje. El caller DEBE haber validado permisos.
 *  Tras insert, dispara (best-effort) un email a la otra parte del hilo. */
export async function insertMessage(args: {
  reservationId: string
  kennelId: string
  senderRole: MessageRole
  senderUserId: string | null
  senderName: string | null
  senderEmail?: string | null
  body: string
  attachments?: MessageAttachment[]
  origin?: MessageOrigin
}): Promise<ReservationMessage> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data, error } = await admin
    .from('reservation_messages')
    .insert({
      reservation_id: args.reservationId,
      kennel_id: args.kennelId,
      sender_role: args.senderRole,
      sender_user_id: args.senderUserId,
      sender_name: args.senderName,
      sender_email: args.senderEmail ?? null,
      body: args.body,
      attachments: args.attachments ?? [],
      origin: args.origin ?? 'panel',
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  const inserted = data as ReservationMessage

  // ─── Email a la otra parte (best-effort, async, no bloquea) ───
  ;(async () => {
    try {
      // Buscar email del destinatario según el rol del sender
      const { data: reservation } = await admin
        .from('puppy_reservations')
        .select(`
          id, applicant_email, applicant_name, client_user_id,
          kennel:kennels(id, name, owner_id)
        `)
        .eq('id', args.reservationId)
        .single()
      if (!reservation) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kennel: any = reservation.kennel
      const isSenderBreeder = args.senderRole === 'breeder'

      if (isSenderBreeder) {
        // Email al cliente
        const toEmail = reservation.applicant_email
        if (!toEmail) return
        await sendTransactionalEmail(
          toEmail,
          {
            template: 'message_new',
            props: {
              recipientName: reservation.applicant_name || null,
              senderName: args.senderName || kennel?.name || 'El criador',
              preview: args.body,
              reservationId: args.reservationId,
              recipientIsBreeder: false,
            },
          },
          {
            userId: reservation.client_user_id || undefined,
            dedupeKey: `msg_email:${inserted.id}`,
          },
        )
      } else {
        // Email al criador
        if (!kennel?.owner_id) return
        const { data: ownerProfile } = await admin
          .from('profiles')
          .select('id, display_name, email')
          .eq('id', kennel.owner_id)
          .maybeSingle()
        if (!ownerProfile?.email) return
        await sendTransactionalEmail(
          ownerProfile.email,
          {
            template: 'message_new',
            props: {
              recipientName: ownerProfile.display_name || null,
              senderName: args.senderName || reservation.applicant_name || 'El cliente',
              preview: args.body,
              reservationId: args.reservationId,
              recipientIsBreeder: true,
            },
          },
          {
            userId: ownerProfile.id,
            dedupeKey: `msg_email:${inserted.id}`,
          },
        )
      }
    } catch (err) {
      console.error('[email] message_new failed', err)
    }
  })()

  return inserted
}
