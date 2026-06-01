/**
 * Server actions del criador para pagos de una reserva.
 *  - createPaymentAction
 *  - markPaymentPaidManuallyAction (bank transfer, cash, other)
 *  - cancelPaymentAction
 *
 * Stripe Connect onboarding está en /kennel/pagos/actions.ts
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
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertBreeder(reservationId: string): Promise<{ userId: string; reservation: any }> {
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

export async function createPaymentAction(
  reservationId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId, reservation } = await assertBreeder(reservationId)
    const amountStr = (formData.get('amount') as string) || ''
    const amountFloat = parseFloat(amountStr.replace(',', '.'))
    if (!isFinite(amountFloat) || amountFloat <= 0) {
      return { ok: false, error: getTranslator(await getLocale())('Importe inválido') }
    }
    const amountCents = Math.round(amountFloat * 100)
    const type = ((formData.get('type') as PaymentType) || 'milestone')
    const description = ((formData.get('description') as string) || '').trim() || null
    const dueDate = ((formData.get('due_date') as string) || '').trim() || null

    await createPayment({
      reservationId,
      kennelId: reservation.kennel_id,
      createdBy: userId,
      amountCents,
      currency: reservation.currency || 'EUR',
      type,
      description,
      dueDate,
    })
    revalidatePath(`/reservas/${reservationId}/pagos`)
    revalidatePath(`/mis-reservas/${reservationId}/pagos`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

export async function markPaidManuallyAction(formData: FormData): Promise<void> {
  const paymentId = formData.get('id') as string
  const paidVia = (formData.get('paid_via') as PaidVia) || 'bank_transfer'
  if (!paymentId) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: row } = await admin
    .from('reservation_payments')
    .select('reservation_id')
    .eq('id', paymentId)
    .maybeSingle()
  if (!row) return

  const { userId } = await assertBreeder(row.reservation_id)
  await markPaymentPaid({ paymentId, paidVia, paidBy: userId })
  revalidatePath(`/reservas/${row.reservation_id}/pagos`)
  revalidatePath(`/mis-reservas/${row.reservation_id}/pagos`)
}

export async function cancelPaymentAction(formData: FormData): Promise<void> {
  const paymentId = formData.get('id') as string
  if (!paymentId) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: row } = await admin
    .from('reservation_payments')
    .select('reservation_id')
    .eq('id', paymentId)
    .maybeSingle()
  if (!row) return
  await assertBreeder(row.reservation_id)
  await cancelPayment(paymentId)
  revalidatePath(`/reservas/${row.reservation_id}/pagos`)
  revalidatePath(`/mis-reservas/${row.reservation_id}/pagos`)
}
