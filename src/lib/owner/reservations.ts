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
  contract_signed_at: string | null
  delivered_at: string | null
  position_in_queue: number | null
  applicant_message: string | null
  applicant_purpose: string | null
  applicant_extra_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // Joins
  kennel: { id: string; slug: string; name: string; logo_url: string | null } | null
  dog: { id: string; slug: string; name: string; thumbnail_url: string | null } | null
  litter: { id: string; expected_date: string | null; birth_date: string | null } | null
}

const SELECT_COLS = `
  id, status, preference_sex, preference_color, preference_notes,
  deposit_amount_cents, total_price_cents, currency,
  deposit_paid_at, contract_signed_at, delivered_at,
  position_in_queue, applicant_message, applicant_purpose, applicant_extra_data,
  created_at, updated_at,
  kennel:kennels(id, slug, name, logo_url),
  dog:dogs!dog_id(id, slug, name, thumbnail_url),
  litter:litters(id, expected_date, birth_date)
`

const ACTIVE_STATUSES = ['interested', 'waitlisted', 'deposit_paid', 'assigned', 'contract_signed', 'paid_in_full']
const ARCHIVED_STATUSES = ['delivered', 'cancelled']

/**
 * Reservas activas del cliente (NO histórico).
 * Ordenadas por created_at desc.
 */
export const getMyActiveReservations = cache(async (userId: string): Promise<ClientReservation[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data } = await admin
    .from('puppy_reservations')
    .select(SELECT_COLS)
    .eq('client_user_id', userId)
    .in('status', ACTIVE_STATUSES)
    .order('created_at', { ascending: false })
  return (data as ClientReservation[]) ?? []
})

/**
 * Histórico de reservas del cliente (delivered + cancelled).
 */
export const getMyHistoricalReservations = cache(async (userId: string): Promise<ClientReservation[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data } = await admin
    .from('puppy_reservations')
    .select(SELECT_COLS)
    .eq('client_user_id', userId)
    .in('status', ARCHIVED_STATUSES)
    .order('updated_at', { ascending: false })
  return (data as ClientReservation[]) ?? []
})

/**
 * Una reserva específica si el cliente tiene acceso. RLS hace doble check.
 */
export const getMyReservation = cache(
  async (userId: string, reservationId: string): Promise<ClientReservation | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data } = await admin
      .from('puppy_reservations')
      .select(SELECT_COLS)
      .eq('client_user_id', userId)
      .eq('id', reservationId)
      .maybeSingle()
    return (data as ClientReservation | null) ?? null
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
    label: 'Interesado',
    color: 'gray',
    description: 'Has mostrado interés. El criador revisará tu solicitud.',
  },
  waitlisted: {
    label: 'Lista de espera',
    color: 'amber',
    description: 'Estás en lista para la próxima camada disponible.',
  },
  deposit_paid: {
    label: 'Seña pagada',
    color: 'blue',
    description: 'Tu reserva está confirmada con seña. A la espera del cachorro.',
  },
  assigned: {
    label: 'Cachorro asignado',
    color: 'violet',
    description: 'Un cachorro concreto ya está asignado a tu reserva.',
  },
  contract_signed: {
    label: 'Contrato firmado',
    color: 'violet',
    description: 'Contrato firmado por ambas partes. Próximo paso: pago final.',
  },
  paid_in_full: {
    label: 'Pagado',
    color: 'emerald',
    description: 'Pago completo realizado. Preparando entrega.',
  },
  delivered: {
    label: 'Entregado',
    color: 'emerald',
    description: 'Cachorro entregado. Disfrútalo.',
  },
  cancelled: {
    label: 'Cancelada',
    color: 'red',
    description: 'Reserva cancelada.',
  },
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
