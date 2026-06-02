/**
 * Capa de datos del EMBUDO (funnel) — pipelines configurables y sus pasos.
 *
 * Una sola tabla manda el ciclo de vida: `puppy_reservations`, vía
 * (pipeline_id, stage_id). El viejo `status` se mantiene de espejo para no
 * romper el panel del cliente / contratos / pagos durante la transición.
 */
import 'server-only'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

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

/** Siembra (idempotente) los 2 pipelines por defecto si el kennel aún no los tiene. */
export async function ensureDefaultPipelines(admin: Db, kennelId: string): Promise<void> {
  await admin.rpc('ensure_default_pipelines', { p_kennel_id: kennelId })
}

/** Pipelines del kennel con sus pasos ordenados por posición. */
export async function getKennelPipelines(db: Db, kennelId: string): Promise<Pipeline[]> {
  const { data } = await db
    .from('pipelines')
    .select(
      'id, kennel_id, name, slug, position, is_default, ' +
        'stages:pipeline_stages(id, pipeline_id, name, position, type, is_entry, celebrate, loss_reasons, handoff_stage_id, color)',
    )
    .eq('kennel_id', kennelId)
    .order('position', { ascending: true })

  const pipelines = (data || []) as Pipeline[]
  for (const p of pipelines) {
    ;(p.stages || []).sort((a, b) => a.position - b.position)
  }
  return pipelines
}

/** Paso de entrada (is_entry) del pipeline con ese slug — donde caen los leads nuevos. */
export async function getEntryStage(
  admin: Db,
  kennelId: string,
  slug = 'ventas',
): Promise<{ pipelineId: string; stageId: string } | null> {
  const { data: p } = await admin
    .from('pipelines')
    .select('id')
    .eq('kennel_id', kennelId)
    .eq('slug', slug)
    .maybeSingle()
  if (!p) return null
  const { data: s } = await admin
    .from('pipeline_stages')
    .select('id')
    .eq('pipeline_id', p.id)
    .eq('is_entry', true)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()
  return s ? { pipelineId: p.id, stageId: s.id } : null
}

/**
 * Espejo de `status` legacy para los pipelines por defecto, así el panel del
 * cliente / contratos / pagos / trigger de transferencia siguen funcionando.
 * Para pipelines personalizados devuelve null (status deja de ser fuente de
 * verdad; manda stage_id).
 */
export function legacyStatusForStage(slug: string | null, name: string): string | null {
  if (slug === 'ventas') {
    const m: Record<string, string> = {
      Interesados: 'interested',
      'En seguimiento': 'waitlisted',
      'Venta perdida': 'lost',
    }
    return m[name] ?? null
  }
  if (slug === 'reservas') {
    const m: Record<string, string> = {
      'Reserva en firme': 'deposit_paid',
      'Perro seleccionado': 'assigned',
      'En espera': 'waitlisted',
      'Pendiente de entrega': 'contract_signed',
      Entregado: 'delivered',
      'Reserva cancelada': 'cancelled',
    }
    return m[name] ?? null
  }
  return null
}

/** Columna de timestamp de hito a sellar según el status legacy. */
export function milestoneColumnForStatus(status: string | null): string | null {
  switch (status) {
    case 'deposit_paid':
      return 'deposit_paid_at'
    case 'assigned':
      return 'assigned_at'
    case 'contract_signed':
      return 'contract_signed_at'
    case 'delivered':
      return 'delivered_at'
    case 'cancelled':
      return 'cancelled_at'
    default:
      return null
  }
}
