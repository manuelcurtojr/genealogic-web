/**
 * Resolución de idioma (locale) — server-side.
 *
 * La app tiene un i18n basado en preferencia (no en rutas /en /es): el idioma
 * se resuelve por una cascada y se usa con getTranslator(lang) de lib/i18n.ts.
 *
 * Cascada de decisión (de más a menos prioritario):
 *   1. profiles.language  → si el usuario está logueado y lo fijó en Ajustes
 *   2. cookie LOCALE_COOKIE → preferencia explícita del anónimo (switcher footer)
 *   3. Accept-Language     → autodetección del navegador (primer hit)
 *   4. DEFAULT_LOCALE ('es')
 *
 * El switcher del footer escribe la cookie y recarga; el de Ajustes escribe
 * profiles.language. El middleware (lib/supabase/middleware.ts) siembra la
 * cookie desde Accept-Language en el primer hit para que los server components
 * (header/footer/landings públicas) ya rendericen en el idioma correcto sin
 * depender de localStorage (que no existe en el server).
 */
import 'server-only'

export const LOCALE_COOKIE = 'genealogic-lang'
export const DEFAULT_LOCALE = 'es'

/** Idiomas con traducción disponible. 'es' es la clave base (no necesita dict). */
export const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

/** Normaliza un string suelto a un Locale soportado, o null si no encaja. */
export function normalizeLocale(raw: string | null | undefined): Locale | null {
  if (!raw) return null
  // Acepta 'en', 'en-US', 'EN' → 'en'
  const base = raw.trim().toLowerCase().split('-')[0]
  return (SUPPORTED_LOCALES as readonly string[]).includes(base) ? (base as Locale) : null
}

/**
 * Parsea un header Accept-Language ("en-US,en;q=0.9,es;q=0.8") y devuelve el
 * primer idioma SOPORTADO por orden de preferencia (q-value), o null.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null
  const parts = header
    .split(',')
    .map((p) => {
      const [tag, qPart] = p.trim().split(';')
      const q = qPart?.startsWith('q=') ? parseFloat(qPart.slice(2)) : 1
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 1 }
    })
    .sort((a, b) => b.q - a.q)
  for (const { tag } of parts) {
    const loc = normalizeLocale(tag)
    if (loc) return loc
  }
  return null
}

/**
 * Resuelve el locale para el request actual desde un Server Component / page.
 * Lee la cookie (sembrada por el middleware desde Accept-Language) y, si hay
 * usuario logueado con profiles.language fijado, ese gana.
 *
 * @param userLanguage  valor de profiles.language si ya lo tienes cargado
 *                      (evita una query extra). Opcional.
 */
export async function getLocale(userLanguage?: string | null): Promise<Locale> {
  // 1. Preferencia del usuario logueado (la más definitiva)
  const fromUser = normalizeLocale(userLanguage)
  if (fromUser) return fromUser

  // 2. Cookie (preferencia anónima + semilla del middleware)
  const { cookies, headers } = await import('next/headers')
  const store = await cookies()
  const fromCookie = normalizeLocale(store.get(LOCALE_COOKIE)?.value)
  if (fromCookie) return fromCookie

  // 3. Accept-Language directo (por si la cookie aún no se sembró)
  const hdrs = await headers()
  const fromHeader = localeFromAcceptLanguage(hdrs.get('accept-language'))
  if (fromHeader) return fromHeader

  // 4. Fallback
  return DEFAULT_LOCALE
}
