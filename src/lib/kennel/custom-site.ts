/**
 * Routing de dominios propios de criadero.
 *
 * Tras retirar el CONSTRUCTOR (/c/[slug]), CUALQUIER custom domain verificado se
 * sirve con la WEB DINÁMICA auto-generada (/kennels/[slug]/*) y SIN el chrome de
 * Genealogic (marketing header + footer + sidebar): se ve como una web propia
 * del criadero a ojos del visitante.
 *
 * Antes esto era una allowlist explícita (solo migraban los dominios listados),
 * porque convivían dos webs. Ya no: solo existe la dinámica.
 */

/** Normaliza un host: minúsculas, sin puerto, sin prefijo www. */
export function normalizeHost(host: string | null | undefined): string {
  return (host || '').toLowerCase().split(':')[0].replace(/^www\./, '')
}

/**
 * ¿Este host es un dominio PROPIO del criadero (no de Genealogic)? Si lo es, se
 * sirve la web dinámica sin chrome. Lo consultan: el middleware (rewrite a
 * /kennels) y los layouts (suprimir header/footer y montar el chrome standalone).
 */
export function isDynamicSiteHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host)
  if (!h) return false
  if (
    h.endsWith('genealogic.io') ||
    h.endsWith('vercel.app') ||
    h.startsWith('localhost') ||
    h.startsWith('127.0.0.1')
  ) {
    return false
  }
  return true
}
