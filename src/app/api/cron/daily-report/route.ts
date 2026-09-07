/**
 * GET /api/cron/daily-report
 *
 * Informe diario para el fundador (Manuel). Cada mañana a las 06:00 UTC
 * (≈ 8:00 hora peninsular en verano / 7:00 en invierno) resume las últimas
 * 24 h de Genealogic: visitas, visitantes únicos, de dónde vienen, países,
 * páginas top, nuevos registros y actividad, más los totales de la plataforma.
 *
 * Se envía por Resend directo (no usa sendTransactionalEmail: esto NO es un
 * email de usuario con preferencias/opt-out, es un informe interno). Destino
 * configurable con DAILY_REPORT_EMAIL (fallback: manuelcurtojr@proton.me).
 *
 * Autorización: CRON_SECRET (Vercel Cron añade el header automáticamente).
 */
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { isAuthorizedCron, cronUnauthorized } from '@/lib/cron/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FROM = 'Genealogic <hola@genealogic.io>'
const TO = process.env.DAILY_REPORT_EMAIL || 'manuelcurtojr@proton.me'

// ─── Paleta (inline, email-safe) ──────────────────────────────────────────
const C = {
  brand: '#D74709',
  ink: '#1a1712',
  body: '#4b463f',
  muted: '#8a8178',
  hair: '#ece7e1',
  bg: '#faf8f5',
  card: '#ffffff',
  soft: '#f6f2ed',
  green: '#2e7d5b',
  red: '#c0392b',
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return cronUnauthorized()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const now = new Date()
  const from = new Date(now.getTime() - 24 * 3600_000)
  const prevFrom = new Date(now.getTime() - 48 * 3600_000)
  const fromISO = from.toISOString()
  const prevFromISO = prevFrom.toISOString()

  // ─── Consultas en paralelo ──────────────────────────────────────────────
  const headCount = (table: string, apply: (q: any) => any) =>
    apply(admin.from(table).select('id', { count: 'exact', head: true }))

  const [
    pvRes, pvPrevRes,
    newUsersRes, newDogsRes, newKennelsRes, newLittersRes, newReservRes,
    totUsersRes, totKennelsRes, totDogsRes,
  ] = await Promise.all([
    admin.from('page_views').select('path,session_id,country,referrer,created_at')
      .gte('created_at', fromISO).order('created_at', { ascending: false }).limit(5000),
    headCount('page_views', (q: any) => q.gte('created_at', prevFromISO).lt('created_at', fromISO)),
    admin.from('profiles').select('display_name,email,role,plan,created_at')
      .gte('created_at', fromISO).order('created_at', { ascending: false }).limit(50),
    headCount('dogs', (q: any) => q.gte('created_at', fromISO)),
    headCount('kennels', (q: any) => q.gte('created_at', fromISO)),
    headCount('litters', (q: any) => q.gte('created_at', fromISO)),
    headCount('puppy_reservations', (q: any) => q.gte('created_at', fromISO)),
    headCount('profiles', () => admin.from('profiles').select('id', { count: 'exact', head: true })),
    headCount('kennels', () => admin.from('kennels').select('id', { count: 'exact', head: true })),
    headCount('dogs', () => admin.from('dogs').select('id', { count: 'exact', head: true })),
  ])

  const rows: PageView[] = pvRes.data || []
  const views = rows.length
  const uniques = new Set(rows.map((r) => r.session_id).filter(Boolean)).size
  const prevViews = pvPrevRes.count || 0

  const topPages = topN(rows.map((r) => r.path), 8)
  const topCountries = topN(rows.map((r) => r.country || '??'), 8)
  const topReferrers = topN(rows.map((r) => sourceLabel(r.referrer)), 6)

  const newUsers: ProfileRow[] = newUsersRes.data || []
  const signals = {
    users: newUsers.length,
    dogs: newDogsRes.count || 0,
    kennels: newKennelsRes.count || 0,
    litters: newLittersRes.count || 0,
    reservations: newReservRes.count || 0,
  }
  const totals = {
    users: totUsersRes.count || 0,
    kennels: totKennelsRes.count || 0,
    dogs: totDogsRes.count || 0,
  }

  const dateLabel = capitalize(now.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid',
  }))

  const html = buildHtml({ dateLabel, views, uniques, prevViews, topPages, topCountries, topReferrers, newUsers, signals, totals })
  const subject = `Genealogic · ${views} visitas, ${uniques} únicos${signals.users ? `, ${signals.users} registros` : ''} — ${now.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })}`

  // ?preview=1 → devuelve el HTML sin enviar (para revisar el diseño).
  if (new URL(req.url).searchParams.get('preview') === '1') {
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  }

  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ ok: false, error: 'RESEND_API_KEY missing' }, { status: 500 })

  try {
    const resend = new Resend(key)
    const { error } = await resend.emails.send({ from: FROM, to: TO, subject, html })
    if (error) return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'send failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sent_to: TO, views, uniques, prevViews, signals, totals })
}

// ─── Tipos + helpers de datos ──────────────────────────────────────────────
type PageView = { path: string; session_id: string | null; country: string | null; referrer: string | null; created_at: string }
type ProfileRow = { display_name: string | null; email: string | null; role: string | null; plan: string | null; created_at: string }

function topN(values: (string | null | undefined)[], n: number): { key: string; count: number }[] {
  const m = new Map<string, number>()
  for (const v of values) { const k = (v ?? '').trim(); if (!k) continue; m.set(k, (m.get(k) || 0) + 1) }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }))
}

/** Referrer crudo → etiqueta legible de la fuente. */
function sourceLabel(ref: string | null): string {
  if (!ref) return 'Directo'
  const r = ref.toLowerCase()
  if (r.includes('instagram')) return 'Instagram'
  if (r.includes('google')) return 'Google'
  if (r.includes('facebook') || r.includes('fb.')) return 'Facebook'
  if (r.includes('tiktok')) return 'TikTok'
  if (r.includes('bing')) return 'Bing'
  if (r.includes('t.co') || r.includes('twitter') || r.includes('x.com')) return 'X/Twitter'
  if (r.includes('youtube')) return 'YouTube'
  if (r.includes('whatsapp')) return 'WhatsApp'
  try { return new URL(ref.startsWith('http') ? ref : `https://${ref}`).hostname.replace(/^www\./, '') } catch { return ref }
}

const FLAG: Record<string, string> = {
  ES: '🇪🇸', US: '🇺🇸', IT: '🇮🇹', GB: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', PT: '🇵🇹', BE: '🇧🇪',
  NL: '🇳🇱', PL: '🇵🇱', MX: '🇲🇽', AR: '🇦🇷', CO: '🇨🇴', CN: '🇨🇳', SI: '🇸🇮', RO: '🇷🇴', RU: '🇷🇺', BR: '🇧🇷',
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1) }
function fmtInt(n: number): string { return n.toLocaleString('es-ES') }

// ─── Render HTML (tablas + inline styles, email-safe) ──────────────────────
function buildHtml(d: {
  dateLabel: string
  views: number; uniques: number; prevViews: number
  topPages: { key: string; count: number }[]
  topCountries: { key: string; count: number }[]
  topReferrers: { key: string; count: number }[]
  newUsers: ProfileRow[]
  signals: { users: number; dogs: number; kennels: number; litters: number; reservations: number }
  totals: { users: number; kennels: number; dogs: number }
}): string {
  const delta = deltaBadge(d.views, d.prevViews)

  const kpis = [
    { label: 'Visitas', value: fmtInt(d.views), sub: delta },
    { label: 'Visitantes únicos', value: fmtInt(d.uniques), sub: '' },
    { label: 'Nuevos registros', value: fmtInt(d.signals.users), sub: '' },
  ]
  const kpiCells = kpis.map((k) => `
    <td width="33%" style="padding:6px;" valign="top">
      <div style="background:${C.card};border:1px solid ${C.hair};border-radius:14px;padding:16px 14px;text-align:center;">
        <div style="font-size:30px;line-height:1;font-weight:800;color:${C.ink};letter-spacing:-0.02em;">${k.value}</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};margin-top:8px;">${k.label}</div>
        ${k.sub ? `<div style="margin-top:6px;">${k.sub}</div>` : ''}
      </div>
    </td>`).join('')

  const barTable = (title: string, items: { key: string; count: number }[], render: (k: string) => string) => {
    if (items.length === 0) return ''
    const max = items[0].count || 1
    const body = items.map((it) => {
      const w = Math.max(6, Math.round((it.count / max) * 100))
      return `
      <tr>
        <td style="padding:5px 0;font-size:13px;color:${C.body};white-space:nowrap;max-width:340px;overflow:hidden;text-overflow:ellipsis;">${render(it.key)}</td>
        <td width="120" style="padding:5px 0 5px 10px;" valign="middle">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td style="background:${C.soft};border-radius:6px;"><div style="height:8px;width:${w}%;background:${C.brand};border-radius:6px;"></div></td>
          </tr></table>
        </td>
        <td width="34" align="right" style="padding:5px 0 5px 8px;font-size:13px;font-weight:700;color:${C.ink};font-variant-numeric:tabular-nums;">${it.count}</td>
      </tr>`
    }).join('')
    return section(title, `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${body}</table>`)
  }

  const usersBlock = d.newUsers.length === 0
    ? `<div style="font-size:13px;color:${C.muted};padding:2px 0;">Ningún registro nuevo en las últimas 24 h.</div>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${d.newUsers.map((u) => {
        const name = esc(u.display_name || (u.email ? u.email.split('@')[0] : 'Usuario'))
        const roleTag = u.role === 'breeder' ? 'Criador' : u.role === 'owner' ? 'Propietario' : u.role === 'admin' ? 'Admin' : (u.role || '—')
        const planTag = (u.plan && u.plan !== 'free') ? ` · ${esc(u.plan)}` : ''
        const t = new Date(u.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
        return `<tr>
          <td style="padding:6px 0;border-bottom:1px solid ${C.hair};">
            <span style="font-size:13.5px;font-weight:600;color:${C.ink};">${name}</span>
            <span style="font-size:12px;color:${C.muted};"> · ${esc(u.email || '')}</span>
          </td>
          <td align="right" style="padding:6px 0;border-bottom:1px solid ${C.hair};white-space:nowrap;">
            <span style="font-size:11px;font-weight:700;color:${C.brand};background:${C.soft};border-radius:20px;padding:2px 8px;">${roleTag}${planTag}</span>
            <span style="font-size:11px;color:${C.muted};margin-left:6px;">${t}</span>
          </td>
        </tr>`
      }).join('')}</table>`

  const activity = [
    { n: d.signals.dogs, one: 'perro nuevo', many: 'perros nuevos' },
    { n: d.signals.litters, one: 'camada nueva', many: 'camadas nuevas' },
    { n: d.signals.reservations, one: 'reserva nueva', many: 'reservas nuevas' },
    { n: d.signals.kennels, one: 'criadero nuevo', many: 'criaderos nuevos' },
  ]
  const activityChips = activity.map((a) => `
    <td style="padding:4px;" width="25%" valign="top">
      <div style="background:${C.card};border:1px solid ${C.hair};border-radius:12px;padding:12px 8px;text-align:center;">
        <div style="font-size:22px;font-weight:800;color:${a.n > 0 ? C.brand : C.muted};">${a.n}</div>
        <div style="font-size:10.5px;color:${C.muted};margin-top:3px;line-height:1.25;">${a.n === 1 ? a.one : a.many}</div>
      </div>
    </td>`).join('')

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Genealogic · ${d.views} visitas y ${d.uniques} visitantes únicos en las últimas 24 h.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${C.bg};padding:24px 12px;"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="padding:4px 8px 18px;">
        <table role="presentation" width="100%"><tr>
          <td style="font-size:18px;font-weight:800;color:${C.ink};letter-spacing:-0.02em;">
            <span style="color:${C.brand};">●</span> Genealogic
          </td>
          <td align="right" style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${C.muted};">Informe diario</td>
        </tr></table>
        <div style="font-size:13px;color:${C.body};margin-top:6px;">${d.dateLabel} · últimas 24 h</div>
      </td></tr>

      <!-- KPIs -->
      <tr><td style="padding:0 2px;"><table role="presentation" width="100%"><tr>${kpiCells}</tr></table></td></tr>

      <!-- Fuentes / Países -->
      <tr><td>${barTable('De dónde vienen', d.topReferrers, (k) => esc(k))}</td></tr>
      <tr><td>${barTable('Países', d.topCountries, (k) => `${FLAG[k] || '🌐'} ${esc(k)}`)}</td></tr>
      <tr><td>${barTable('Páginas más vistas', d.topPages, (k) => esc(k))}</td></tr>

      <!-- Nuevos usuarios -->
      <tr><td>${section('Nuevos registros', usersBlock)}</td></tr>

      <!-- Actividad -->
      <tr><td>${section('Actividad', `<table role="presentation" width="100%"><tr>${activityChips}</tr></table>`)}</td></tr>

      <!-- Totales -->
      <tr><td style="padding:8px;">
        <div style="background:${C.ink};border-radius:14px;padding:16px;">
          <table role="presentation" width="100%"><tr>
            ${[['Usuarios', d.totals.users], ['Criaderos', d.totals.kennels], ['Perros', d.totals.dogs]].map(([l, v]) => `
            <td width="33%" align="center">
              <div style="font-size:22px;font-weight:800;color:#fff;">${fmtInt(v as number)}</div>
              <div style="font-size:10.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-top:4px;">${l}</div>
            </td>`).join('')}
          </tr></table>
          <div style="text-align:center;font-size:10.5px;color:rgba(255,255,255,0.5);margin-top:10px;">La plataforma hoy (acumulado)</div>
        </div>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:16px 12px 4px;text-align:center;">
        <div style="font-size:11.5px;color:${C.muted};line-height:1.5;">
          Informe automático de Genealogic · analítica propia sin cookies (tráfico público).<br>
          El comportamiento de usuarios logueados se mide en PostHog.
        </div>
      </td></tr>

    </table>
  </td></tr></table>
</body></html>`
}

function section(title: string, inner: string): string {
  return `<div style="background:${C.card};border:1px solid ${C.hair};border-radius:14px;padding:16px;margin:8px;">
    <div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};margin-bottom:10px;">${title}</div>
    ${inner}
  </div>`
}

function deltaBadge(cur: number, prev: number): string {
  if (prev === 0) return `<span style="font-size:11px;color:${C.muted};">vs 0 ayer</span>`
  const diff = cur - prev
  const pct = Math.round((diff / prev) * 100)
  if (diff === 0) return `<span style="font-size:11px;color:${C.muted};">= que ayer</span>`
  const up = diff > 0
  const color = up ? C.green : C.red
  return `<span style="font-size:11.5px;font-weight:700;color:${color};">${up ? '▲' : '▼'} ${Math.abs(pct)}% <span style="font-weight:400;color:${C.muted};">vs ayer</span></span>`
}
