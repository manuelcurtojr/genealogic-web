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
 * lanzamiento sugerido (el primero: el simulador de cruces).
 *
 * NOTA: la salud del perro (cartilla, vacunas, recordatorios — /calendar, /vet)
 * NO se reserva: es parte del registro del perro y el gancho del propietario.
 */
export const RESERVED_PATHS: readonly string[] = [
  // Go-live 2026-07-09: cruces, genética, embudo, contactos, contratos,
  // clientes y estadísticas se LANZARON — son lo que vende Kennel Pro
  // (49€/mes, trial 14 días). Su acceso lo gobierna el gate de plan
  // server-side de cada ruta, no esta lista.
  // Analítica web — congelada (dependía de la web del criadero, retirada)
  '/visitas', '/analytics',
  // API pública v1 — funcional pero no publicitada (uso interno founder)
  '/kennel/api',
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
