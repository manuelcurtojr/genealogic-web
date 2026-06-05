/**
 * Server actions del criador para una reserva.
 *  - Enviar mensaje al cliente
 *  - (Fase C.4) crear/enviar contrato, firmar
 *  - (Fase C.5) crear pago, marcar como pagado
 */
'use server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { insertMessage } from '@/lib/reservations/messages'
import { createPayment, markPaymentPaid, type PaidVia } from '@/lib/payments/payments'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export async function sendBreederMessageAction(
  reservationId: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = getTranslator(await getLocale())
  try {
    if (!body || !body.trim()) return { ok: false, error: t('Mensaje vacío') }
    if (body.length > 4000) return { ok: false, error: t('Mensaje demasiado largo (max 4000 chars)') }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: t('Sesión no válida') }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: reservation } = await admin
      .from('puppy_reservations')
      .select('id, kennel_id, kennel:kennels(owner_id, name)')
      .eq('id', reservationId)
      .maybeSingle()

    if (!reservation) return { ok: false, error: t('Reserva no encontrada') }
    if (reservation.kennel?.owner_id !== user.id) return { ok: false, error: t('Sin permiso') }

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    await insertMessage({
      reservationId: reservation.id,
      kennelId: reservation.kennel_id,
      senderRole: 'breeder',
      senderUserId: user.id,
      senderName: profile?.full_name || reservation.kennel?.name || 'Criador',
      senderEmail: user.email ?? null,
      body: body.trim(),
      origin: 'panel',
    })

    revalidatePath(`/reservas/${reservationId}`)
    revalidatePath(`/mis-reservas/${reservationId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

/**
 * Atajo "Marcar [seña|pago final] recibido" desde el panel del criador.
 *
 * Crea un registro de pago en reservation_payments + lo marca como pagado
 * en una sola acción. El sync con puppy_reservations.deposit_paid_at /
 * paid_in_full_at lo hace markPaymentPaid() internamente, así que el
 * timeline del cliente se enciende automáticamente.
 *
 * Si el criador quiere gestionar el pago con más detalle (fecha límite,
 * descripción, varios milestones), debe usar /reservas/[id]/pagos. Esto
 * es solo el atajo "ya cobré, marca y olvida".
 */
export async function quickMarkPaymentReceivedAction(
  reservationId: string,
  kind: 'deposit' | 'final',
  amountStr: string,
  paidVia: PaidVia = 'bank_transfer',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = getTranslator(await getLocale())
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: t('Sesión no válida') }

    const amountFloat = parseFloat(String(amountStr || '').replace(',', '.'))
    if (!isFinite(amountFloat) || amountFloat <= 0) {
      return { ok: false, error: t('Importe inválido') }
    }
    const amountCents = Math.round(amountFloat * 100)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: reservation } = await admin
      .from('puppy_reservations')
      .select('id, kennel_id, currency, kennel:kennels(owner_id)')
      .eq('id', reservationId)
      .maybeSingle()
    if (!reservation) return { ok: false, error: t('Reserva no encontrada') }
    if (reservation.kennel?.owner_id !== user.id) return { ok: false, error: t('Sin permiso') }

    // 1) Crear el payment con descripción autoexplicativa
    const created = await createPayment({
      reservationId,
      kennelId: reservation.kennel_id,
      createdBy: user.id,
      amountCents,
      currency: reservation.currency || 'EUR',
      type: kind === 'deposit' ? 'deposit' : 'final',
      description: kind === 'deposit'
        ? 'Señal de reserva'
        : 'Pago final del cachorro',
      dueDate: null,
    })

    // 2) Marcarlo pagado → dispara sync con puppy_reservations + email
    await markPaymentPaid({
      paymentId: created.id,
      paidVia,
      paidBy: user.id,
    })

    revalidatePath(`/reservas/${reservationId}`)
    revalidatePath(`/reservas/${reservationId}/pagos`)
    revalidatePath(`/mis-reservas/${reservationId}`)
    revalidatePath(`/mis-reservas/${reservationId}/pagos`)
    revalidatePath(`/embudo`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}
