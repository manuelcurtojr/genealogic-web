/**
 * Panel del Propietario: detalle de una reserva.
 *
 * Vista solo lectura en Fase A. Próximas fases:
 *  - Fase B: marcar perro como recibido cuando el criador hace transfer
 *  - Fase C: firma de contrato + plan de pagos (Stripe Connect del criador)
 *           + mensajería interna 2-way
 */
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getMyReservation,
  STATUS_META,
  formatDate,
  formatPrice,
} from '@/lib/owner/reservations'
import { listReservationMessages, markThreadRead } from '@/lib/reservations/messages'
import ReservationThread from '@/components/reservations/reservation-thread'
import { sendClientMessageAction } from './actions'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reserva · Mis reservas · Genealogic' }

export default async function MyReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = getTranslator(await getLocale())
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const reservation = await getMyReservation(user.id, id)
  if (!reservation) notFound()

  const meta = STATUS_META[reservation.status] ?? STATUS_META.interested
  const isArchived = reservation.status === 'delivered' || reservation.status === 'cancelled'

  // Línea de tiempo: pasos del journey de la reserva
  const timeline = buildTimeline(reservation, t)

  // Mensajería
  const messages = await listReservationMessages(reservation.id)
  // Marcar como leídos los mensajes del criador (no bloqueante)
  markThreadRead(reservation.id, 'client').catch(() => {})

  return (
    <div>
      <Link
        href="/mis-reservas"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← {t('Mis reservas')}
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t('Reserva con')}
          </p>
          <div className="mt-2 flex items-center gap-3">
            {reservation.kennel?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={reservation.kennel.logo_url}
                alt={reservation.kennel.name}
                className="w-12 h-12 rounded-full object-cover border border-hairline"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-surface-card flex items-center justify-center text-base font-bold text-ink">
                {reservation.kennel?.name[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              {reservation.kennel?.name ?? '—'}
            </h1>
          </div>
        </div>
        <StatusPill status={reservation.status} />
      </div>

      <p className="mt-3 text-body max-w-2xl">{meta.description}</p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cachorro asignado */}
          {reservation.dog && (
            <section className="rounded-2xl border border-hairline bg-canvas p-5">
              <h2 className="text-base font-bold text-ink mb-4">{t('Cachorro asignado')}</h2>
              <Link
                href={`/dogs/${reservation.dog.slug}`}
                target="_blank"
                className="flex items-center gap-4 group"
              >
                {reservation.dog.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={reservation.dog.thumbnail_url}
                    alt={reservation.dog.name}
                    className="w-20 h-20 rounded-xl object-cover group-hover:scale-[1.02] transition"
                  />
                )}
                <div>
                  <p className="text-lg font-bold text-ink group-hover:text-brand">
                    {reservation.dog.name}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {t('Ver ficha completa en Genealogic')} →
                  </p>
                </div>
              </Link>
            </section>
          )}

          {/* Tu solicitud original (datos del formulario) */}
          {(reservation.applicant_message ||
            reservation.applicant_purpose ||
            reservation.preference_sex ||
            reservation.preference_color) && (
            <section className="rounded-2xl border border-hairline bg-canvas p-5">
              <h2 className="text-base font-bold text-ink mb-4">{t('Tu solicitud')}</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reservation.preference_sex && (
                  <Field label={t('Sexo preferido')}>
                    {reservation.preference_sex === 'male'
                      ? t('Macho')
                      : reservation.preference_sex === 'female'
                        ? t('Hembra')
                        : t('Indiferente')}
                  </Field>
                )}
                {reservation.preference_color && (
                  <Field label={t('Color preferido')}>{reservation.preference_color}</Field>
                )}
                {reservation.applicant_purpose && (
                  <Field label={t('Función')}>{reservation.applicant_purpose}</Field>
                )}
                {reservation.preference_notes && (
                  <Field label={t('Notas')}>{reservation.preference_notes}</Field>
                )}
              </dl>
              {reservation.applicant_message && (
                <div className="mt-5 pt-5 border-t border-hairline">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
                    {t('Mensaje al criador')}
                  </p>
                  <p className="text-sm text-body leading-relaxed whitespace-pre-line">
                    {reservation.applicant_message}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Camada (si está asignada) */}
          {reservation.litter && (
            <section className="rounded-2xl border border-hairline bg-canvas p-5">
              <h2 className="text-base font-bold text-ink mb-4">{t('Camada')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reservation.litter.expected_date && (
                  <Field label={t('Fecha esperada')}>
                    {formatDate(reservation.litter.expected_date)}
                  </Field>
                )}
                {reservation.litter.birth_date && (
                  <Field label={t('Nacimiento')}>{formatDate(reservation.litter.birth_date)}</Field>
                )}
              </div>
            </section>
          )}

          {/* Timeline */}
          <section className="rounded-2xl border border-hairline bg-canvas p-5">
            <h2 className="text-base font-bold text-ink mb-4">{t('Línea de tiempo')}</h2>
            <ol className="relative border-l-2 border-hairline pl-5 space-y-5">
              {timeline.map((step, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[27px] w-3 h-3 rounded-full top-1 ${
                      step.done ? 'bg-ink' : 'bg-canvas border-2 border-hairline'
                    }`}
                  />
                  <p
                    className={`text-sm font-semibold ${
                      step.done ? 'text-ink' : 'text-muted'
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.date && (
                    <p className="text-xs text-muted mt-0.5">{formatDate(step.date)}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Columna lateral: pagos + acciones */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-hairline bg-canvas p-5">
            <h2 className="text-base font-bold text-ink mb-4">{t('Económico')}</h2>
            <dl className="space-y-3 text-sm">
              {reservation.deposit_amount_cents != null && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted">{t('Seña')}</dt>
                  <dd className="font-semibold text-ink tabular-nums">
                    {formatPrice(reservation.deposit_amount_cents, reservation.currency)}
                  </dd>
                </div>
              )}
              {reservation.total_price_cents != null && (
                <div className="flex items-center justify-between pt-3 border-t border-hairline">
                  <dt className="text-muted">{t('Total')}</dt>
                  <dd className="font-bold text-ink tabular-nums text-base">
                    {formatPrice(reservation.total_price_cents, reservation.currency)}
                  </dd>
                </div>
              )}
              {reservation.deposit_amount_cents == null &&
                reservation.total_price_cents == null && (
                  <p className="text-xs text-muted italic">
                    {t('El criador no ha configurado importes todavía.')}
                  </p>
                )}
            </dl>
            <Link
              href={`/mis-reservas/${reservation.id}/pagos`}
              className="mt-5 inline-flex items-center gap-1 w-full justify-center rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink"
            >
              {t('Ver pagos y abonar')} →
            </Link>
          </section>

          <section className="rounded-2xl border border-hairline bg-canvas p-5">
            <h2 className="text-base font-bold text-ink mb-3">{t('Contrato')}</h2>
            {reservation.contract_signed_at ? (
              <p className="text-sm font-semibold text-emerald-700 mb-3">
                ✓ {t('Firmado el')} {formatDate(reservation.contract_signed_at)}
              </p>
            ) : (
              <p className="text-sm text-muted mb-3">
                {t('Revisa el estado del contrato y fírmalo cuando el criador lo envíe.')}
              </p>
            )}
            <Link
              href={`/mis-reservas/${reservation.id}/contrato`}
              className="inline-flex items-center gap-1 w-full justify-center rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink"
            >
              {t('Abrir contrato')} →
            </Link>
          </section>

          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-base font-bold text-ink">{t('Mensajes')}</h2>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {messages.length} {messages.length === 1 ? t('mensaje') : t('mensajes')}
              </span>
            </div>
            <ReservationThread
              messages={messages}
              currentRole="client"
              reservationId={reservation.id}
              onSendAction={sendClientMessageAction}
              otherSideName={reservation.kennel?.name || t('el criador')}
            />
          </section>
        </div>
      </div>

      {isArchived && (
        <div className="mt-10 rounded-xl bg-surface-soft border border-hairline p-4 text-xs text-muted">
          {t('Esta reserva está archivada. Se mantiene visible para tu histórico pero ya no recibirá actualizaciones.')}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink font-medium">{children}</dd>
    </div>
  )
}

import type { ClientReservation } from '@/lib/owner/reservations'

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.interested
  const colorBg: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 ring-gray-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    blue: 'bg-blue-50 text-blue-800 ring-blue-200',
    violet: 'bg-violet-50 text-violet-800 ring-violet-200',
    emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
  }
  return (
    <span
      className={`shrink-0 text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full ring-1 ${colorBg[meta.color]}`}
    >
      {meta.label}
    </span>
  )
}

function buildTimeline(r: ClientReservation, t: (k: string) => string): { label: string; date: string | null; done: boolean }[] {
  return [
    { label: t('Solicitud enviada'), date: r.created_at, done: true },
    { label: t('Seña pagada'), date: r.deposit_paid_at, done: !!r.deposit_paid_at },
    {
      label: t('Cachorro asignado'),
      date: null,
      done: ['assigned', 'contract_signed', 'paid_in_full', 'delivered'].includes(r.status),
    },
    {
      label: t('Contrato firmado'),
      date: r.contract_signed_at,
      done: !!r.contract_signed_at,
    },
    {
      label: t('Pago final'),
      date: null,
      done: ['paid_in_full', 'delivered'].includes(r.status),
    },
    { label: t('Cachorro entregado'), date: r.delivered_at, done: !!r.delivered_at },
  ]
}
