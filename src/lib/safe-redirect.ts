/**
 * Valida un parámetro `?redirect=` para evitar open-redirect.
 * Solo acepta rutas INTERNAS (empiezan por "/" y no son protocol-relative ni
 * llevan esquema). Devuelve la ruta si es segura, o null si no.
 */
export function safeInternalPath(path: string | null | undefined): string | null {
  if (!path) return null
  if (!path.startsWith('/')) return null
  if (path.startsWith('//')) return null // protocol-relative (//evil.com)
  if (path.includes('://') || path.includes('\\')) return null
  return path
}
