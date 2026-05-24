/**
 * Constantes y helpers universales (client + server + edge) para la
 * analítica web. Sin imports server-only. Port de Pawdoq.
 */

export const IGNORED_PATH_PREFIXES = [
  '/dashboard',
  '/admin',
  '/cuenta',
  '/api',
  '/auth',
  '/_next',
  '/login',
  '/register',
] as const

export const BOT_UA_RE =
  /bot|spider|crawl|googlebot|bingbot|yandexbot|duckduckbot|ahrefsbot|semrushbot|facebookexternalhit|whatsapp|twitterbot|headless|lighthouse|preview|uptime/i

export function shouldIgnorePath(path: string): boolean {
  return IGNORED_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export type DeviceKind = 'mobile' | 'tablet' | 'desktop'
export type BrowserKind = 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other'
export type OsKind = 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'Other'

export function parseUserAgent(ua: string): {
  device: DeviceKind
  browser: BrowserKind
  os: OsKind
} {
  const isTablet = /iPad|Tablet/i.test(ua)
  const isMobile = /Mobi|Android/i.test(ua) && !isTablet
  const device: DeviceKind = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'

  let browser: BrowserKind = 'Other'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/Chrome\//.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua)) browser = 'Safari'

  let os: OsKind = 'Other'
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS'
  else if (/Windows/.test(ua)) os = 'Windows'
  else if (/Linux/.test(ua)) os = 'Linux'

  return { device, browser, os }
}

/**
 * Hash rotativo diario (16 hex chars = 64 bits). No reversible, GDPR-friendly.
 */
export async function sessionHash(
  ip: string,
  userAgent: string,
  now: Date = new Date(),
): Promise<string> {
  const dateKey = now.toISOString().slice(0, 10)
  const data = new TextEncoder().encode(`${ip}|${userAgent}|${dateKey}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < 8; i++) {
    hex += bytes[i]!.toString(16).padStart(2, '0')
  }
  return hex
}

export function cleanReferrer(
  referrer: string | null | undefined,
  selfHost: string,
): string | null {
  if (!referrer) return null
  try {
    const u = new URL(referrer)
    const host = u.hostname.toLowerCase().replace(/^www\./, '')
    const self = selfHost.toLowerCase().replace(/^www\./, '')
    if (!host) return null
    if (host === self) return null
    return host
  } catch {
    return null
  }
}
