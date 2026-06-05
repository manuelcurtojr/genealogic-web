/**
 * Detalle de una reserva — vista del criador.
 *
 * Hub central que enlaza:
 *  - Datos de la reserva + cliente
 *  - Mensajería bidireccional (Fase C.3)
 *  - Contrato (Fase C.4 — link a /reservas/[id]/contrato)
 *  - Pagos (Fase C.5 — link a /reservas/[id]/pagos)
 *  - Papeles del cachorro asignado (link a /dogs/[dog_id]/papeles)
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { listReservationMessages, markThreadRead } from '@/lib/reservations/messages'
import ReservationThread from '@/components/reservations/reservation-thread'
import { sendBreederMessageAction, quickMarkPaymentReceivedAction } from './actions'
import PaymentMilestonesCard from '@/components/reservations/payment-milestones-card'
import FeedbackButton from '@/components/feedback/feedback-button'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { Img } from '@/components/ui/img'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reserva · Genealogic' }

export default async function BreederReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: reservation } = await admin
    .from('puppy_reservations')
    .select(
      `*, kennel:kennels(id, name, slug, owner_id), dog:dogs!dog_id(id, slug, name, thumbnail_url)`,
    )
    .eq('id', id)
    .maybeSingle()
  if (!reservation) notFound()
  if (reservation.kennel?.owner_id !== user.id) redirect('/reservas')

  const messages = await listReservationMessages(reservation.id)
  markThreadRead(reservation.id, 'breeder').catch(() => {})

  const hasClientAccount = !!reservation.client_user_id
  const t = getTranslator(await getLocale())

  return (
    <div>
      <FeedbackButton scope="reservation_form" pageLabel={t('Detalle de reserva')} />
      <Link
        href="/reservas"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← {t('Solicitudes')}
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {reservation.applicant_name || t('Sin nombre')}
          </h1>
          <p className="mt-1 text-sm text-body">
            {reservation.applicant_email}
            {reservation.applicant_phone && ` · ${reservation.applicant_phone}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-body">
            {reservation.status}
          </span>
          {hasClientAccount ? (
            <span className="text-[11px] text-emerald-700 font-semibold">
              ✓ {t('Cuenta vinculada')}
            </span>
          ) : (
            <span className="text-[11px] text-muted">{t('Sin cuenta · solo email')}</span>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Columna principal: mensajería */}
        <div>
          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-base font-bold text-ink">{t('Mensajes')}</h2>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {messages.length} {messages.length === 1 ? t('mensaje') : t('mensajes')}
              </span>
            </div>
            {hasClientAccount ? (
              <ReservationThread
                messages={messages}
                currentRole="breeder"
                reservationId={reservation.id}
                onSendAction={sendBreederMessageAction}
                otherSideName={reservation.applicant_name || t('el cliente')}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-6 text-center text-sm text-muted">
                <p className="text-ink font-semibold mb-1">{t('Cliente sin cuenta')}</p>
                <p>
                  {t('Cuando el cliente cree cuenta en Genealogic con el email')}{' '}
                  <strong>{reservation.applicant_email}</strong>{t(', podrás chatear con él aquí. Mientras tanto, usa email/WhatsApp.')}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar: links rápidos */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-hairline bg-canvas p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">
              {t('Cachorro')}
            </h3>
            {reservation.dog ? (
              <div>
                <div className="flex items-center gap-3">
                  {reservation.dog.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Img
                      w={200}
                      src={reservation.dog.thumbnail_url}
                      alt={reservation.dog.name}
                      className="w-12 h-12 rounded-lg object-cover border border-hairline"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-surface-card flex items-center justify-center text-sm font-bold text-ink">
                      {reservation.dog.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">
                      {reservation.dog.name}
                    </p>
                    <Link
                      href={`/dogs/${reservation.dog.slug || reservation.dog.id}`}
                      target="_blank"
                      className="text-[11px] text-muted hover:text-ink"
                    >
                      {t('Ver ficha →')}
                    </Link>
                  </div>
                </div>
                <Link
                  href={`/dogs/${reservation.dog.id}/papeles`}
                  className="mt-3 inline-flex items-center gap-1 w-full justify-center rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink"
                >
                  {t('Gestionar papeles →')}
                </Link>
              </div>
            ) : (
              <p className="text-xs text-muted">{t('No hay cachorro asignado a esta reserva.')}</p>
            )}
          </section>

          <section className="rounded-2xl border border-hairline bg-canvas p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">
              {t('Contrato')}
            </h3>
            <p className="text-xs text-muted mb-3">
              {t('Crea, edita y envía el contrato al cliente.')}
            </p>
            <Link
              href={`/reservas/${reservation.id}/contrato`}
              className="inline-flex items-center gap-1 w-full justify-center rounded-lg bg-ink text-on-primary px-3 py-2 text-xs font-semibold hover:opacity-90"
            >
              {t('Abrir contrato →')}
            </Link>
          </section>

          {/* Atajos para marcar seña + pago final cobrados. Reemplaza al
              card antiguo "Pagos" que era solo un link a /pagos — ahora el
              criador puede marcar los 2 hitos económicos en un click sin
              salir del panel del lead. /pagos sigue ahí para gestión fina. */}
          <PaymentMilestonesCard
            reservationId={reservation.id}
            currency={reservation.currency || 'EUR'}
            deposit={{
              kind: 'deposit',
              label: t('Señal recibida'),
              description: t('Al confirmar la reserva'),
              doneAt: reservation.deposit_paid_at,
              amountCents: reservation.deposit_amount_cents,
              suggestedAmount: reservation.deposit_amount_cents,
            }}
            finalPayment={{
              kind: 'final',
              label: t('Pago final recibido'),
              description: t('Al entregar el cachorro'),
              doneAt: reservation.paid_in_full_at,
              amountCents: reservation.total_price_cents != null && reservation.deposit_amount_cents != null
                ? reservation.total_price_cents - reservation.deposit_amount_cents
                : reservation.total_price_cents,
              suggestedAmount: reservation.total_price_cents != null && reservation.deposit_amount_cents != null
                ? reservation.total_price_cents - reservation.deposit_amount_cents
                : null,
            }}
            onMark={quickMarkPaymentReceivedAction}
          />
        </aside>
      </div>
    </div>
  )
}
