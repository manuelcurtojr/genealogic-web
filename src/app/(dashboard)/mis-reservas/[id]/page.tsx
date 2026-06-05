/**
 * Panel del Propietario: detalle de una reserva.
 *
 * Vista del cliente con todo el ciclo de vida de la reserva en una sola
 * página. Diseño orientado a "saber dónde estoy y qué falta":
 *
 *   1. Hero — kennel + status + fecha + acciones rápidas (contrato/pagos/mensajes)
 *   2. Timeline + Sidebar info — el "dónde estoy" en grande, info clave a un lado
 *   3. Detalles — cachorro, solicitud, camada, documentos en cards uniformes
 *   4. Mensajes — hilo con el criador al final, full width
 */
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getMyReservation,
  getReservationTimelineSteps,
  STATUS_META,
  formatDate,
  formatPrice,
} from '@/lib/owner/reservations'
import ReservationTimeline from '@/components/reservations/reservation-timeline'
import ReservationChatPanel from '@/components/reservations/reservation-chat-panel'
import { listReservationMessages, markThreadRead } from '@/lib/reservations/messages'
import { listDogDocumentsForOwner } from '@/lib/dogs/documents'
import { labelForType } from '@/lib/dogs/documents-shared'
import ReservationThread from '@/components/reservations/reservation-thread'
import { sendClientMessageAction } from './actions'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { Img } from '@/components/ui/img'
import {
  ArrowLeft, ScrollText, Wallet, MessageCircle,
  Dog, FileText, Calendar, Heart, Inbox, Download, Archive,
  ChevronRight, ExternalLink,
} from 'lucide-react'

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

  const timeline = getReservationTimelineSteps(reservation)
  const completedSteps = timeline.filter((s) => s.state === 'done').length
  const progressPct = Math.round((completedSteps / timeline.length) * 100)

  const messages = await listReservationMessages(reservation.id)
  markThreadRead(reservation.id, 'client').catch(() => {})

  const documents = reservation.dog
    ? await listDogDocumentsForOwner(reservation.dog.id)
    : []

  // Estado de los contratos para los CTAs rápidos
  const reservationContract = reservation.contracts.find((c) => c.kind === 'reservation') || null
  const deliveryContract = reservation.contracts.find((c) => c.kind === 'delivery') || null
  const pendingSignature = (reservationContract && !reservationContract.signed_at_client && reservationContract.status === 'sent')
    || (reservationContract && !reservationContract.signed_at_client && reservationContract.status === 'signed_partial')
    || (deliveryContract && !deliveryContract.signed_at_client && deliveryContract.status === 'sent')
    || (deliveryContract && !deliveryContract.signed_at_client && deliveryContract.status === 'signed_partial')
  const allSigned = !!reservationContract?.signed_at_client && (!deliveryContract || !!deliveryContract.signed_at_client)
  const totalPending = reservation.total_price_cents != null && reservation.deposit_amount_cents != null
    ? reservation.total_price_cents - reservation.deposit_amount_cents
    : null

  const kennelInitial = reservation.kennel?.name[0]?.toUpperCase() ?? '?'
  const kennelHref = reservation.kennel?.slug ? `/kennels/${reservation.kennel.slug}` : null

  // Aproximación de no-leídos del criador. Si el modelo no tiene flag de
  // "leído por cliente", queda en 0 y el badge no aparece.
  const unreadCount = messages.filter((m) =>
    m.sender_role === 'breeder' && !('read_at' in m && m.read_at)
  ).length

  return (
    <ReservationChatPanel
      otherSideLogoUrl={reservation.kennel?.logo_url ?? null}
      otherSideName={reservation.kennel?.name || t('el criadero')}
      otherSideTagline={t('Criadero · Genealogic')}
      unreadCount={unreadCount}
      chatBody={
        <ReservationThread
          messages={messages}
          currentRole="client"
          reservationId={reservation.id}
          onSendAction={sendClientMessageAction}
          otherSideName={reservation.kennel?.name || t('el criador')}
          variant="fill"
        />
      }
    >
    {/* pb-24 xl:pb-0 → espacio para que el FAB del chat no tape el último card en móvil/tablet */}
    <div className="space-y-5 sm:space-y-7 pb-24 xl:pb-0">
      {/* Breadcrumb */}
      <Link
        href="/mis-reservas"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t('Mis reservas')}
      </Link>

      {/* ═══ HERO CARD ═══ */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-hairline bg-gradient-to-br from-canvas via-canvas to-surface-soft/60 p-4 sm:p-7 md:p-8">
        {/* Glow decorativo */}
        <div
          aria-hidden
          className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[#FE6620]/8 blur-3xl pointer-events-none"
        />
        <div className="relative flex items-start gap-3 sm:gap-5 flex-wrap">
          {reservation.kennel?.logo_url ? (
            kennelHref ? (
              <Link href={kennelHref} target="_blank" className="flex-shrink-0 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <Img
                  w={200}
                  src={reservation.kennel.logo_url}
                  alt={reservation.kennel.name}
                  className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl object-cover border border-hairline shadow-sm group-hover:shadow transition-shadow"
                />
              </Link>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <Img
                w={200}
                src={reservation.kennel.logo_url}
                alt={reservation.kennel?.name || ''}
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl object-cover border border-hairline shadow-sm flex-shrink-0"
              />
            )
          ) : (
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-ink text-on-primary flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0">
              {kennelInitial}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {t('Reserva con')}
            </p>
            <h1 className="mt-0.5 sm:mt-1 text-[22px] sm:text-[30px] md:text-[36px] font-bold tracking-[-0.035em] text-ink leading-[1.1] break-words">
              {reservation.kennel?.name ?? '—'}
            </h1>
            <p className="mt-1 text-[12.5px] sm:text-[13px] text-body max-w-2xl leading-snug">
              {meta.description}
            </p>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <StatusPill status={reservation.status} />
              <span className="text-[12px] text-muted inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {t('Reservada el')} {formatDate(reservation.created_at)}
              </span>
              {reservation.dog && (
                <span className="text-[12px] text-emerald-700 font-medium inline-flex items-center gap-1">
                  <Dog className="h-3 w-3" />
                  {reservation.dog.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Barra de progreso de hitos */}
        <div className="relative mt-6 pt-5 border-t border-hairline/60">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-muted">
              {t('Progreso')}
            </p>
            <p className="text-[11.5px] font-bold text-ink tabular-nums">
              {completedSteps} / {timeline.length} {t('hitos')}
            </p>
          </div>
          <div className="h-2 rounded-full bg-surface-soft overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* ═══ ACCIONES RÁPIDAS ═══ — 3 CTAs prominentes */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickAction
          href={`/mis-reservas/${reservation.id}/contrato`}
          icon={ScrollText}
          title={t('Contrato')}
          subtitle={
            allSigned
              ? `✓ ${t('Firmado')}`
              : pendingSignature
                ? t('Pendiente de tu firma')
                : t('Aún no enviado')
          }
          tone={pendingSignature ? 'amber' : allSigned ? 'emerald' : 'neutral'}
          badge={pendingSignature ? t('Acción') : null}
        />
        <QuickAction
          href={`/mis-reservas/${reservation.id}/pagos`}
          icon={Wallet}
          title={t('Pagos')}
          subtitle={
            reservation.total_price_cents != null
              ? `${formatPrice(reservation.total_price_cents, reservation.currency)}${totalPending != null && totalPending > 0 ? ` · ${formatPrice(totalPending, reservation.currency)} ${t('pendiente')}` : ''}`
              : t('Sin importes configurados')
          }
          tone={totalPending != null && totalPending > 0 ? 'amber' : 'neutral'}
        />
        <QuickAction
          href={`#mensajes`}
          icon={MessageCircle}
          title={t('Mensajes')}
          subtitle={messages.length === 0 ? t('Sin mensajes todavía') : `${messages.length} ${messages.length === 1 ? t('mensaje') : t('mensajes')}`}
          tone="neutral"
        />
      </section>

      {/* ═══ GRID PRINCIPAL: Timeline + Sidebar Económico ═══
          Apilado hasta xl- (mejor lectura en mobile/tablet/desktop pequeño) y
          side-by-side a xl+. Cuando el panel chat está abierto en xl, queda
          un poco apretado pero las 2 cols todavía respiran (≥860px). */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 sm:gap-6">
        {/* Timeline — pieza central */}
        <Card>
          <CardHeader
            title={t('Estado de tu reserva')}
            subtitle={`${completedSteps} ${t('de')} ${timeline.length} ${t('completados')}`}
          />
          <ReservationTimeline steps={timeline} t={t} />
        </Card>

        {/* Sidebar derecho — info económica */}
        <div className="space-y-5">
          <Card>
            <CardHeader title={t('Importes')} subtitle={t('Resumen económico')} />
            <dl className="space-y-3 text-[14px]">
              {reservation.deposit_amount_cents != null && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted">{t('Señal')}</dt>
                  <dd className="font-semibold text-ink tabular-nums">
                    {formatPrice(reservation.deposit_amount_cents, reservation.currency)}
                  </dd>
                </div>
              )}
              {reservation.total_price_cents != null && reservation.deposit_amount_cents != null && (
                <div className="flex items-center justify-between text-[13px]">
                  <dt className="text-muted">{t('Pago final estimado')}</dt>
                  <dd className="text-body tabular-nums">
                    {formatPrice(reservation.total_price_cents - reservation.deposit_amount_cents, reservation.currency)}
                  </dd>
                </div>
              )}
              {reservation.total_price_cents != null && (
                <div className="flex items-center justify-between pt-3 border-t border-hairline">
                  <dt className="text-ink font-semibold">{t('Total')}</dt>
                  <dd className="font-bold text-ink tabular-nums text-[18px]">
                    {formatPrice(reservation.total_price_cents, reservation.currency)}
                  </dd>
                </div>
              )}
              {reservation.deposit_amount_cents == null && reservation.total_price_cents == null && (
                <p className="text-[12.5px] text-muted italic py-2">
                  {t('El criador no ha configurado importes todavía.')}
                </p>
              )}
            </dl>
            <Link
              href={`/mis-reservas/${reservation.id}/pagos`}
              className="mt-5 inline-flex items-center gap-1.5 w-full justify-center rounded-lg bg-ink text-on-primary hover:opacity-90 px-3 py-2.5 text-[12.5px] font-semibold transition-opacity"
            >
              {t('Ver pagos y abonar')}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          {reservation.litter && (
            <Card>
              <CardHeader title={t('Camada')} subtitle={t('De donde viene tu cachorro')} icon={Heart} />
              <dl className="space-y-2.5 text-[13.5px]">
                {reservation.litter.expected_date && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">{t('Fecha esperada')}</dt>
                    <dd className="font-medium text-ink">{formatDate(reservation.litter.expected_date)}</dd>
                  </div>
                )}
                {reservation.litter.birth_date && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">{t('Nacimiento')}</dt>
                    <dd className="font-medium text-ink">{formatDate(reservation.litter.birth_date)}</dd>
                  </div>
                )}
              </dl>
            </Card>
          )}
        </div>
      </div>

      {/* ═══ Cachorro asignado + Tu solicitud — grid de cards ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Cachorro */}
        <Card>
          <CardHeader
            title={t('Cachorro asignado')}
            subtitle={reservation.dog ? t('Ya tiene tu nombre') : t('Aún no asignado')}
            icon={Dog}
          />
          {reservation.dog ? (
            <Link
              href={`/dogs/${reservation.dog.slug}`}
              target="_blank"
              className="group flex items-center gap-4 -m-2 p-2 rounded-xl hover:bg-surface-soft/50 transition-colors"
            >
              {reservation.dog.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <Img
                  w={200}
                  src={reservation.dog.thumbnail_url}
                  alt={reservation.dog.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-hairline group-hover:scale-[1.02] transition-transform"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-surface-card flex items-center justify-center text-muted">
                  <Dog className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[18px] font-bold text-ink truncate group-hover:text-[#FE6620] transition-colors">
                  {reservation.dog.name}
                </p>
                <p className="mt-1 text-[12px] text-muted inline-flex items-center gap-1">
                  {t('Ver ficha completa')}
                  <ExternalLink className="h-3 w-3" />
                </p>
              </div>
            </Link>
          ) : (
            <EmptyState
              icon={Dog}
              message={t('El criador asignará un cachorro concreto cuando llegue el momento. Te avisaremos.')}
            />
          )}
        </Card>

        {/* Tu solicitud */}
        {(reservation.applicant_message ||
          reservation.applicant_purpose ||
          reservation.preference_sex ||
          reservation.preference_color) ? (
          <Card>
            <CardHeader title={t('Tu solicitud')} subtitle={t('Lo que pediste al contactar')} icon={Inbox} />
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[13.5px]">
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
              <div className="mt-4 pt-4 border-t border-hairline">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                  {t('Mensaje al criador')}
                </p>
                <p className="text-[13.5px] text-body leading-[1.6] whitespace-pre-line italic">
                  &ldquo;{reservation.applicant_message}&rdquo;
                </p>
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <CardHeader title={t('Tu solicitud')} subtitle={t('Lo que pediste al contactar')} icon={Inbox} />
            <EmptyState icon={Inbox} message={t('No registramos preferencias concretas en tu solicitud.')} />
          </Card>
        )}
      </div>

      {/* ═══ Documentos del cachorro ═══ */}
      {(documents.length > 0 || reservation.dog) && (
        <Card>
          <CardHeader
            title={t('Documentos del cachorro')}
            subtitle={reservation.dog
              ? `${documents.length} ${documents.length === 1 ? t('archivo disponible') : t('archivos disponibles')}`
              : t('Aparecerán cuando se asigne un cachorro')}
            icon={FileText}
          />
          {documents.length > 0 ? (
            <ul className="divide-y divide-hairline -mx-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-4 py-3 px-2 rounded-lg hover:bg-surface-soft/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-card text-muted flex-shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-ink truncate">{doc.title}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mt-0.5">
                        {labelForType(doc.type)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-[12px] font-semibold text-body hover:border-ink/30 hover:bg-surface-soft hover:text-ink transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t('Descargar')}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={FileText}
              message={t('El criador subirá aquí cartilla veterinaria, microchip, pedigree, etc.')}
            />
          )}
        </Card>
      )}

      {isArchived && (
        <div className="rounded-xl bg-surface-soft border border-hairline p-4 text-[12.5px] text-muted flex items-start gap-3">
          <Archive className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{t('Esta reserva está archivada. Se mantiene visible para tu histórico pero ya no recibirá actualizaciones.')}</p>
        </div>
      )}
    </div>
    </ReservationChatPanel>
  )
}

// ─── Building blocks ───────────────────────────────────────────────────────

function Card({
  children, id, className = '',
}: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-hairline bg-canvas p-4 sm:p-6 min-w-0 ${className}`}
    >
      {children}
    </section>
  )
}

function CardHeader({
  title, subtitle, icon: Icon,
}: {
  title: string
  subtitle?: string
  icon?: React.ElementType
}) {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3 mb-4 sm:mb-5">
      {Icon && (
        <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-surface-soft text-ink flex-shrink-0">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-[14.5px] sm:text-[15.5px] font-bold tracking-[-0.01em] text-ink leading-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11.5px] text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 text-[13.5px] text-ink font-medium">{children}</dd>
    </div>
  )
}

function EmptyState({
  icon: Icon, message,
}: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex items-center gap-3 px-1 py-2 text-[12.5px] text-muted italic">
      <Icon className="h-4 w-4 flex-shrink-0 opacity-50" />
      <p className="leading-snug">{message}</p>
    </div>
  )
}

function QuickAction({
  href, icon: Icon, title, subtitle, tone, badge,
}: {
  href: string
  icon: React.ElementType
  title: string
  subtitle: string
  tone: 'neutral' | 'amber' | 'emerald'
  badge?: string | null
}) {
  const toneClass =
    tone === 'amber'
      ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/70 hover:border-amber-400'
      : tone === 'emerald'
      ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70 hover:border-emerald-400'
      : 'border-hairline bg-canvas hover:border-ink/30 hover:bg-surface-soft/40'
  const iconClass =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : tone === 'emerald'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-surface-soft text-ink'

  return (
    <Link
      href={href}
      className={`group relative rounded-xl sm:rounded-2xl border p-3.5 sm:p-5 flex items-center gap-3 transition-all ${toneClass}`}
    >
      {badge && (
        <span className="absolute top-2 right-2 inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl flex-shrink-0 ${iconClass}`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] sm:text-[14px] font-bold text-ink leading-tight">{title}</p>
        <p className="mt-0.5 text-[11.5px] text-muted truncate">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  )
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.interested
  const colorBg: Record<string, { bg: string; dot: string }> = {
    gray:    { bg: 'bg-gray-100 text-gray-700 ring-gray-200',          dot: 'bg-gray-400' },
    amber:   { bg: 'bg-amber-50 text-amber-800 ring-amber-200',        dot: 'bg-amber-500' },
    blue:    { bg: 'bg-blue-50 text-blue-800 ring-blue-200',           dot: 'bg-blue-500' },
    violet:  { bg: 'bg-violet-50 text-violet-800 ring-violet-200',     dot: 'bg-violet-500' },
    emerald: { bg: 'bg-emerald-50 text-emerald-800 ring-emerald-200',  dot: 'bg-emerald-500' },
    red:     { bg: 'bg-red-50 text-red-700 ring-red-200',              dot: 'bg-red-500' },
  }
  const c = colorBg[meta.color]
  return (
    <span
      className={`inline-flex items-center gap-1.5 shrink-0 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ring-1 ${c.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {meta.label}
    </span>
  )
}
