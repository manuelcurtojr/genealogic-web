import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsSubnav from '@/components/analytics/analytics-subnav'
import {
  getAnalytics,
  countryFlag,
  countryName,
  type AnalyticsData,
  type AnalyticsRange,
} from '@/lib/analytics'
import { RangeChips } from '@/components/analytics/range-chips'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Estadísticas web · Genealogic Pro' }

/**
 * Analytics de la web pública del criador — port del módulo de Pawdoq
 * (apps/tenant-breeder/app/admin/(protected)/estadisticas) adaptado a
 * kennel_id + tabla page_views extendida.
 *
 * Datos first-party: vienen de page_views que llena <PageTracker /> via
 * POST /api/track. Sin cookies. La IP no se persiste — solo un hash
 * diario para contar visitantes únicos (ver lib/analytics-shared.ts).
 */
export default async function VisitasPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const t = getTranslator(await getLocale())

  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id, name, slug')
    .eq('owner_id', user.id)
    .limit(1)
  const kennel = kennelArr?.[0]

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">{t('Estadísticas web')}</h1>
        <p className="text-body">{t('Necesitas un criadero registrado.')}</p>
      </div>
    )
  }

  const sp = await searchParams
  const rangeParam = (sp.range ?? 'month') as AnalyticsRange
  const range: AnalyticsRange = (['today', 'week', 'month', 'year'] as const).includes(rangeParam)
    ? rangeParam
    : 'month'

  const analytics = await getAnalytics({ kennelId: kennel.id, range })

  return (
    <div>
      <AnalyticsSubnav />
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Analytics
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-ink">
          {t('Estadísticas web')}
        </h1>
        <p className="mt-3 text-body max-w-2xl">
          {t('Visitas, fuentes de tráfico, países y dispositivos de quienes entran en tu web del criadero. Datos first-party — sin cookies y sin terceros.')}
        </p>
      </div>

      <div className="mt-8">
        <Dashboard data={analytics} range={range} t={t} />
      </div>
    </div>
  )
}

function Dashboard({ data, range, t }: { data: AnalyticsData; range: AnalyticsRange; t: (k: string) => string }) {
  const { kpi, timeseries, pages, referrers, countries, cities, devices } = data
  const maxTs = Math.max(1, ...timeseries.map((ts) => ts.visits))
  const maxPages = Math.max(1, ...pages.map((p) => p.visits))
  const maxRefs = Math.max(1, ...referrers.map((r) => r.visits))
  const maxCountries = Math.max(1, ...countries.map((c) => c.visits))
  const maxCities = Math.max(1, ...cities.map((c) => c.visits))
  const totalDevices = devices.reduce((s, d) => s + d.visits, 0)

  const nfmt = new Intl.NumberFormat('es-ES')
  const deviceLabel: Record<string, string> = {
    mobile: 'Móvil',
    tablet: 'Tablet',
    desktop: 'Escritorio',
  }

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label={t('Visitas')} value={nfmt.format(kpi.visits)} hint={data.rangeLabel.toLowerCase()} />
        <Kpi label={t('Visitantes únicos')} value={nfmt.format(kpi.uniqueVisitors)} hint={t('sesiones distintas')} />
        <Kpi
          label={t('Páginas / visitante')}
          value={kpi.pagesPerVisitor > 0 ? kpi.pagesPerVisitor.toFixed(1) : '—'}
          hint={t('profundidad media')}
        />
        <Kpi
          label={t('Rebote')}
          value={kpi.uniqueVisitors > 0 ? `${Math.round(kpi.bouncePct * 100)}%` : '—'}
          hint={t('sesiones de 1 sola página')}
          hintTone={kpi.bouncePct > 0.7 ? 'red' : 'neutral'}
        />
      </div>

      {/* Range chips */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">{t('Rango:')}</span>
        <RangeChips active={range} />
      </div>

      {/* Timeseries */}
      <section className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
        <h2 className="text-[16px] sm:text-[18px] font-semibold tracking-[-0.02em] text-ink">{t('Visitas en el tiempo')}</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          {range === 'today' ? t('Por hora (UTC).') : range === 'year' ? t('Por mes.') : t('Por día.')}
        </p>
        <div className="mt-6 sm:mt-8 flex h-40 sm:h-48 items-end gap-px sm:gap-1 border-b border-hairline pb-2">
          {timeseries.map((ts, i) => {
            const h = (ts.visits / maxTs) * 100
            const minH = ts.visits > 0 ? 4 : 0
            return (
              <div key={i} className="group relative flex h-full flex-1 items-end">
                <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11.5px] font-medium text-on-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  <div className="font-semibold">{ts.label}</div>
                  <div className="tabular-nums">{nfmt.format(ts.visits)} {t('visitas')}</div>
                </div>
                <div
                  className="w-full rounded-t-md bg-ink transition-opacity group-hover:opacity-80"
                  style={{ height: `${Math.max(h, minH)}%` }}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex gap-1">
          {timeseries.map((ts, i) => {
            const show = timeseries.length <= 12 || i % Math.ceil(timeseries.length / 12) === 0
            return (
              <div key={i} className="flex flex-1 justify-center text-[10.5px] text-muted">
                {show ? ts.label : ''}
              </div>
            )
          })}
        </div>
      </section>

      {/* Pages + Referrers */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ListSection title={t('Páginas más vistas')} empty={pages.length === 0} t={t}>
          {pages.map((p) => (
            <li key={p.path} className="px-4 sm:px-5 py-2.5 sm:py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-mono text-xs text-body">{p.path}</span>
                <span className="shrink-0 tabular-nums text-body">
                  <strong className="text-ink">{nfmt.format(p.visits)}</strong>
                  <span className="ml-1.5 text-xs text-muted">({nfmt.format(p.uniques)} {t('únicos')})</span>
                </span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-soft">
                <div className="h-full rounded-full bg-ink" style={{ width: `${(p.visits / maxPages) * 100}%` }} />
              </div>
            </li>
          ))}
        </ListSection>

        <ListSection title={t('Fuentes de tráfico')} empty={referrers.length === 0} t={t}>
          {referrers.map((r, i) => (
            <li key={`${r.referrer ?? 'direct'}-${i}`} className="px-4 sm:px-5 py-2.5 sm:py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-body">
                  {r.referrer ?? <span className="italic text-muted">{t('Directo / interno')}</span>}
                </span>
                <span className="shrink-0 tabular-nums font-semibold text-ink">{nfmt.format(r.visits)}</span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-soft">
                <div className="h-full rounded-full bg-ink/50" style={{ width: `${(r.visits / maxRefs) * 100}%` }} />
              </div>
            </li>
          ))}
        </ListSection>
      </div>

      {/* Countries + Cities */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ListSection title={t('Países')} empty={countries.length === 0} t={t}>
          {countries.map((c, i) => (
            <li key={`${c.country ?? 'unknown'}-${i}`} className="px-4 sm:px-5 py-2.5 sm:py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-body">
                  <span aria-hidden className="text-lg leading-none">{countryFlag(c.country)}</span>
                  <span>{countryName(c.country)}</span>
                </span>
                <span className="shrink-0 tabular-nums font-semibold text-ink">{nfmt.format(c.visits)}</span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-soft">
                <div className="h-full rounded-full bg-ink" style={{ width: `${(c.visits / maxCountries) * 100}%` }} />
              </div>
            </li>
          ))}
        </ListSection>

        <ListSection title={t('Ciudades')} empty={cities.length === 0} t={t}>
          {cities.map((c, i) => (
            <li key={`${c.city ?? 'unknown'}-${i}`} className="px-4 sm:px-5 py-2.5 sm:py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-body">
                  <strong className="text-ink">{c.city ?? '—'}</strong>
                  {c.region ? <span className="ml-1 text-xs text-muted">· {c.region}</span> : null}
                </span>
                <span className="shrink-0 tabular-nums font-semibold text-ink">{nfmt.format(c.visits)}</span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-soft">
                <div className="h-full rounded-full bg-ink/50" style={{ width: `${(c.visits / maxCities) * 100}%` }} />
              </div>
            </li>
          ))}
        </ListSection>
      </div>

      {/* Devices */}
      <section className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
        <h2 className="text-[16px] sm:text-xl font-semibold text-ink">{t('Dispositivos')}</h2>
        <p className="mt-1 text-xs text-muted">{t('Detectado por User-Agent (no se guarda el UA raw).')}</p>
        {totalDevices === 0 ? (
          <EmptyState label={t('Sin datos todavía.')} />
        ) : (
          <div className="mt-5 space-y-3">
            {['mobile', 'tablet', 'desktop'].map((d) => {
              const entry = devices.find((x) => x.device === d)
              const visits = entry?.visits ?? 0
              const share = totalDevices > 0 ? visits / totalDevices : 0
              const tone =
                d === 'mobile' ? 'bg-ink' : d === 'tablet' ? 'bg-ink/50' : 'bg-ink/80'
              return (
                <div key={d}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{deviceLabel[d] ? t(deviceLabel[d]) : d}</span>
                    <span className="tabular-nums text-body">
                      {nfmt.format(visits)} · {Math.round(share * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-soft">
                    <div className={`h-full rounded-full ${tone}`} style={{ width: `${share * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <p className="text-xs text-muted">
        {t('Analítica first-party. Sin cookies. No se almacena tu IP ni el User-Agent — solo un hash diario derivado para contar visitantes únicos.')}
      </p>
    </div>
  )
}

function ListSection({
  title, empty, children, t,
}: { title: string; empty: boolean; children: React.ReactNode; t: (k: string) => string }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-canvas ring-1 ring-hairline">
      <div className="border-b border-hairline px-4 sm:px-6 py-3 sm:py-4">
        <h2 className="text-[15px] sm:text-lg font-semibold text-ink">{title}</h2>
      </div>
      {empty ? <EmptyState label={t('Sin datos todavía.')} /> : <ul className="divide-y divide-hairline">{children}</ul>}
    </section>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="px-6 py-10 text-center text-sm text-muted">{label}</div>
}

function Kpi({
  label, value, hint, hintTone = 'neutral',
}: {
  label: string
  value: string
  hint?: string
  hintTone?: 'neutral' | 'green' | 'red'
}) {
  const hintCls =
    hintTone === 'green'
      ? 'text-emerald-700'
      : hintTone === 'red'
        ? 'text-red-600'
        : 'text-muted'
  return (
    <div className="rounded-2xl bg-canvas p-3.5 sm:p-5 ring-1 ring-hairline min-w-0">
      <div className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted truncate">{label}</div>
      <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-ink tabular-nums">{value}</div>
      {hint && <div className={`mt-1 text-[10.5px] sm:text-xs ${hintCls} leading-snug`}>{hint}</div>}
    </div>
  )
}
