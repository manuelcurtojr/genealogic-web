/**
 * Dominios de criadero que sirven la WEB DINÁMICA (/kennels/[slug]) en lugar
 * del constructor (/c/[slug]).
 *
 * Contexto: cualquier custom domain verificado se sirve por defecto con la
 * web del CONSTRUCTOR (/c/[slug]) — la que se monta a mano sección a sección.
 * Estos dominios concretos, en cambio, se sirven con la web AUTO-GENERADA
 * (/kennels/[slug]) y SIN el chrome de Genealogic (marketing header + footer
 * + sidebar): se ven como una web propia del criadero a ojos del visitante.
 *
 * Es una allowlist EXPLÍCITA a propósito: cambiar el routing de forma global
 * afectaría a otros criaderos con dominio verificado que todavía usan su web
 * del constructor (les sustituiría la web por una dinámica que quizá no han
 * rellenado). Así solo migran los que pongamos aquí.
 *
 * Para migrar un criadero a la web dinámica: añade su dominio (apex, sin
 * www) a DYNAMIC_SITE_DOMAINS. Para volverlo global algún día: que
 * isDynamicSiteHost devuelva true para cualquier host no-Genealogic.
 */
const DYNAMIC_SITE_DOMAINS = new Set<string>([
  'iremacurto.com',
])

/** Normaliza un host: minúsculas, sin puerto, sin prefijo www. */
export function normalizeHost(host: string | null | undefined): string {
  return (host || '').toLowerCase().split(':')[0].replace(/^www\./, '')
}

/**
 * ¿Este host sirve la web dinámica del criadero (sin chrome de Genealogic)?
 * Lo consultan: el middleware (para elegir /kennels vs /c) y los layouts
 * (para suprimir el marketing header/footer y montar el chrome standalone).
 */
export function isDynamicSiteHost(host: string | null | undefined): boolean {
  return DYNAMIC_SITE_DOMAINS.has(normalizeHost(host))
}
