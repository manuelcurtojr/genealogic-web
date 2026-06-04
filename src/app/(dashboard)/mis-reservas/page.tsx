/**
 * Panel del Propietario: lista de "Mis reservas".
 *
 * Visible para cualquier user con al menos una reserva vinculada
 * (puppy_reservations.client_user_id = me). Soporta multi-criador.
 *
 * Fase A — solo lectura. Las acciones (firmar contrato, pagar, mensajear)
 * llegan en Fases B/C.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getMyActiveReservations,
  getMyHistoricalReservations,
  STATUS_META,
  formatDate,
  formatPrice,
} from '@/lib/owner/reservations'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { Img } from '@/components/ui/img'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mis reservas · Genealogic' }

export default async function MisReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const tab = sp.tab === 'historial' ? 'historial' : 'activas'

  const [active, historical] = await Promise.all([
    getMyActiveReservations(user.id),
    getMyHistoricalReservations(user.id),
  ])

  const reservations = tab === 'historial' ? historical : active

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {t('Panel del propietario')}
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">
        {t('Mis reservas')}
      </h1>
      <p className="mt-2 text-body max-w-2xl">
        {t('Todas tus reservas de cachorros con cualquier criador en Genealogic. Estado en tiempo real, contratos y pagos en un solo sitio.')}
      </p>

      {/* Tabs activas / historial */}
      <div className="mt-8 flex items-center gap-0 border-b border-hairline">
        <TabLink
          label={t('Activas')}
          count={active.length}
          active={tab === 'activas'}
          href="/mis-reservas?tab=activas"
        />
        <TabLink
          label={t('Histórico')}
          count={historical.length}
          active={tab === 'historial'}
          href="/mis-reservas?tab=historial"
        />
      </div>

      {/* Contenido */}
      <div className="mt-8">
        {reservations.length === 0 ? (
          <EmptyState tab={tab} t={t} />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reservations.map((r) => (
              <ReservationCard key={r.id} reservation={r} archived={tab === 'historial'} t={t} />
            ))}
          </ul>
        )}
      </div>

      <p className="mt-10 text-xs text-muted">
        {t('¿Falta alguna reserva? Asegúrate de usar el mismo email con el que contactaste al criador. Si la reserva era antigua, debería aparecer automáticamente al iniciar sesión.')}
      </p>
    </div>
  )
}

function TabLink({
  label, count, active, href,
}: {
  label: string
  count: number
  active: boolean
  href: string
}) {
  return (
    <Link
      href={href}
      className={`text-[12px] font-semibold uppercase tracking-[0.14em] px-5 py-4 whitespace-nowrap transition-all relative -mb-px border-b-2 ${
        active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
      }`}
    >
      {label}
      <span className={`ml-2 text-[10px] font-mono ${active ? 'text-ink' : 'text-muted'}`}>
        {String(count).padStart(2, '0')}
      </span>
    </Link>
  )
}

function EmptyState({ tab, t }: { tab: 'activas' | 'historial'; t: (k: string) => string }) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-12 text-center">
      <p className="text-base font-semibold text-ink">
        {tab === 'historial'
          ? t('Sin reservas en histórico todavía.')
          : t('No tienes reservas activas.')}
      </p>
      <p className="mt-2 text-sm text-muted max-w-md mx-auto">
        {t('Cuando reserves un cachorro con un criador que use Genealogic, aparecerá aquí con su estado, contrato y pagos.')}
      </p>
      <Link
        href="/kennels"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition"
      >
        {t('Explorar criaderos')} →
      </Link>
    </div>
  )
}

import type { ClientReservation } from '@/lib/owner/reservations'

function ReservationCard({
  reservation, archived, t,
}: {
  reservation: ClientReservation
  archived: boolean
  t: (k: string) => string
}) {
  const meta = STATUS_META[reservation.status] ?? STATUS_META.interested
  const colorBg: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 ring-gray-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    blue: 'bg-blue-50 text-blue-800 ring-blue-200',
    violet: 'bg-violet-50 text-violet-800 ring-violet-200',
    emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
  }

  return (
    <li>
      <Link
        href={`/mis-reservas/${reservation.id}`}
        className={`block rounded-2xl border border-hairline bg-canvas p-5 hover:border-ink/30 hover:shadow-sm transition-all ${
          archived ? 'opacity-75 hover:opacity-100' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {reservation.kennel?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <Img
                w={120}
                src={reservation.kennel.logo_url}
                alt={reservation.kennel.name}
                className="w-10 h-10 rounded-full object-cover border border-hairline"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-card flex items-center justify-center text-sm font-bold text-ink">
                {reservation.kennel?.name[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                {t('Criador')}
              </p>
              <p className="text-sm font-bold text-ink truncate">
                {reservation.kennel?.name ?? '—'}
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ring-1 ${colorBg[meta.color]}`}
          >
            {meta.label}
          </span>
        </div>

        {reservation.dog && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-soft p-3">
            {reservation.dog.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <Img
                w={200}
                src={reservation.dog.thumbnail_url}
                alt={reservation.dog.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                {t('Cachorro asignado')}
              </p>
              <p className="text-sm font-semibold text-ink truncate">{reservation.dog.name}</p>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Reservada')}</p>
            <p className="text-ink font-medium">{formatDate(reservation.created_at)}</p>
          </div>
          {reservation.deposit_amount_cents != null && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Seña')}</p>
              <p className="text-ink font-medium">
                {formatPrice(reservation.deposit_amount_cents, reservation.currency)}
              </p>
            </div>
          )}
          {reservation.position_in_queue != null && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Posición')}</p>
              <p className="text-ink font-medium">#{reservation.position_in_queue}</p>
            </div>
          )}
          {archived && reservation.delivered_at && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t('Entregado')}</p>
              <p className="text-ink font-medium">{formatDate(reservation.delivered_at)}</p>
            </div>
          )}
        </div>
      </Link>
    </li>
  )
}
