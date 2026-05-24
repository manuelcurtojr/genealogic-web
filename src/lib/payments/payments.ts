/**
 * Helpers server-only para `reservation_payments`.
 */
import 'server-only'
import { cache } from 'react'
import { createKennelAdminClient } from '@/lib/supabase/server'

export type PaymentType = 'deposit' | 'milestone' | 'final' | 'custom'
export type PaymentStatus = 'pending' | 'requested' | 'paid' | 'refunded' | 'cancelled'
export type PaidVia = 'stripe' | 'bank_transfer' | 'cash' | 'other'

export type ReservationPayment = {
  id: string
  reservation_id: string
  kennel_id: string
  amount_cents: number
  currency: string
  type: PaymentType
  description: string | null
  due_date: string | null
  status: PaymentStatus
  paid_at: string | null
  paid_via: PaidVia | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  stripe_application_fee_cents: number | null
  notes: string | null
  created_by: string | null
  marked_paid_by: string | null
  created_at: string
  updated_at: string
}

export const listReservationPayments = cache(
  async (reservationId: string): Promise<ReservationPayment[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data } = await admin
      .from('reservation_payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('due_date', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true })
    return (data as ReservationPayment[]) ?? []
  },
)

export async function createPayment(args: {
  reservationId: string
  kennelId: string
  createdBy: string
  amountCents: number
  currency?: string
  type?: PaymentType
  description?: string | null
  dueDate?: string | null
}): Promise<ReservationPayment> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data, error } = await admin
    .from('reservation_payments')
    .insert({
      reservation_id: args.reservationId,
      kennel_id: args.kennelId,
      created_by: args.createdBy,
      amount_cents: args.amountCents,
      currency: args.currency || 'EUR',
      type: args.type || 'milestone',
      description: args.description ?? null,
      due_date: args.dueDate ?? null,
      status: 'pending',
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ReservationPayment
}

export async function markPaymentPaid(args: {
  paymentId: string
  paidVia: PaidVia
  paidBy: string
  notes?: string | null
}): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { error } = await admin
    .from('reservation_payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_via: args.paidVia,
      marked_paid_by: args.paidBy,
      notes: args.notes ?? undefined,
    })
    .eq('id', args.paymentId)
  if (error) throw new Error(error.message)
}

export async function cancelPayment(paymentId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { error } = await admin
    .from('reservation_payments')
    .update({ status: 'cancelled' })
    .eq('id', paymentId)
  if (error) throw new Error(error.message)
}

export async function setStripeCheckoutSession(args: {
  paymentId: string
  sessionId: string
}): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  await admin
    .from('reservation_payments')
    .update({
      stripe_checkout_session_id: args.sessionId,
      status: 'requested',
    })
    .eq('id', args.paymentId)
}

export function formatPaymentAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(cents / 100)
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  deposit: 'Señal / Reserva',
  milestone: 'Pago intermedio',
  final: 'Pago final',
  custom: 'Otro',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-700' },
  requested: { label: 'Esperando pago', color: 'bg-blue-50 text-blue-800' },
  paid: { label: 'Pagado', color: 'bg-emerald-50 text-emerald-800' },
  refunded: { label: 'Reembolsado', color: 'bg-amber-50 text-amber-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-50 text-red-700' },
}
