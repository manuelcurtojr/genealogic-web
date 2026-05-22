// Centralized permissions for Genealogic
//
// Roles (en profiles.role):
//   - 'owner'   = default (a user with dogs but no kennel)
//   - 'breeder' = a user who has created a kennel (auto-promoted via DB trigger)
//   - 'admin'   = internal admin role
//
// Plans (en profiles.plan) — desde 22 may 2026:
//   - 'free'    = capa pública gratis (default)
//   - 'starter' = criador hobbyist
//   - 'pro'     = criador profesional (incluye Pawdoq Breeders features)
//   - 'premium' = criadero grande / multi-kennel
//
// El tier Pro habilita en Genealogic las herramientas que antes vivían en
// Pawdoq Breeders: pipeline de reservas, clientes, emailbot, web builder,
// newsletter, etc.

export type UserRole = 'owner' | 'breeder' | 'admin'
export type UserPlan = 'free' | 'starter' | 'pro' | 'premium'

export function isAdmin(role: string | null | undefined): boolean {
  return role === 'admin'
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

export function isPro(plan: string | null | undefined): boolean {
  return plan === 'pro'
}

export function isPremium(plan: string | null | undefined): boolean {
  return plan === 'premium'
}

/** True si el usuario tiene acceso a features Pro (pro o premium). */
export function hasProAccess(plan: string | null | undefined): boolean {
  return plan === 'pro' || plan === 'premium'
}

export function getPlanLabel(plan: string | null | undefined): string {
  if (plan === 'premium') return 'Premium'
  if (plan === 'pro') return 'Pro'
  if (plan === 'starter') return 'Starter'
  return 'Free'
}

// ─── Legacy helpers (always return true) ────────────────────────────────────
// Mantenidos para no romper código existente que aún los llama.

export function roleAtLeast(_role: string | null | undefined, _minRole: string): boolean {
  return true
}

export function canCreateDog(_role: string, _currentDogCount: number): boolean {
  return true
}

export function canCreateLitter(_role: string, _activeLitterCount: number): boolean {
  return true
}

export function hasFeature(_role: string, _feature: string): boolean {
  return true
}
