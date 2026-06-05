// Centralized permissions for Genealogic
//
// Roles (en profiles.role):
//   - 'owner'   = default (a user with dogs but no kennel)
//   - 'breeder' = a user who has created a kennel (auto-promoted via DB trigger)
//   - 'admin'   = internal admin role
//
// Plans (en profiles.plan) — desde 25 may 2026:
//   - 'free'       = gratis para siempre (default, owners y criadores en modo gratis)
//   - 'kennel'     = criador profesional (49€/mes o 290€/año)
//   - 'kennel_pro' = criador pro con web, emailbot, newsletter (49€/mes Founder)
//
// Legacy compat (NUNCA mostrar en UI, solo para datos antiguos):
//   - 'starter' / 'pro' / 'premium' → mapean internamente a kennel/kennel_pro
//
// `hasPaidPlan()` cubre cualquier plan != free. La mayoría de features
// gateadas viven detrás de este helper, no del nombre exacto del plan.

export type UserRole = 'owner' | 'breeder' | 'admin'
export type UserPlan = 'free' | 'kennel' | 'kennel_pro'
// Legacy unión que el código aún puede recibir:
export type UserPlanWithLegacy = UserPlan | 'starter' | 'pro' | 'premium'

export function isAdmin(role: string | null | undefined): boolean {
  return role === 'admin'
}

// ─── Enterprise / Founder override ──────────────────────────────────────────
// Hardcoded set de user_ids con acceso "enterprise" (todo activado,
// independientemente del plan que tengan en DB). Pensado para el fundador,
// cobayas internos y posibles cuentas comp ofrecidas a partners clave.
//
// Para añadir alguien: pega su profiles.id (UUID) aquí y deploya.
// Cuando este caso de uso crezca, migrar a una columna profiles.is_enterprise.
export const ENTERPRISE_USERS = new Set<string>([
  '89d97ded-1043-4e59-939e-00edecd679b1', // Irema Curtó (fundador / usuario 0)
])

export function isEnterpriseUser(userId: string | null | undefined): boolean {
  if (!userId) return false
  return ENTERPRISE_USERS.has(userId)
}

/**
 * Devuelve el plan efectivo de un usuario:
 *  - Si está en ENTERPRISE_USERS → siempre 'kennel_pro' (todo desbloqueado).
 *  - Si no → su plan normalizado desde DB.
 *
 * Usar en layouts/server components al determinar qué mostrar.
 */
export function effectivePlanFor(userId: string | null | undefined, rawPlan: string | null | undefined): UserPlan {
  // Enterprise retirado: el founder es Pro (`kennel`); sus extras van por
  // extensiones (kennelHasAddon), no por el plan.
  if (isEnterpriseUser(userId)) return 'kennel'
  return normalizePlan(rawPlan)
}

export function isBreederRole(role: string | null | undefined): boolean {
  return role === 'breeder'
}

export function getRoleLabel(role: string | null | undefined): string {
  if (role === 'admin') return 'Admin'
  if (role === 'breeder') return 'Criador'
  return 'Propietario'
}

export function getRoleBadge(role: string | null | undefined): { label: string; bg: string } {
  if (role === 'admin') return { label: 'Admin', bg: 'bg-red-500/15 text-red-400' }
  if (role === 'breeder') return { label: 'Criador', bg: 'bg-surface-card text-ink' }
  return { label: 'Propietario', bg: 'bg-surface-card text-muted' }
}

// ─── Plan helpers ───────────────────────────────────────────────────────────

/** Normaliza cualquier plan (incluido legacy) al nuevo set canónico. */
export function normalizePlan(plan: string | null | undefined): UserPlan {
  switch (plan) {
    case 'kennel_pro':
    case 'premium':
      return 'kennel_pro'
    case 'kennel':
    case 'pro':
    case 'starter':
      return 'kennel'
    default:
      return 'free'
  }
}

/** True si el user tiene plan Kennel Pro (o legacy premium). */
export function isKennelPro(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === 'kennel_pro'
}

/** True si el user tiene plan Kennel (o legacy pro/starter). */
export function isKennel(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === 'kennel'
}

/** True si el user tiene CUALQUIER plan de pago. Es el gate que usan
 *  la mayoría de features Pro (pipeline, contratos, vet calendar, etc). */
export function hasPaidPlan(plan: string | null | undefined): boolean {
  const n = normalizePlan(plan)
  return n === 'kennel' || n === 'kennel_pro'
}

/** Alias legacy. Algunas features históricas estaban "tras Pro" — ahora
 *  son "tras cualquier plan de pago". Mantenido para no romper imports. */
export function hasProAccess(plan: string | null | undefined): boolean {
  return hasPaidPlan(plan)
}

/**
 * Features de Kennel PRO (49€): COI completo, simulador, genotipos,
 * estadísticas, reseñas, formulario de contacto, soporte prioritario.
 * Cualquier plan de pago (kennel o kennel_pro) las tiene.
 */
export function hasProFeatures(plan: string | null | undefined): boolean {
  return hasPaidPlan(plan)
}

/**
 * Features de Kennel ENTERPRISE (149€, alta MANUAL): web pública con
 * dominio, blog, emailbot, newsletter, API REST, multi-usuario, etc.
 *
 * Enterprise = plan `kennel_pro` en BBDD O estar en ENTERPRISE_USERS.
 * Como el plan se pasa ya "efectivo" (loadShellContext resuelve a
 * kennel_pro a los ENTERPRISE_USERS), basta con isKennelPro(plan); el
 * userId es opcional para llamadas que aún no resuelven el plan efectivo.
 */
export function hasEnterpriseFeatures(
  plan: string | null | undefined,
  userId?: string | null,
): boolean {
  return isKennelPro(plan) || isEnterpriseUser(userId)
}

/** Backward-compat: algunas pages siguen llamando isPro()/isPremium(). */
export function isPro(plan: string | null | undefined): boolean {
  return isKennel(plan)
}

export function isPremium(plan: string | null | undefined): boolean {
  return isKennelPro(plan)
}

/**
 * Nombre COMERCIAL del plan (el que ve el usuario). OJO con el desfase
 * histórico entre el valor en BBDD y el nombre de marketing:
 *
 *   BBDD plan        →  Nombre comercial
 *   ──────────────────────────────────────
 *   'kennel_pro'     →  Kennel Enterprise   (149€/mes, alta manual)
 *   'kennel'         →  Kennel Pro          (49€/mes)
 *   'free' + kennel  →  Kennel Free         (gratis, criador casero)
 *   'free' sin kennel→  Owner               (gratis, propietario)
 *
 * Por eso necesitamos `hasKennel` para distinguir Owner de Kennel Free.
 */
export function getPlanLabel(plan: string | null | undefined, hasKennel = false): string {
  const n = normalizePlan(plan)
  // Enterprise retirado: el legacy `kennel_pro` se muestra ya como "Kennel Pro".
  if (n === 'kennel_pro') return 'Kennel Pro'
  if (n === 'kennel') return 'Kennel Pro'
  return hasKennel ? 'Kennel Free' : 'Owner'
}

// ─── Legacy helpers (always return true) ────────────────────────────────────
// Mantenidos para no romper código existente que aún los llama.

export function roleAtLeast(_role: string | null | undefined, _minRole: string): boolean {
  return true
}

/**
 * Límite de perros por plan. Decisión de producto 2026-06-04: **perros
 * ilimitados para TODOS** (owner, free, pro, enterprise). El criador paga por
 * las HERRAMIENTAS (embudo, contratos, web, emailbot), no por número de perros;
 * el propietario es gratis para siempre y sin límite.
 *
 * Se mantiene la firma (plan, hasKennel) por compatibilidad con los callers,
 * pero siempre devuelve Infinity. El antiguo trigger BBDD `trg_enforce_dog_limit`
 * se eliminó (migración 20260719_unlimited_dogs.sql).
 */
export function dogLimitFor(_plan?: string | null, _hasKennel?: boolean): number {
  return Infinity
}

export function canCreateDog(_plan?: string | null, _hasKennel?: boolean, _countableDogs?: number): boolean {
  return true
}

export function canCreateLitter(_role: string, _activeLitterCount: number): boolean {
  return true
}

export function hasFeature(_role: string, _feature: string): boolean {
  return true
}
