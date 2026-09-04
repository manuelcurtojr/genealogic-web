/**
 * Tipos del CRM de marketing interno (growth backend, solo-admin).
 * Los stages del embudo de adquisición de criadores son FIJOS (no configurables
 * por UI como el motor de pipelines de reservas), así que viven aquí.
 */

export const LEAD_STAGES = [
  { key: 'nuevo', label: 'Nuevo', color: '#64748b', hint: 'Sin contactar' },
  { key: 'contactado', label: 'Contactado', color: '#3b82f6', hint: 'Email enviado' },
  { key: 'respondio', label: 'Respondió', color: '#8b5cf6', hint: 'Conversación abierta' },
  { key: 'registrado', label: 'Registrado', color: '#f59e0b', hint: 'Creó cuenta' },
  { key: 'activado', label: 'Activado', color: '#10b981', hint: 'Usó el producto' },
  { key: 'pro', label: 'Pro', color: '#059669', hint: 'Cliente de pago' },
  { key: 'perdido', label: 'Perdido', color: '#ef4444', hint: 'Descartado / baja' },
] as const

export type LeadStage = (typeof LEAD_STAGES)[number]['key']

export const LEAD_SOURCES = [
  { key: 'db_troya', label: 'Ya en la DB (Troya)' },
  { key: 'directorio_club', label: 'Directorio de club' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'web', label: 'Web' },
  { key: 'referido', label: 'Referido' },
  { key: 'manual', label: 'Manual' },
  { key: 'otro', label: 'Otro' },
] as const

export type LeadSource = (typeof LEAD_SOURCES)[number]['key']

export function stageMeta(key: string) {
  return LEAD_STAGES.find((s) => s.key === key) ?? LEAD_STAGES[0]
}
export function sourceLabel(key: string) {
  return LEAD_SOURCES.find((s) => s.key === key)?.label ?? key
}

export interface MarketingLead {
  id: string
  kennel_name: string | null
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  instagram: string | null
  country: string | null
  region: string | null
  breed_focus: string | null
  stage: LeadStage
  source: LeadSource
  source_detail: string | null
  lost_reason: string | null
  matched_kennel_id: string | null
  matched_user_id: string | null
  priority: number
  next_action_at: string | null
  last_contacted_at: string | null
  internal_note: string | null
  created_at: string
  updated_at: string
}

export interface LeadEvent {
  id: string
  lead_id: string
  type: string
  detail: string | null
  payload: Record<string, unknown>
  occurred_at: string
}

export interface LeadMessage {
  id: string
  lead_id: string
  direction: 'out' | 'in'
  subject: string | null
  body: string | null
  gmail_thread_id: string | null
  status: string
  sent_at: string | null
  created_at: string
}

/** Estado de activación en vivo, cruzando el lead con los datos de producto. */
export interface LeadActivation {
  claimed: boolean
  registeredAt: string | null
  plan: string | null
  lastSeenAt: string | null
  dogsTotal: number
  dogsImported: number
  dogsClaimed: number
}
