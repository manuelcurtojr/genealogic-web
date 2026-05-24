/**
 * Tipos + helpers puros para el chat de reservas (importables desde
 * client components).
 */

export type MessageRole = 'client' | 'breeder' | 'system' | 'bot'
export type MessageOrigin = 'panel' | 'email' | 'system' | 'bot'

export type MessageAttachment = {
  url: string
  filename: string
  size: number
  mime_type?: string
}

export type ReservationMessage = {
  id: string
  reservation_id: string
  kennel_id: string
  sender_role: MessageRole
  sender_user_id: string | null
  sender_name: string | null
  sender_email: string | null
  body: string
  attachments: MessageAttachment[]
  origin: MessageOrigin
  read_at_client: string | null
  read_at_breeder: string | null
  source_email_message_id: string | null
  created_at: string
}

export function formatMessageTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
