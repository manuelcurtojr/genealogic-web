/**
 * Tipos del sistema de Content Reports (notice-and-action).
 * Importables desde client y server.
 *
 * Espejo de la tabla public.content_reports — migración 20260629_content_reports.sql.
 */

export type ReportTargetType =
  | 'dog' | 'photo' | 'kennel' | 'user' | 'comment'
  | 'message' | 'litter' | 'other'

export type ReportReason =
  | 'copyright'
  | 'personal_data'
  | 'inaccurate'
  | 'inappropriate'
  | 'impersonation'
  | 'animal_welfare'
  | 'duplicate'
  | 'other'

export type ReportStatus =
  | 'open'
  | 'reviewing'
  | 'resolved_removed'
  | 'resolved_kept'
  | 'rejected'
  | 'duplicate_report'

export type ContentReport = {
  id: string
  created_at: string
  reporter_user_id: string | null
  reporter_email: string | null
  reporter_name: string | null
  reporter_ip: string | null
  reporter_user_agent: string | null
  target_type: ReportTargetType
  target_id: string
  target_url: string | null
  reason: ReportReason
  description: string
  is_rights_holder: boolean
  rights_holder_declaration: boolean
  contact_info: string | null
  status: ReportStatus
  resolved_at: string | null
  resolved_by: string | null
  resolution_notes: string | null
  resolution_action: string | null
  metadata: Record<string, unknown>
}

// ─── Labels y colores para UI ───────────────────────────────────────────────

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  copyright: 'Copyright',
  personal_data: 'Datos personales (RGPD)',
  inaccurate: 'Información incorrecta',
  inappropriate: 'Contenido inapropiado',
  impersonation: 'Suplantación',
  animal_welfare: 'Bienestar animal',
  duplicate: 'Duplicado',
  other: 'Otro',
}

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  dog: 'Perro',
  photo: 'Foto',
  kennel: 'Criadero',
  user: 'Usuario',
  comment: 'Comentario',
  message: 'Mensaje',
  litter: 'Camada',
  other: 'Otro',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Abierto',
  reviewing: 'En revisión',
  resolved_removed: 'Resuelto · Retirado',
  resolved_kept: 'Resuelto · Mantenido',
  rejected: 'Rechazado',
  duplicate_report: 'Duplicado',
}

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  open: 'bg-amber-100 text-amber-900 border-amber-200',
  reviewing: 'bg-blue-100 text-blue-900 border-blue-200',
  resolved_removed: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  resolved_kept: 'bg-gray-100 text-gray-700 border-gray-200',
  rejected: 'bg-red-100 text-red-900 border-red-200',
  duplicate_report: 'bg-purple-100 text-purple-900 border-purple-200',
}

// Estados considerados "abiertos" (necesitan acción)
export const OPEN_STATUSES: ReportStatus[] = ['open', 'reviewing']
export const RESOLVED_STATUSES: ReportStatus[] = [
  'resolved_removed', 'resolved_kept', 'rejected', 'duplicate_report',
]

/** Plazo legal LSSI art. 17 — informativo para la UI */
export const SLA_HOURS = 72
