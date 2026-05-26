import type { NextRequest } from 'next/server'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

/**
 * Detección del wrapper iOS (Capacitor WebView).
 *
 * Por qué existe: la iOS app del App Store es un WebView que carga genealogic.io.
 * Apple rechaza por Guideline 3.1.1 si la app actúa como puerta de entrada a un
 * SaaS B2B con pago externo. La solución pactada es ocultar las rutas B2B
 * (pricing, billing, CRM, etc.) cuando la web se sirve dentro del WebView iOS,
 * sin tocar nada en la web normal.
 *
 * Fuente de verdad: cookie `app_platform=ios`, escrita por el middleware la
 * primera vez que ve `?platform=ios` (lo inyecta Capacitor en la URL inicial).
 */

export const APP_PLATFORM_COOKIE = 'app_platform'
export const PLATFORM_QUERY_PARAM = 'platform'

/**
 * Fragmento del User-Agent que el wrapper Capacitor iOS añade vía
 * `appendUserAgent` en `capacitor.config.ts`. Es la señal primaria y más
 * fiable de que estamos sirviendo dentro del WebView de la app.
 */
export const IOS_APP_UA_MARKER = 'GenealogicIOSApp'

/**
 * Prefijos de ruta que deben redirigir a `/dashboard` cuando la sesión viene
 * del WebView iOS. Cubre pricing, billing, kennel-as-business management,
 * CRM, comms (newsletter/emailbot), pagos de reservas y contratos.
 */
export const IOS_HIDDEN_PATH_PREFIXES = [
  '/pricing',
  '/cuenta/suscripcion',
  '/cuenta/facturacion',
  '/kennel/pagos',
  '/kennel/new',
  '/contactos',
  '/clientes',
  '/newsletter',
  '/emailbot',
  '/web',
  '/visitas',
] as const

/**
 * Rutas/patrones que NO debemos tocar aunque la cookie esté presente:
 * - Callbacks de OAuth y endpoints de auth — corromperíamos el handshake.
 * - Assets estáticos y API.
 */
export function shouldBypassPlatformLogic(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname === '/auth/callback'
  )
}

export function isIosPlatformValue(value: string | undefined | null): boolean {
  return value === 'ios'
}

export function isIosUserAgent(userAgent: string | null | undefined): boolean {
  return !!userAgent && userAgent.includes(IOS_APP_UA_MARKER)
}

export function getPlatformFromRequest(request: NextRequest): 'ios' | 'web' {
  // ÚNICA fuente de verdad: el User-Agent suffix `GenealogicIOSApp` que añade
  // Capacitor. La cookie se descartó como fallback porque podía quedar
  // pegada en navegadores móviles normales (Safari/Chrome) tras alguna visita
  // que pasase por flujos antiguos, y disparaba la redirección a /login en
  // usuarios web reales. El UA, en cambio, sólo existe dentro del WebView.
  return isIosUserAgent(request.headers.get('user-agent')) ? 'ios' : 'web'
}

export function isIosFromCookieStore(cookies: ReadonlyRequestCookies): boolean {
  return isIosPlatformValue(cookies.get(APP_PLATFORM_COOKIE)?.value)
}

export function matchesIosHiddenPath(pathname: string): boolean {
  // Sub-paths cuentan: `/contactos/abc` también redirige.
  return IOS_HIDDEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
}

/**
 * Sub-paths reservados: rutas dentro de un prefijo oculto que sí queremos
 * permitir aunque la cookie esté activa. Ahora mismo no hay ninguno
 * (newsletter/unsubscribe ya es público y no requiere login), pero deja el
 * hueco listo para añadir excepciones si en el futuro surgen.
 */
export function isIosAllowedException(_pathname: string): boolean {
  return false
}

/**
 * Rutas accesibles para un usuario NO autenticado dentro del WebView iOS.
 * Todo lo demás se redirige a /login para que la app se sienta nativa:
 * no hay landing comercial, no hay search público, no hay browsing de
 * perros/criaderos antes de identificarse.
 */
const IOS_PUBLIC_PATHS = new Set<string>([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/terms',
  '/privacy',
  '/legal',
])

export function isIosAllowedForAnon(pathname: string): boolean {
  if (IOS_PUBLIC_PATHS.has(pathname)) return true
  // Permitir subrutas como /reset-password/[token]
  if (
    pathname.startsWith('/reset-password/') ||
    pathname.startsWith('/forgot-password/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/legal/')
  ) {
    return true
  }
  return false
}
