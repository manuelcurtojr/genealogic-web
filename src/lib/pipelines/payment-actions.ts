/**
 * Server actions de COBROS para el panel lateral del embudo (lead/reserva).
 * Reutilizan el core server-only de @/lib/payments/payments. Permiten al
 * criador gestionar los pagos de una reserva sin salir del panel:
 *  - logManualPayment: registra un pago YA cobrado (crea + marca pagado en uno).
 *  - setReservationTotal: fija/edita el precio total acordado.
 *  - voidReservationPayment: anula (cancela) un pago.
 *
 * La gestión fina (hitos con fecha límite, links de pago Stripe) sigue en
 * /reservas/[id]/pagos; esto es el atajo operativo del embudo.
 */
'use server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createPayment,
  markPaymentPaid,
  cancelPayment,
  type PaymentType,
  type PaidVia,
} from '@/lib/payments/payments'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertOwner(reservationId: string): Promise<{ userId: string; reservation: any }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: reservation } = await admin
    .from('puppy_reservations')
    .select('id, kennel_id, currency, kennel:kennels(owner_id)')
    .eq('id', reservationId)
    .maybeSingle()
  if (!reservation) throw new Error('reservation_not_found')
  if (reservation.kennel?.owner_id !== user.id) throw new Error('forbidden')
  return { userId: user.id, reservation }
}

/** Registra un pago YA recibido: lo crea y lo marca pagado en un solo paso. */
export async function logManualPayment(
  reservationId: string,
  amountCents: number,
  paidVia: PaidVia,
  type: PaymentType,
  description: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return { ok: false, error: 'Importe inválido' }
    }
    const { userId, reservation } = await assertOwner(reservationId)
    const payment = await createPayment({
      reservationId,
      kennelId: reservation.kennel_id,
      createdBy: userId,
      amountCents,
      currency: reservation.currency || 'EUR',
      type,
      description,
    })
    await markPaymentPaid({ paymentId: payment.id, paidVia, paidBy: userId })
    revalidatePath('/embudo')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'error' }
  }
}

/** Fija/edita el precio total acordado de la reserva (o lo borra con null). */
export async function setReservationTotal(
  reservationId: string,
  totalCents: number | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (totalCents != null && (!Number.isFinite(totalCents) || totalCents < 0)) {
      return { ok: false, error: 'Importe inválido' }
    }
    await assertOwner(reservationId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    await admin
      .from('puppy_reservations')
      .update({ total_price_cents: totalCents })
      .eq('id', reservationId)
    revalidatePath('/embudo')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'error' }
  }
}

/** Lista los pagos NO cancelados de una reserva (para el panel del embudo). */
export async function listPaymentsForPanel(reservationId: string): Promise<Array<{
  id: string
  amount_cents: number
  currency: string
  type: string
  description: string | null
  status: string
  paid_at: string | null
  paid_via: string | null
  due_date: string | null
  created_at: string
}>> {
  try {
    await assertOwner(reservationId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data } = await admin
      .from('reservation_payments')
      .select('id, amount_cents, currency, type, description, status, paid_at, paid_via, due_date, created_at')
      .eq('reservation_id', reservationId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true })
    return data ?? []
  } catch {
    return []
  }
}

/** Anula (cancela) un pago de la reserva. */
export async function voidReservationPayment(
  paymentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: row } = await admin
      .from('reservation_payments')
      .select('reservation_id')
      .eq('id', paymentId)
      .maybeSingle()
    if (!row) return { ok: false, error: 'not_found' }
    await assertOwner(row.reservation_id)
    await cancelPayment(paymentId)
    revalidatePath('/embudo')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'error' }
  }
}
