/**
 * Tipos compartidos del Embudo (cliente + servidor). SIN 'server-only' para
 * poder importarlos desde componentes cliente.
 */
export type StageType = 'normal' | 'won' | 'lost'

export type Stage = {
  id: string
  pipeline_id: string
  name: string
  position: number
  type: StageType
  is_entry: boolean
  celebrate: boolean
  loss_reasons: string[]
  handoff_stage_id: string | null
  color: string | null
}

export type Pipeline = {
  id: string
  kennel_id: string
  name: string
  slug: string | null
  position: number
  is_default: boolean
  stages: Stage[]
}

export type FunnelEntry = {
  id: string
  applicant_name: string | null
  applicant_email: string | null
  applicant_phone: string | null
  applicant_message: string | null
  preference_sex: string | null
  created_at: string
  status: string | null
  pipeline_id: string | null
  stage_id: string | null
  seen_by_breeder_at: string | null
  lost_reason: string | null
  client_user_id: string | null
  origin_entry_id: string | null
}

export type MoveResult =
  | { ok: true; celebrate: boolean; cloned: boolean }
  | { ok: false; error: string; needLossReason?: boolean; reasons?: string[] }
