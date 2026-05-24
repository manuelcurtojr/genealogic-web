/**
 * Helpers server-only para `reservation_messages`.
 * Tipos compartidos en `./messages-shared.ts`.
 */
import 'server-only'
import { cache } from 'react'
import { createKennelAdminClient } from '@/lib/supabase/server'
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

/** Inserta un mensaje. El caller DEBE haber validado permisos. */
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
  return data as ReservationMessage
}
