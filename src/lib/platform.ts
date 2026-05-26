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

export function getPlatformFromRequest(request: NextRequest): 'ios' | 'web' {
  return isIosPlatformValue(request.cookies.get(APP_PLATFORM_COOKIE)?.value) ? 'ios' : 'web'
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
