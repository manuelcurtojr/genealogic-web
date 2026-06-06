/**
 * Helpers para el panel del propietario (cliente).
 *
 * Las reservas del cliente viven en `puppy_reservations.client_user_id`.
 * Una reserva activa puede tener cualquier status != 'delivered' && != 'cancelled'.
 */
import 'server-only'
import { cache } from 'react'
import { createKennelAdminClient } from '@/lib/supabase/server'

export type ClientReservation = {
  id: string
  status: string
  preference_sex: 'male' | 'female' | 'any' | null
  preference_color: string | null
  preference_notes: string | null
  deposit_amount_cents: number | null
  total_price_cents: number | null
  currency: string
  deposit_paid_at: string | null
  paid_in_full_at: string | null
  contract_signed_at: string | null
  delivered_at: string | null
  dog_id: string | null
  position_in_queue: number | null
  applicant_name: string | null
  applicant_email: string | null
  applicant_message: string | null
  applicant_purpose: string | null
  applicant_extra_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
  /** Si la reserva es un clon hecho por handoff entre pipelines, apunta al
   *  id de la reserva original. Usado para deduplicar en /mis-reservas. */
  origin_entry_id: string | null
  // Joins
  kennel: { id: string; slug: string; name: string; logo_url: string | null } | null
  dog: { id: string; slug: string; name: string; thumbnail_url: string | null } | null
  litter: { id: string; expected_date: string | null; birth_date: string | null } | null
  /** Estado de los contratos de esta reserva (reserva + entrega). */
  contracts: Array<{
    kind: 'reservation' | 'delivery'
    status: 'draft' | 'sent' | 'signed_partial' | 'signed_full' | 'cancelled'
    signed_at_breeder: string | null
    signed_at_client: string | null
  }>
}

const SELECT_COLS = `
  id, status, preference_sex, preference_color, preference_notes,
  deposit_amount_cents, total_price_cents, currency,
  deposit_paid_at, paid_in_full_at, contract_signed_at, delivered_at,
  dog_id, position_in_queue,
  applicant_name, applicant_email, applicant_message, applicant_purpose, applicant_extra_data,
  created_at, updated_at, origin_entry_id,
  kennel:kennels(id, slug, name, logo_url),
  dog:dogs!dog_id(id, slug, name, thumbnail_url),
  litter:litters(id, expected_date, birth_date),
  contracts:reservation_contracts(kind, status, signed_at_breeder, signed_at_client)
`

const ACTIVE_STATUSES = ['interested', 'waitlisted', 'deposit_paid', 'assigned', 'contract_signed', 'paid_in_full']
const ARCHIVED_STATUSES = ['delivered', 'cancelled']

/**
 * Dedupe pipeline handoffs: cuando el criador mueve un lead a un stage con
 * `handoff_stage_id` (típicamente "Venta ganada" en Ventas → "Reserva en
 * firme" en Reservas en firme), el sistema CLONA la reserva al pipeline
 * destino (ver src/lib/pipelines/actions.ts:130). Para el cliente eso son 2
 * filas idénticas: la original sigue en el pipeline de captación, el clon
 * vive en el operativo.
 *
 * En /mis-reservas del cliente solo queremos mostrar UNA: el clon (la "viva"
 * en el flujo operativo). Si una fila X tiene una hija Y con
 * `origin_entry_id = X`, ocultamos X y mantenemos Y.
 *
 * Solo aplica al lado cliente — en /embudo del criador cada pipeline muestra
 * sus filas y la separación es deliberada.
 */
function dedupeHandoffClones<T extends { id: string; origin_entry_id?: string | null }>(rows: T[]): T[] {
  const originIds = new Set(
    rows.map((r) => r.origin_entry_id).filter((v): v is string => !!v),
  )
  return rows.filter((r) => !originIds.has(r.id))
}

/** Fetch del listado (activas o histórico) con el mismo fallback robusto
 *  de getMyReservation: si el embed PostgREST peta, hace SELECT base y
 *  resuelve los joins en lookups separados. */
async function listReservationsWithFallback(
  userId: string,
  statuses: string[],
  orderCol: 'created_at' | 'updated_at',
): Promise<ClientReservation[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data, error } = await admin
    .from('puppy_reservations')
    .select(SELECT_COLS)
    .eq('client_user_id', userId)
    .in('status', statuses)
    .order(orderCol, { ascending: false })

  if (!error && data) return dedupeHandoffClones(data) as ClientReservation[]

  if (error) {
    console.error('[listReservationsWithFallback] embed query failed, falling back', error.message)
  }

  // Fallback sin embeds
  const { data: bases, error: baseErr } = await admin
    .from('puppy_reservations')
    .select(`
      id, status, preference_sex, preference_color, preference_notes,
      deposit_amount_cents, total_price_cents, currency,
      deposit_paid_at, paid_in_full_at, contract_signed_at, delivered_at,
      dog_id, kennel_id, litter_id, position_in_queue,
      applicant_name, applicant_email, applicant_message, applicant_purpose, applicant_extra_data,
      created_at, updated_at, origin_entry_id
    `)
    .eq('client_user_id', userId)
    .in('status', statuses)
    .order(orderCol, { ascending: false })
  if (baseErr || !bases) {
    if (baseErr) console.error('[listReservationsWithFallback] base query failed', baseErr.message)
    return []
  }

  // Resolver lookups en batch (un solo IN por tabla)
  const kennelIds = Array.from(new Set(bases.map((b: { kennel_id: string | null }) => b.kennel_id).filter(Boolean)))
  const dogIds = Array.from(new Set(bases.map((b: { dog_id: string | null }) => b.dog_id).filter(Boolean)))
  const litterIds = Array.from(new Set(bases.map((b: { litter_id: string | null }) => b.litter_id).filter(Boolean)))
  const reservationIds = bases.map((b: { id: string }) => b.id)

  const [kRes, dRes, lRes, cRes] = await Promise.all([
    kennelIds.length ? admin.from('kennels').select('id, slug, name, logo_url').in('id', kennelIds) : { data: [] },
    dogIds.length ? admin.from('dogs').select('id, slug, name, thumbnail_url').in('id', dogIds) : { data: [] },
    litterIds.length ? admin.from('litters').select('id, expected_date, birth_date').in('id', litterIds) : { data: [] },
    admin.from('reservation_contracts')
      .select('reservation_id, kind, status, signed_at_breeder, signed_at_client')
      .in('reservation_id', reservationIds),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kennelById = new Map((kRes.data || []).map((k: any) => [k.id, k]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dogById = new Map((dRes.data || []).map((d: any) => [d.id, d]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const litterById = new Map((lRes.data || []).map((l: any) => [l.id, l]))
  const contractsByRes = new Map<string, ClientReservation['contracts']>()
  for (const c of ((cRes.data || []) as Array<{ reservation_id: string } & ClientReservation['contracts'][number]>)) {
    const arr = contractsByRes.get(c.reservation_id) || []
    arr.push({ kind: c.kind, status: c.status, signed_at_breeder: c.signed_at_breeder, signed_at_client: c.signed_at_client })
    contractsByRes.set(c.reservation_id, arr)
  }

  const hydrated = bases.map((b: { id: string; kennel_id: string | null; dog_id: string | null; litter_id: string | null; origin_entry_id?: string | null }) => ({
    ...b,
    kennel: b.kennel_id ? kennelById.get(b.kennel_id) ?? null : null,
    dog: b.dog_id ? dogById.get(b.dog_id) ?? null : null,
    litter: b.litter_id ? litterById.get(b.litter_id) ?? null : null,
    contracts: contractsByRes.get(b.id) || [],
  })) as ClientReservation[]
  return dedupeHandoffClones(hydrated)
}

/**
 * Reservas activas del cliente (NO histórico).
 * Ordenadas por created_at desc.
 */
export const getMyActiveReservations = cache(async (userId: string): Promise<ClientReservation[]> => {
  return listReservationsWithFallback(userId, ACTIVE_STATUSES, 'created_at')
})

/**
 * Histórico de reservas del cliente (delivered + cancelled).
 */
export const getMyHistoricalReservations = cache(async (userId: string): Promise<ClientReservation[]> => {
  return listReservationsWithFallback(userId, ARCHIVED_STATUSES, 'updated_at')
})

/**
 * Una reserva específica si el cliente tiene acceso. RLS hace doble check.
 *
 * Robusto a fallos del embed Supabase (`dog:dogs!dog_id`, `contracts:...`):
 * si el SELECT con embeds peta (FK ambigua, sintaxis, etc.) hacemos un
 * fallback con SELECT base + fetches separados para dog/litter/contracts.
 * Antes el error se tragaba silenciosamente con `?? null` → la página
 * caía a 404 sin pista.
 */
export const getMyReservation = cache(
  async (userId: string, reservationId: string): Promise<ClientReservation | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any

    // 1) Intentar el SELECT completo con embeds (rápido, 1 round-trip)
    const { data, error } = await admin
      .from('puppy_reservations')
      .select(SELECT_COLS)
      .eq('client_user_id', userId)
      .eq('id', reservationId)
      .maybeSingle()
    if (!error && data) return data as ClientReservation

    if (error) {
      console.error('[getMyReservation] embed query failed, falling back', error.message)
    }

    // 2) Fallback: SELECT base sin embeds + lookups separados.
    //    Sirve para casos donde el embed PostgREST falla (FK ambigua, etc.)
    const { data: base, error: baseErr } = await admin
      .from('puppy_reservations')
      .select(`
        id, status, preference_sex, preference_color, preference_notes,
        deposit_amount_cents, total_price_cents, currency,
        deposit_paid_at, paid_in_full_at, contract_signed_at, delivered_at,
        dog_id, kennel_id, litter_id, position_in_queue,
        applicant_name, applicant_email, applicant_message, applicant_purpose, applicant_extra_data,
        created_at, updated_at
      `)
      .eq('client_user_id', userId)
      .eq('id', reservationId)
      .maybeSingle()
    if (baseErr || !base) {
      if (baseErr) console.error('[getMyReservation] base query failed', baseErr.message)
      return null
    }

    // Lookups paralelos
    const [kennelRes, dogRes, litterRes, contractsRes] = await Promise.all([
      base.kennel_id
        ? admin.from('kennels').select('id, slug, name, logo_url').eq('id', base.kennel_id).maybeSingle()
        : Promise.resolve({ data: null }),
      base.dog_id
        ? admin.from('dogs').select('id, slug, name, thumbnail_url').eq('id', base.dog_id).maybeSingle()
        : Promise.resolve({ data: null }),
      base.litter_id
        ? admin.from('litters').select('id, expected_date, birth_date').eq('id', base.litter_id).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.from('reservation_contracts')
        .select('kind, status, signed_at_breeder, signed_at_client')
        .eq('reservation_id', base.id),
    ])

    return {
      ...base,
      kennel: kennelRes.data ?? null,
      dog: dogRes.data ?? null,
      litter: litterRes.data ?? null,
      contracts: (contractsRes.data ?? []) as ClientReservation['contracts'],
    } as ClientReservation
  },
)

// ─── Helpers de presentación ──────────────────────────────────────────────

export type StatusMeta = {
  label: string
  color: 'gray' | 'amber' | 'blue' | 'violet' | 'emerald' | 'red'
  description: string
}

export const STATUS_META: Record<string, StatusMeta> = {
  interested: {
    label: 'Solicitud enviada',
    color: 'gray',
    description: 'Tu solicitud está en la bandeja del criador. Te responderá en cuanto pueda.',
  },
  waitlisted: {
    label: 'Lista de espera',
    color: 'amber',
    description: 'El criador te ha puesto en lista para la próxima camada.',
  },
  deposit_paid: {
    label: 'Seña recibida',
    color: 'blue',
    description: 'El criador ha confirmado que recibió tu seña. A la espera del cachorro.',
  },
  assigned: {
    label: 'Cachorro asignado',
    color: 'violet',
    description: 'Un cachorro concreto ya tiene tu nombre. Próximo paso: firmar el contrato de entrega.',
  },
  contract_signed: {
    label: 'Contrato firmado',
    color: 'violet',
    description: 'Contrato firmado por ambas partes. Próximo paso: pago final.',
  },
  paid_in_full: {
    label: 'Pagado',
    color: 'emerald',
    description: 'Pago completo realizado. Preparando la entrega.',
  },
  delivered: {
    label: 'Cachorro entregado',
    color: 'emerald',
    description: '¡Ya está en casa! Disfruta de cada momento.',
  },
  cancelled: {
    label: 'Cancelada',
    color: 'red',
    description: 'Esta reserva fue cancelada.',
  },
}

// ─── Timeline ─────────────────────────────────────────────────────────────

export type TimelineStepState = 'done' | 'current' | 'pending'
export type TimelineIcon =
  | 'file-text' | 'pen-line' | 'wallet' | 'sparkles'
  | 'dog' | 'package-check' | 'mail'

export interface TimelineStep {
  id: string
  label: string
  date: string | null
  state: TimelineStepState
  icon: TimelineIcon
  /** Subtítulo opcional con detalle adicional (importe, contraparte, etc.) */
  detail?: string | null
  /** Highlight especial (para el hito "Reserva confirmada"). */
  celebrate?: boolean
}

/**
 * Construye los hitos del journey de una reserva para el panel del cliente.
 *
 * Hitos:
 *   1. Solicitud enviada (siempre done desde created_at)
 *   2. Contrato de RESERVA firmado (done si reservation contract signed_full)
 *   3. Seña recibida (done si deposit_paid_at, criador lo confirma manual)
 *   4. ★ Reserva confirmada (done si 2 + 3) — celebración
 *   5. Cachorro asignado (done si dog_id != null)
 *   6. Contrato de ENTREGA firmado (done si delivery contract signed_full)
 *   7. Cachorro entregado (done si delivered_at)
 *
 * El "current" se asigna al primer pending. El resto queda pending.
 * Si la reserva está cancelled, todos los pendings quedan en pending sin
 * current — el badge de status arriba ya indica que está cerrada.
 */
export function getReservationTimelineSteps(r: ClientReservation): TimelineStep[] {
  const reservationContractSigned = r.contracts.some(
    (c) => c.kind === 'reservation' && c.status === 'signed_full',
  )
  const deliveryContractSigned = r.contracts.some(
    (c) => c.kind === 'delivery' && c.status === 'signed_full',
  )
  const depositPaid = !!r.deposit_paid_at
  const confirmed = reservationContractSigned && depositPaid
  const assigned = !!r.dog_id
  const delivered = !!r.delivered_at

  const rawSteps: Array<Omit<TimelineStep, 'state'>> = [
    {
      id: 'request-sent',
      label: 'Solicitud enviada',
      date: r.created_at,
      icon: 'file-text',
      detail: r.kennel?.name ? `a ${r.kennel.name}` : null,
    },
    {
      id: 'reservation-contract',
      label: 'Contrato de reserva firmado',
      date: reservationContractSigned
        ? r.contracts.find((c) => c.kind === 'reservation' && c.status === 'signed_full')?.signed_at_client ?? null
        : null,
      icon: 'pen-line',
    },
    {
      id: 'deposit',
      label: 'Seña recibida',
      date: r.deposit_paid_at,
      icon: 'wallet',
      detail: r.deposit_amount_cents != null
        ? `${formatPrice(r.deposit_amount_cents, r.currency)}`
        : null,
    },
    {
      id: 'confirmed',
      label: 'Reserva confirmada',
      date: confirmed && r.deposit_paid_at ? r.deposit_paid_at : null,
      icon: 'sparkles',
      celebrate: true,
    },
    {
      id: 'puppy-assigned',
      label: 'Cachorro asignado',
      date: null,
      icon: 'dog',
      detail: r.dog?.name || null,
    },
    {
      id: 'delivery-contract',
      label: 'Contrato de entrega firmado',
      date: deliveryContractSigned
        ? r.contracts.find((c) => c.kind === 'delivery' && c.status === 'signed_full')?.signed_at_client ?? null
        : null,
      icon: 'pen-line',
    },
    {
      id: 'delivered',
      label: 'Cachorro entregado',
      date: r.delivered_at,
      icon: 'package-check',
    },
  ]

  // Estado de cada hito: done si tiene marcadores; current al primer pending
  // (excepto si la reserva está cancelled); pending el resto.
  const isCancelled = r.status === 'cancelled'
  const doneFlags = [
    true, // request-sent siempre
    reservationContractSigned,
    depositPaid,
    confirmed,
    assigned,
    deliveryContractSigned,
    delivered,
  ]

  let firstPendingFound = false
  return rawSteps.map((s, i): TimelineStep => {
    if (doneFlags[i]) return { ...s, state: 'done' }
    if (!firstPendingFound && !isCancelled) {
      firstPendingFound = true
      return { ...s, state: 'current' }
    }
    return { ...s, state: 'pending' }
  })
}

export function formatPrice(cents: number | null, currency: string = 'EUR'): string {
  if (cents == null) return '—'
  const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency })
  return fmt.format(cents / 100)
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return '—'
  }
}
