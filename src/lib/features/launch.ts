/**
 * Fase 1 — "carta reducida" + lanzamientos en goteo.
 *
 * Estrategia (decidida 2026-06-06): el público ve solo lo esencial —registrar
 * perro/camada + perfil de criadero + buscar—. El resto está CONSTRUIDO pero
 * RESERVADO para irlo lanzando de uno en uno (cada lanzamiento = contenido +
 * email a los usuarios). Así no se satura al recién llegado y cada herramienta
 * se anuncia como un "drop".
 *
 * Las cuentas INSIDER (founder + criaderos de prueba: Irema, El Nieto) ven
 * TODO, lanzado o no — reutilizamos ENTERPRISE_USERS / isEnterpriseUser.
 *
 * 👉 CÓMO LANZAR una feature al público: borra su path de RESERVED_PATHS y
 * deploya. Eso enciende el ítem del nav + desbloquea la ruta para todos.
 */
import { isEnterpriseUser } from '@/lib/permissions'

/**
 * Rutas (features) construidas pero AÚN NO lanzadas al público. Se ocultan del
 * sidebar y se bloquean por ruta para los no-insiders. Orden ≈ orden de
 * lanzamiento sugerido (el primero, /calendar = Salud + recordatorios).
 */
export const RESERVED_PATHS: readonly string[] = [
  // Salud + recordatorios (lanzamiento 1 — retención)
  '/calendar', '/vet',
  // Cría / genética
  '/cruces',       // Simulador de cruces (COI proyectado)
  '/genetica',     // Genotipos / pruebas DNA
  // Ventas / CRM
  '/embudo', '/contactos', '/contratos', '/clientes',
  // Analítica web
  '/estadisticas', '/visitas', '/analytics',
  // Comunicación (extensiones)
  '/emailbot', '/conocimiento', '/newsletter',
]

/** ¿Esta ruta está reservada (no lanzada al público todavía)? */
export function isReservedPath(pathname: string): boolean {
  return RESERVED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

/** Insider = ve TODO (founder + criaderos de prueba). Reutiliza el allowlist. */
export function isInsider(userId: string | null | undefined): boolean {
  return isEnterpriseUser(userId)
}

/** ¿El usuario puede ver/usar esta ruta? (lanzada para todos, o es insider). */
export function canAccessPath(pathname: string, userId: string | null | undefined): boolean {
  if (!isReservedPath(pathname)) return true
  return isInsider(userId)
}
