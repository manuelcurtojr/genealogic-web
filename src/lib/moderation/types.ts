/**
 * Tipos del sistema de moderación (soft-hide reversible).
 * Importable desde client y server.
 */

export type ModerateTargetType = 'dog' | 'kennel'

export type ModerateAction = 'hide' | 'unhide'

export type HiddenReason =
  | 'rgpd_request'
  | 'copyright'
  | 'inaccurate'
  | 'inappropriate'
  | 'impersonation'
  | 'animal_welfare'
  | 'duplicate'
  | 'owner_request'
  | 'admin_decision'
  | 'other'

export const HIDDEN_REASON_LABELS: Record<HiddenReason, string> = {
  rgpd_request: 'Solicitud RGPD (titular)',
  copyright: 'Copyright',
  inaccurate: 'Información incorrecta',
  inappropriate: 'Contenido inapropiado',
  impersonation: 'Suplantación',
  animal_welfare: 'Bienestar animal',
  duplicate: 'Duplicado',
  owner_request: 'Petición del propietario',
  admin_decision: 'Decisión administrativa',
  other: 'Otro',
}

export const HIDDEN_REASON_BADGE_COLORS: Record<HiddenReason, string> = {
  rgpd_request: 'bg-blue-100 text-blue-900 border-blue-200',
  copyright: 'bg-amber-100 text-amber-900 border-amber-200',
  inaccurate: 'bg-orange-100 text-orange-900 border-orange-200',
  inappropriate: 'bg-red-100 text-red-900 border-red-200',
  impersonation: 'bg-red-100 text-red-900 border-red-200',
  animal_welfare: 'bg-red-100 text-red-900 border-red-200',
  duplicate: 'bg-purple-100 text-purple-900 border-purple-200',
  owner_request: 'bg-gray-100 text-gray-700 border-gray-200',
  admin_decision: 'bg-gray-100 text-gray-700 border-gray-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
}

export const TARGET_TYPE_LABELS: Record<ModerateTargetType, string> = {
  dog: 'Perro',
  kennel: 'Criadero',
}

export type HiddenRecord = {
  id: string
  hidden_at: string
  hidden_reason: HiddenReason
  hidden_by: string | null
  hidden_report_id: string | null
  hidden_notes: string | null
}
