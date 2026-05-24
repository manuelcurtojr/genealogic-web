/**
 * Agregación de analítica web para la página de Visitas del criador.
 * Port del módulo de Pawdoq adaptado a Genealogic (kennel_id en lugar
 * de tenant_id; mismo schema page_views + columnas extra).
 */
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export type AnalyticsRange = 'today' | 'week' | 'month' | 'year'

export type PageViewRow = {
  session_id: string | null
  path: string
  referrer: string | null
  country: string | null
  region: string | null
  city: string | null
  device: string | null
  browser: string | null
  os: string | null
  created_at: string
}

export type AnalyticsData = {
  range: AnalyticsRange
  rangeLabel: string
  kpi: {
    visits: number
    uniqueVisitors: number
    pagesPerVisitor: number
    bouncePct: number
  }
  timeseries: { bucket: string; label: string; visits: number }[]
  pages: { path: string; visits: number; uniques: number }[]
  referrers: { referrer: string | null; visits: number }[]
  countries: { country: string | null; visits: number }[]
  cities: { city: string | null; region: string | null; visits: number }[]
  devices: { device: string; visits: number }[]
}

function rangeStart(range: AnalyticsRange, now: Date): Date {
  const d = new Date(now)
  switch (range) {
    case 'today':
      d.setUTCHours(0, 0, 0, 0); return d
    case 'week':
      d.setUTCDate(d.getUTCDate() - 7); return d
    case 'month':
      d.setUTCDate(d.getUTCDate() - 30); return d
    case 'year':
      d.setUTCFullYear(d.getUTCFullYear() - 1); return d
  }
}

function bucketOf(range: AnalyticsRange, iso: string): string {
  const d = new Date(iso)
  if (range === 'today') return d.toISOString().slice(0, 13)
  if (range === 'year') return d.toISOString().slice(0, 7)
  return d.toISOString().slice(0, 10)
}

function bucketLabel(range: AnalyticsRange, bucket: string): string {
  if (range === 'today') return `${bucket.slice(11, 13)}:00`
  if (range === 'year') {
    const [y, m] = bucket.split('-')
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${months[parseInt(m!, 10) - 1]} ${y!.slice(2)}`
  }
  const [, m, day] = bucket.split('-')
  return `${day}/${m}`
}

function rangeLabelText(range: AnalyticsRange): string {
  switch (range) {
    case 'today': return 'Hoy'
    case 'week': return 'Últimos 7 días'
    case 'month': return 'Últimos 30 días'
    case 'year': return 'Último año'
  }
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * Fetchea page_views del rango y agrega en memoria.
 * Para volúmenes esperados (~decenas de miles/año por kennel) es suficiente.
 */
export async function getAnalytics({
  kennelId,
  range,
}: {
  kennelId: string
  range: AnalyticsRange
}): Promise<AnalyticsData> {
  const now = new Date()
  const from = rangeStart(range, now)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = admin() as any
  const { data } = await supabase
    .from('page_views')
    .select('session_id, path, referrer, country, region, city, device, browser, os, created_at')
    .eq('kennel_id', kennelId)
    .gte('created_at', from.toISOString())
    .order('created_at', { ascending: true })

  const rows: PageViewRow[] = data ?? []

  // KPIs
  const uniqueSessions = new Set<string>()
  const sessionPageCount = new Map<string, number>()
  for (const r of rows) {
    const sid = r.session_id ?? 'unknown'
    uniqueSessions.add(sid)
    sessionPageCount.set(sid, (sessionPageCount.get(sid) ?? 0) + 1)
  }
  const visits = rows.length
  const uniqueVisitors = uniqueSessions.size
  const pagesPerVisitor = uniqueVisitors > 0 ? visits / uniqueVisitors : 0
  const bouncers = Array.from(sessionPageCount.values()).filter((n) => n === 1).length
  const bouncePct = uniqueVisitors > 0 ? bouncers / uniqueVisitors : 0

  // Timeseries (con huecos rellenados)
  const buckets = new Map<string, number>()
  for (const r of rows) {
    const b = bucketOf(range, r.created_at)
    buckets.set(b, (buckets.get(b) ?? 0) + 1)
  }
  const timeseries: { bucket: string; label: string; visits: number }[] = []
  if (range === 'today') {
    const dayStart = new Date(now); dayStart.setUTCHours(0, 0, 0, 0)
    for (let h = 0; h <= now.getUTCHours(); h++) {
      const b = new Date(dayStart.getTime() + h * 3600_000).toISOString().slice(0, 13)
      timeseries.push({ bucket: b, label: bucketLabel(range, b), visits: buckets.get(b) ?? 0 })
    }
  } else if (range === 'year') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i)
      const b = d.toISOString().slice(0, 7)
      timeseries.push({ bucket: b, label: bucketLabel(range, b), visits: buckets.get(b) ?? 0 })
    }
  } else {
    const days = range === 'week' ? 7 : 30
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setUTCDate(d.getUTCDate() - i)
      const b = d.toISOString().slice(0, 10)
      timeseries.push({ bucket: b, label: bucketLabel(range, b), visits: buckets.get(b) ?? 0 })
    }
  }

  // Pages
  const pageVisits = new Map<string, { visits: number; uniques: Set<string> }>()
  for (const r of rows) {
    const cur = pageVisits.get(r.path) ?? { visits: 0, uniques: new Set<string>() }
    cur.visits++
    cur.uniques.add(r.session_id ?? 'unknown')
    pageVisits.set(r.path, cur)
  }
  const pages = Array.from(pageVisits.entries())
    .map(([path, v]) => ({ path, visits: v.visits, uniques: v.uniques.size }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10)

  // Referrers
  const refMap = new Map<string | null, number>()
  for (const r of rows) refMap.set(r.referrer, (refMap.get(r.referrer) ?? 0) + 1)
  const referrers = Array.from(refMap.entries())
    .map(([referrer, v]) => ({ referrer, visits: v }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10)

  // Countries
  const countryMap = new Map<string | null, number>()
  for (const r of rows) countryMap.set(r.country, (countryMap.get(r.country) ?? 0) + 1)
  const countries = Array.from(countryMap.entries())
    .map(([country, v]) => ({ country, visits: v }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10)

  // Cities
  const cityMap = new Map<string, { city: string | null; region: string | null; visits: number }>()
  for (const r of rows) {
    const key = `${r.city ?? ''}|${r.region ?? ''}`
    const cur = cityMap.get(key) ?? { city: r.city, region: r.region, visits: 0 }
    cur.visits++
    cityMap.set(key, cur)
  }
  const cities = Array.from(cityMap.values())
    .filter((c) => c.city)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10)

  // Devices
  const deviceMap = new Map<string, number>()
  for (const r of rows) {
    const d = r.device ?? 'desktop'
    deviceMap.set(d, (deviceMap.get(d) ?? 0) + 1)
  }
  const devices = Array.from(deviceMap.entries())
    .map(([device, v]) => ({ device, visits: v }))
    .sort((a, b) => b.visits - a.visits)

  return {
    range,
    rangeLabel: rangeLabelText(range),
    kpi: { visits, uniqueVisitors, pagesPerVisitor, bouncePct },
    timeseries, pages, referrers, countries, cities, devices,
  }
}

const FLAG_MAP: Record<string, string> = {
  ES: '🇪🇸', FR: '🇫🇷', IT: '🇮🇹', DE: '🇩🇪', GB: '🇬🇧', US: '🇺🇸',
  PT: '🇵🇹', NL: '🇳🇱', BE: '🇧🇪', CH: '🇨🇭', AT: '🇦🇹', IE: '🇮🇪',
  SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', PL: '🇵🇱', CZ: '🇨🇿',
  RO: '🇷🇴', GR: '🇬🇷', MX: '🇲🇽', AR: '🇦🇷', CL: '🇨🇱', CO: '🇨🇴',
  BR: '🇧🇷', CA: '🇨🇦', AU: '🇦🇺', JP: '🇯🇵', CN: '🇨🇳', MA: '🇲🇦',
}
const COUNTRY_NAME: Record<string, string> = {
  ES: 'España', FR: 'Francia', IT: 'Italia', DE: 'Alemania', GB: 'Reino Unido',
  US: 'Estados Unidos', PT: 'Portugal', NL: 'Países Bajos', BE: 'Bélgica',
  CH: 'Suiza', AT: 'Austria', IE: 'Irlanda', SE: 'Suecia', NO: 'Noruega',
  DK: 'Dinamarca', FI: 'Finlandia', PL: 'Polonia', CZ: 'Chequia',
  RO: 'Rumanía', GR: 'Grecia', MX: 'México', AR: 'Argentina', CL: 'Chile',
  CO: 'Colombia', BR: 'Brasil', CA: 'Canadá', AU: 'Australia', JP: 'Japón',
  CN: 'China', MA: 'Marruecos',
}

export function countryFlag(iso: string | null): string {
  if (!iso) return '🌐'
  return FLAG_MAP[iso.toUpperCase()] ?? '🌐'
}

export function countryName(iso: string | null): string {
  if (!iso) return 'Desconocido'
  return COUNTRY_NAME[iso.toUpperCase()] ?? iso.toUpperCase()
}
