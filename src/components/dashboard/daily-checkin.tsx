import { createClient } from '@/lib/supabase/server'
import { AlertCircle, CalendarCheck, CalendarClock, ArrowRight, CheckCircle2, Stethoscope, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

interface DailyCheckInProps {
  userId: string
}

/**
 * Daily Check-In — resumen diario al estilo "Cal" para el dashboard.
 * 3 KPIs: Vencidos / Hoy / Próximos 14 días.
 * Agrega vet_reminders + events (calendario) en una sola visión.
 * Server component: hace sus propias queries para mantener page.tsx limpio.
 */
export default async function DailyCheckIn({ userId }: DailyCheckInProps) {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()

  // Fechas (ISO YYYY-MM-DD y timestamptz)
  const now = new Date()
  const todayISO = now.toISOString().split('T')[0]
  const tomorrowDate = new Date(now.getTime() + 86400000)
  const tomorrowISO = tomorrowDate.toISOString().split('T')[0]
  const sevenDaysAgoISO = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]
  const fourteenDaysAheadISO = new Date(now.getTime() + 14 * 86400000).toISOString().split('T')[0]

  const todayStart = todayISO + 'T00:00:00'
  const tomorrowStart = tomorrowISO + 'T00:00:00'
  const sevenDaysAgoStart = sevenDaysAgoISO + 'T00:00:00'
  const fourteenDaysAheadEnd = fourteenDaysAheadISO + 'T23:59:59'

  // Fetch all counts + today details in parallel
  const [
    vetOverdueRes,
    vetTodayRes,
    vetUpcomingRes,
    eventsOverdueRes,
    eventsTodayRes,
    eventsUpcomingRes,
  ] = await Promise.all([
    // Vet reminders vencidos (últimos 7 días, no completados)
    supabase
      .from('vet_reminders')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .is('completed_date', null)
      .gte('due_date', sevenDaysAgoISO)
      .lt('due_date', todayISO),

    // Vet reminders hoy (con detalle)
    supabase
      .from('vet_reminders')
      .select('id, title, type, dog:dogs(name, slug)')
      .eq('owner_id', userId)
      .is('completed_date', null)
      .eq('due_date', todayISO),

    // Vet reminders próximos 14 días
    supabase
      .from('vet_reminders')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .is('completed_date', null)
      .gte('due_date', tomorrowISO)
      .lte('due_date', fourteenDaysAheadISO),

    // Events vencidos (últimos 7 días, no completados)
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('is_completed', false)
      .gte('start_date', sevenDaysAgoStart)
      .lt('start_date', todayStart),

    // Events hoy (con detalle)
    supabase
      .from('events')
      .select('id, title, event_type, dog_id, litter_id')
      .eq('owner_id', userId)
      .eq('is_completed', false)
      .gte('start_date', todayStart)
      .lt('start_date', tomorrowStart)
      .order('start_date'),

    // Events próximos 14 días
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('is_completed', false)
      .gte('start_date', tomorrowStart)
      .lte('start_date', fourteenDaysAheadEnd),
  ])

  const overdueCount = (vetOverdueRes.count || 0) + (eventsOverdueRes.count || 0)
  const todayCount = (vetTodayRes.data?.length || 0) + (eventsTodayRes.data?.length || 0)
  const upcomingCount = (vetUpcomingRes.count || 0) + (eventsUpcomingRes.count || 0)
  const total = overdueCount + todayCount + upcomingCount

  // Etiquetas legibles para event_type y vet type
  const vetTypeLabel: Record<string, string> = {
    vaccine: t('Vacuna'),
    deworming: t('Desparasitación'),
    checkup: t('Revisión'),
    custom: t('Veterinario'),
  }
  const eventTypeLabel: Record<string, string> = {
    heat: t('Celo'),
    mating: t('Cruce'),
    birth: t('Parto'),
    vet: t('Veterinario'),
    grooming: t('Aseo'),
    show: t('Exposición'),
    other: t('Evento'),
  }

  // Unificar la lista de eventos de hoy
  type TodayItem = { id: string; title: string; type: string; href: string; kind: 'vet' | 'event' }
  const todayItems: TodayItem[] = [
    ...((vetTodayRes.data as any[]) || []).map((r) => ({
      id: 'vet-' + r.id,
      title: r.title || t('Recordatorio veterinario'),
      type: vetTypeLabel[r.type] || t('Veterinario'),
      href: r.dog?.slug ? `/dogs/${r.dog.slug}` : '/vet',
      kind: 'vet' as const,
    })),
    ...((eventsTodayRes.data as any[]) || []).map((e) => ({
      id: 'evt-' + e.id,
      title: e.title || t('Evento'),
      type: eventTypeLabel[e.event_type] || t('Evento'),
      href: e.litter_id ? `/litters/${e.litter_id}` : e.dog_id ? `/dogs/${e.dog_id}` : '/calendar',
      kind: 'event' as const,
    })),
  ]

  return (
    <section className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{t('Resumen diario')}</p>
          <h2 className="mt-0.5 text-[20px] font-semibold tracking-[-0.03em] text-ink">
            {t('Tu día en Genealogic')}
          </h2>
        </div>
        {total === 0 && (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[color:var(--success)]/10 px-3 py-1 text-[12px] font-medium text-[color:var(--success)]">
            <CheckCircle2 className="h-3.5 w-3.5" /> {t('Al día')}
          </span>
        )}
      </div>

      {/* 3 KPI cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Vencidos */}
        <Link
          href="/calendar"
          className={`group rounded-xl border p-4 transition-colors ${
            overdueCount > 0
              ? 'border-[color:var(--error)]/30 bg-[color:var(--error)]/5 hover:bg-[color:var(--error)]/10'
              : 'border-hairline bg-surface-soft hover:bg-surface-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
              {t('Vencidos')}
            </span>
            <AlertCircle
              className={`h-3.5 w-3.5 ${
                overdueCount > 0 ? 'text-[color:var(--error)]' : 'text-muted'
              }`}
            />
          </div>
          <p
            className={`mt-2 text-[32px] font-semibold leading-none tabular-nums ${
              overdueCount > 0 ? 'text-[color:var(--error)]' : 'text-ink'
            }`}
          >
            {overdueCount}
          </p>
          <p className="mt-2 text-[12px] text-muted">{t('Últimos 7 días')}</p>
        </Link>

        {/* Hoy */}
        <Link
          href="/calendar"
          className="group rounded-xl border border-hairline bg-surface-soft p-4 transition-colors hover:bg-surface-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
              {t('Hoy')}
            </span>
            <CalendarCheck className="h-3.5 w-3.5 text-muted" />
          </div>
          <p className="mt-2 text-[32px] font-semibold leading-none tabular-nums text-ink">
            {todayCount}
          </p>
          <p className="mt-2 text-[12px] text-muted">{t('Tareas programadas')}</p>
        </Link>

        {/* Próximos */}
        <Link
          href="/calendar"
          className="group rounded-xl border border-hairline bg-surface-soft p-4 transition-colors hover:bg-surface-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
              {t('Próximos 14d')}
            </span>
            <CalendarClock className="h-3.5 w-3.5 text-muted" />
          </div>
          <p className="mt-2 text-[32px] font-semibold leading-none tabular-nums text-ink">
            {upcomingCount}
          </p>
          <p className="mt-2 text-[12px] text-muted">{t('Por venir')}</p>
        </Link>
      </div>

      {/* Lista de eventos de hoy */}
      {todayItems.length > 0 && (
        <div className="mt-5 border-t border-hairline-soft pt-4">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
            {t('Para hoy')}
          </p>
          <ul className="space-y-1">
            {todayItems.slice(0, 4).map((e) => {
              const Icon = e.kind === 'vet' ? Stethoscope : CalendarIcon
              return (
                <li key={e.id}>
                  <Link
                    href={e.href}
                    className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface-soft"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted" />
                      <span className="truncate text-[13.5px] text-ink">{e.title}</span>
                      <span className="hidden flex-shrink-0 text-[11px] uppercase tracking-wider text-muted sm:inline">
                        {e.type}
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              )
            })}
          </ul>
          {todayItems.length > 4 && (
            <Link
              href="/calendar"
              className="mt-2 inline-block px-3 text-[12.5px] font-medium text-body hover:text-ink"
            >
              {t('Ver')} {todayItems.length - 4} {t('más')} →
            </Link>
          )}
        </div>
      )}

      {/* Empty state — first-time user con todo a cero */}
      {total === 0 && (
        <div className="mt-5 border-t border-hairline-soft pt-4">
          <p className="text-[13px] text-body">
            {t('No hay tareas pendientes. Cuando programes vacunas, eventos o cruces, aparecerán aquí.')}
          </p>
        </div>
      )}
    </section>
  )
}
