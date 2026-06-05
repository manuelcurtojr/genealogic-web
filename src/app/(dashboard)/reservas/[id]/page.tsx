/**
 * Detalle de una reserva — vista del criador.
 *
 * Diseño orientado a "qué necesito hacer con este lead":
 *
 *   1. Breadcrumb
 *   2. Hero — applicant + status + cuenta vinculada + reservada el X
 *   3. Acciones rápidas — Contrato / Pagos / Mensajes / Asignar perro
 *   4. Asignar cachorro (DogAssignmentBar) → si se asigna, regenera el
 *      body_html del contrato draft automáticamente.
 *   5. Sidebar derecho con cobros (PaymentMilestonesCard) + cachorro card
 *      + papeles del perro.
 *   6. Mensajería full-width al final.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { listReservationMessages, markThreadRead } from '@/lib/reservations/messages'
import ReservationThread from '@/components/reservations/reservation-thread'
import ReservationChatPanel from '@/components/reservations/reservation-chat-panel'
import { sendBreederMessageAction, quickMarkPaymentReceivedAction } from './actions'
import { assignDogToReservationAction } from './contrato/actions'
import PaymentMilestonesCard from '@/components/reservations/payment-milestones-card'
import DogAssignmentBar from '@/components/contracts/dog-assignment-bar'
import type { KennelDogOption } from '@/components/contracts/contract-fill-panel'
import FeedbackButton from '@/components/feedback/feedback-button'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { Img } from '@/components/ui/img'
import {
  ArrowLeft, ScrollText, Wallet, MessageCircle, Dog, FileText, Calendar,
  Mail, Phone, ChevronRight, ExternalLink, User, Inbox, Heart,
  CheckCircle2, Globe,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reserva · Genealogic' }

export default async function BreederReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const t = getTranslator(await getLocale())

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: reservation } = await admin
    .from('puppy_reservations')
    .select(`*,
      kennel:kennels(id, name, slug, owner_id),
      dog:dogs!dog_id(id, slug, name, thumbnail_url, sex, microchip, birth_date, breed:breeds(name), color:colors(name))
    `)
    .eq('id', id)
    .maybeSingle()
  if (!reservation) notFound()
  if (reservation.kennel?.owner_id !== user.id) redirect('/reservas')

  // Cargar contratos para mostrar estado en acciones rápidas
  const { data: contracts } = await admin
    .from('reservation_contracts')
    .select('kind, status, signed_at_breeder, signed_at_client')
    .eq('reservation_id', reservation.id)
  const contractsList = (contracts || []) as Array<{
    kind: 'reservation' | 'delivery'
    status: string
    signed_at_breeder: string | null
    signed_at_client: string | null
  }>
  const hasActiveContract = contractsList.some((c) => c.status !== 'cancelled' && c.status !== 'draft')
  const allSigned = contractsList.length > 0 && contractsList.every((c) => c.status === 'signed_full' || c.status === 'cancelled')

  // Perros del criadero para el selector
  const kennelDogs = await loadKennelDogs(admin, reservation.kennel?.id)

  const messages = await listReservationMessages(reservation.id)
  // Importante: el conteo de unread tiene que calcularse ANTES de marcar
  // el thread como leído. Si no, siempre es 0.
  const unreadCount = messages.filter((m) =>
    m.sender_role === 'client' && !('read_at' in m && m.read_at)
  ).length
  markThreadRead(reservation.id, 'breeder').catch(() => {})

  const hasClientAccount = !!reservation.client_user_id
  const applicantInitial = (reservation.applicant_name || reservation.applicant_email || '?')[0]?.toUpperCase() || '?'
  const applicantDisplayName = reservation.applicant_name || reservation.applicant_email || t('el cliente')
  const statusLabel = STATUS_LABEL[reservation.status as keyof typeof STATUS_LABEL] || reservation.status
  const statusTone = STATUS_TONE[reservation.status as keyof typeof STATUS_TONE] || 'gray'

  const chatBody = hasClientAccount ? (
    <ReservationThread
      messages={messages}
      currentRole="breeder"
      reservationId={reservation.id}
      onSendAction={sendBreederMessageAction}
      otherSideName={reservation.applicant_name || t('el cliente')}
      variant="fill"
    />
  ) : (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft/40 px-5 py-6 text-center max-w-sm">
        <p className="text-[13.5px] font-semibold text-ink">{t('Cliente sin cuenta')}</p>
        <p className="mt-1 text-[12.5px] text-body leading-snug">
          {t('Cuando el cliente cree cuenta en Genealogic con el email')}{' '}
          <strong>{reservation.applicant_email}</strong>
          {t(', podrás chatear aquí. Mientras tanto, usa email/WhatsApp.')}
        </p>
      </div>
    </div>
  )

  return (
    <ReservationChatPanel
      otherSideLogoUrl={null}
      otherSideName={applicantDisplayName}
      otherSideTagline={hasClientAccount ? t('Cliente · Genealogic') : t('Cliente sin cuenta')}
      unreadCount={unreadCount}
      chatBody={chatBody}
    >
    <div className="space-y-6 sm:space-y-7">
      <FeedbackButton scope="reservation_form" pageLabel={t('Detalle de reserva')} />

      {/* Breadcrumb */}
      <Link
        href="/embudo"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t('Volver al embudo')}
      </Link>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-canvas via-canvas to-surface-soft/60 p-6 sm:p-8">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[#FE6620]/8 blur-3xl pointer-events-none"
        />
        <div className="relative flex items-start gap-4 sm:gap-5 flex-wrap">
          {/* Avatar con iniciales */}
          <div className="h-16 w-16 rounded-2xl bg-ink text-on-primary flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {applicantInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {t('Solicitud de')}
            </p>
            <h1 className="mt-1 text-[28px] sm:text-[36px] font-bold tracking-[-0.035em] text-ink leading-[1.05]">
              {reservation.applicant_name || t('Sin nombre')}
            </h1>
            <div className="mt-2 flex items-center gap-3 flex-wrap text-[12.5px]">
              {reservation.applicant_email && (
                <a
                  href={`mailto:${reservation.applicant_email}`}
                  className="inline-flex items-center gap-1 text-body hover:text-ink transition-colors min-w-0"
                >
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{reservation.applicant_email}</span>
                </a>
              )}
              {reservation.applicant_phone && (
                <a
                  href={`tel:${reservation.applicant_phone}`}
                  className="inline-flex items-center gap-1 text-body hover:text-ink transition-colors"
                >
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  {reservation.applicant_phone}
                </a>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <StatusPill label={statusLabel} tone={statusTone} />
              {hasClientAccount ? (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {t('Cuenta vinculada')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11.5px] text-muted">
                  <User className="h-3 w-3" />
                  {t('Sin cuenta — solo email')}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11.5px] text-muted">
                <Calendar className="h-3 w-3" />
                {t('Recibida')} {formatDate(reservation.created_at)}
              </span>
              {reservation.source === 'public_form' && (
                <span className="inline-flex items-center gap-1 text-[11.5px] text-muted">
                  <Globe className="h-3 w-3" />
                  {t('Formulario web')}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ACCIONES RÁPIDAS ═══ */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickAction
          href={`/reservas/${reservation.id}/contrato`}
          icon={ScrollText}
          title={t('Contrato')}
          subtitle={
            allSigned
              ? `✓ ${t('Firmado por ambas partes')}`
              : hasActiveContract
                ? t('Enviado, esperando firma')
                : t('Crear contrato')
          }
          tone={allSigned ? 'emerald' : hasActiveContract ? 'amber' : 'neutral'}
        />
        <QuickAction
          href={`/reservas/${reservation.id}/pagos`}
          icon={Wallet}
          title={t('Pagos')}
          subtitle={
            reservation.total_price_cents != null
              ? formatPrice(reservation.total_price_cents, reservation.currency || 'EUR')
              : t('Configurar importes')
          }
          tone={reservation.deposit_paid_at && !reservation.paid_in_full_at ? 'amber' : 'neutral'}
        />
        <QuickAction
          href="#mensajes"
          icon={MessageCircle}
          title={t('Mensajes')}
          subtitle={
            !hasClientAccount
              ? t('Sin cuenta del cliente')
              : messages.length === 0
                ? t('Empezar conversación')
                : `${messages.length} ${messages.length === 1 ? t('mensaje') : t('mensajes')}`
          }
          tone="neutral"
        />
      </section>

      {/* ═══ Asignar cachorro ═══ */}
      <Card>
        <CardHeader
          title={t('Cachorro asignado a esta reserva')}
          subtitle={t('Al asignar un perro, sus datos rellenan automáticamente el contrato (raza, color, microchip, etc.). Si todavía no tienes el cachorro concreto, déjalo en blanco.')}
          icon={Dog}
        />
        <DogAssignmentBar
          reservationId={reservation.id}
          assignedDogId={reservation.dog_id || null}
          kennelDogs={kennelDogs}
          disabled={false}
          onAssignDogAction={assignDogToReservationAction}
        />
      </Card>

      {/* ═══ Grid: Tu solicitud + Cobros ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-5 sm:gap-6">
        {/* LEFT — Solicitud del cliente */}
        <Card>
          <CardHeader
            title={t('Solicitud del cliente')}
            subtitle={t('Lo que rellenó en el formulario')}
            icon={Inbox}
          />
          {(reservation.applicant_message ||
            reservation.applicant_purpose ||
            reservation.preference_sex ||
            reservation.preference_color) ? (
            <>
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
                {(reservation.applicant_city || reservation.applicant_country) && (
                  <Field label={t('Ubicación')}>
                    {[reservation.applicant_city, reservation.applicant_country].filter(Boolean).join(', ')}
                  </Field>
                )}
              </dl>
              {reservation.applicant_message && (
                <div className="mt-4 pt-4 border-t border-hairline">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                    {t('Mensaje del cliente')}
                  </p>
                  <p className="text-[13.5px] text-body leading-[1.6] whitespace-pre-line italic">
                    &ldquo;{reservation.applicant_message}&rdquo;
                  </p>
                </div>
              )}
              {reservation.internal_note && (
                <div className="mt-4 pt-4 border-t border-hairline">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-2">
                    🗒 {t('Nota interna (solo tú la ves)')}
                  </p>
                  <p className="text-[13px] text-body leading-snug whitespace-pre-line bg-amber-50/40 rounded-lg p-3 border border-amber-200">
                    {reservation.internal_note}
                  </p>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Inbox}
              message={t('Este lead no rellenó preferencias concretas en el formulario.')}
            />
          )}
        </Card>

        {/* RIGHT — Cobros + (si dog asignado) ficha rápida del perro */}
        <div className="space-y-5">
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

          {/* Ficha rápida del perro si está asignado */}
          {reservation.dog && (
            <Card>
              <CardHeader title={t('Ficha del cachorro')} subtitle={t('Datos del perro asignado')} icon={Heart} />
              <Link
                href={`/dogs/${reservation.dog.slug || reservation.dog.id}`}
                target="_blank"
                className="group flex items-center gap-3 -m-2 p-2 rounded-xl hover:bg-surface-soft/50 transition-colors"
              >
                {reservation.dog.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Img
                    w={200}
                    src={reservation.dog.thumbnail_url}
                    alt={reservation.dog.name}
                    className="w-14 h-14 rounded-xl object-cover border border-hairline group-hover:scale-[1.03] transition-transform flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-surface-card flex items-center justify-center text-muted flex-shrink-0">
                    <Dog className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold text-ink truncate group-hover:text-[#FE6620] transition-colors">
                    {reservation.dog.name}
                  </p>
                  <p className="text-[11.5px] text-muted truncate">
                    {[
                      reservation.dog.breed?.name,
                      reservation.dog.sex === 'male' ? 'Macho' : reservation.dog.sex === 'female' ? 'Hembra' : null,
                      reservation.dog.color?.name,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted group-hover:text-ink flex-shrink-0" />
              </Link>
              <Link
                href={`/dogs/${reservation.dog.id}/papeles`}
                className="mt-3 inline-flex items-center gap-1.5 w-full justify-center rounded-lg border border-hairline px-3 py-2 text-[12px] font-semibold text-body hover:border-ink/30 hover:bg-surface-soft hover:text-ink transition"
              >
                <FileText className="h-3.5 w-3.5" />
                {t('Gestionar papeles')}
              </Link>
            </Card>
          )}
        </div>
      </div>

    </div>
    </ReservationChatPanel>
  )
}

// ─── Server helper: load kennel dogs ───────────────────────────────────────

async function loadKennelDogs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  kennelId: string | null | undefined,
): Promise<KennelDogOption[]> {
  if (!kennelId) return []
  const { data } = await admin
    .from('dogs')
    .select(`
      id, name, sex, microchip, registration, birth_date, thumbnail_url,
      breed:breeds(name),
      color:colors(name)
    `)
    .eq('kennel_id', kennelId)
    .order('name')
    .limit(500)
  return ((data || []) as Array<Record<string, unknown>>).map((d) => ({
    id: d.id as string,
    name: d.name as string,
    sex: (d.sex as 'male' | 'female' | null) || null,
    microchip: (d.microchip as string | null) || null,
    registration: (d.registration as string | null) || null,
    birthDate: (d.birth_date as string | null) || null,
    thumbnailUrl: (d.thumbnail_url as string | null) || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    breedName: ((d.breed as any)?.name as string | null) || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    colorName: ((d.color as any)?.name as string | null) || null,
  }))
}

// ─── Building blocks ───────────────────────────────────────────────────────

function Card({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6 min-w-0"
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
    <div className="flex items-start gap-3 mb-5">
      {Icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-soft text-ink flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-[15.5px] font-bold tracking-[-0.01em] text-ink leading-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11.5px] text-muted leading-snug">{subtitle}</p>}
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

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex items-center gap-3 px-1 py-2 text-[12.5px] text-muted italic">
      <Icon className="h-4 w-4 flex-shrink-0 opacity-50" />
      <p className="leading-snug">{message}</p>
    </div>
  )
}

function QuickAction({
  href, icon: Icon, title, subtitle, tone,
}: {
  href: string
  icon: React.ElementType
  title: string
  subtitle: string
  tone: 'neutral' | 'amber' | 'emerald'
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
      className={`group relative rounded-2xl border p-4 sm:p-5 flex items-center gap-3 transition-all ${toneClass}`}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-ink leading-tight">{title}</p>
        <p className="mt-0.5 text-[11.5px] text-muted truncate">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  )
}

function StatusPill({ label, tone }: { label: string; tone: 'gray' | 'blue' | 'amber' | 'violet' | 'emerald' | 'red' }) {
  const colorBg: Record<string, { bg: string; dot: string }> = {
    gray:    { bg: 'bg-gray-100 text-gray-700 ring-gray-200',          dot: 'bg-gray-400' },
    amber:   { bg: 'bg-amber-50 text-amber-800 ring-amber-200',        dot: 'bg-amber-500' },
    blue:    { bg: 'bg-blue-50 text-blue-800 ring-blue-200',           dot: 'bg-blue-500' },
    violet:  { bg: 'bg-violet-50 text-violet-800 ring-violet-200',     dot: 'bg-violet-500' },
    emerald: { bg: 'bg-emerald-50 text-emerald-800 ring-emerald-200',  dot: 'bg-emerald-500' },
    red:     { bg: 'bg-red-50 text-red-700 ring-red-200',              dot: 'bg-red-500' },
  }
  const c = colorBg[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 shrink-0 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ring-1 ${c.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  interested: 'Solicitud nueva',
  waitlisted: 'Lista de espera',
  deposit_paid: 'Señal recibida',
  assigned: 'Cachorro asignado',
  contract_signed: 'Contrato firmado',
  paid_in_full: 'Pagado',
  delivered: 'Entregado',
  cancelled: 'Cancelada',
}

const STATUS_TONE: Record<string, 'gray' | 'blue' | 'amber' | 'violet' | 'emerald' | 'red'> = {
  interested: 'gray',
  waitlisted: 'amber',
  deposit_paid: 'blue',
  assigned: 'violet',
  contract_signed: 'violet',
  paid_in_full: 'emerald',
  delivered: 'emerald',
  cancelled: 'red',
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatPrice(cents: number, currency: string = 'EUR'): string {
  const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency })
  return fmt.format(cents / 100)
}
