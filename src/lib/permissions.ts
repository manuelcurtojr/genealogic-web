// Centralized permissions for Genealogic
// Genealogic is FREE for everyone. Roles are simplified:
//   - 'owner'   = default (a user with dogs but no kennel)
//   - 'breeder' = a user who has created a kennel (auto-promoted via DB trigger)
//   - 'admin'   = internal admin role
// Monetization happens in Pawdoq Breeders, not here.

export type UserRole = 'owner' | 'breeder' | 'admin'

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
  if (role === 'breeder') return { label: 'Criador', bg: 'bg-[#D74709]/15 text-[#D74709]' }
  return { label: 'Propietario', bg: 'bg-white/10 text-white/40' }
}

// Legacy compatibility helpers (always return true / no plan gating).
// These exist temporarily so existing code doesn't break while we clean up.
// Once all references are removed, delete these.
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
