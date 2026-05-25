/**
 * Tipos del sistema de Admin Requests (soporte + claims).
 * Importables desde client y server.
 */

export type AdminRequestType = 'support' | 'claim_dog' | 'claim_kennel'

export type AdminRequestStatus =
  | 'pending'
  | 'reviewing'
  | 'awaiting_user'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export type AdminRequestPriority = 'low' | 'normal' | 'high' | 'urgent'

export type AdminRequestSource =
  | 'manual'
  | 'chatbot'
  | 'kennel_page'
  | 'dog_page'
  | 'soporte_form'
  | 'api'

export type EvidenceFile = {
  path: string
  filename: string
  size: number
  mime: string
  uploaded_at: string
  label?: string
}

export type AdminRequest = {
  id: string
  type: AdminRequestType
  status: AdminRequestStatus
  priority: AdminRequestPriority
  requester_user_id: string | null
  requester_email: string
  requester_name: string | null
  target_kennel_id: string | null
  target_dog_id: string | null
  subject: string
  message: string
  evidence: EvidenceFile[]
  source: AdminRequestSource
  source_url: string | null
  source_metadata: Record<string, unknown>
  assigned_admin_id: string | null
  admin_notes: string | null
  resolution_note: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  resolved_by_admin_id: string | null
}

export type AdminRequestMessage = {
  id: string
  request_id: string
  author_user_id: string | null
  author_is_admin: boolean
  body: string
  attachments: EvidenceFile[]
  created_at: string
}

// Labels para UI
export const TYPE_LABELS: Record<AdminRequestType, string> = {
  support: 'Soporte',
  claim_dog: 'Reclamar perro',
  claim_kennel: 'Reclamar criadero',
}

export const STATUS_LABELS: Record<AdminRequestStatus, string> = {
  pending: 'Pendiente',
  reviewing: 'En revisión',
  awaiting_user: 'Esperando al user',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
}

export const PRIORITY_LABELS: Record<AdminRequestPriority, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
}

export const STATUS_COLORS: Record<AdminRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  reviewing: 'bg-blue-100 text-blue-900 border-blue-200',
  awaiting_user: 'bg-purple-100 text-purple-900 border-purple-200',
  approved: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  rejected: 'bg-red-100 text-red-900 border-red-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
}

export const PRIORITY_COLORS: Record<AdminRequestPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-50 text-blue-800',
  high: 'bg-amber-100 text-amber-900',
  urgent: 'bg-red-100 text-red-900',
}
