// Centralized permissions and plan limits for Genealogic

export type UserRole = 'free' | 'amateur' | 'pro' | 'admin'

export interface PlanLimits {
  maxDogs: number | null       // null = unlimited
  maxActiveLitters: number | null
  hasKennel: boolean
  hasCrm: boolean
  hasInbox: boolean            // simple request inbox (amateur)
  hasPlanner: boolean
  hasAnalytics: boolean
  hasAdvancedAnalytics: boolean
  hasWaitingList: boolean
  hasCustomForms: boolean
}

// Static plan limits (mirrored from plan_limits table for client-side use)
const PLAN_LIMITS: Record<UserRole, PlanLimits> = {
  free: {
    maxDogs: 5,
    maxActiveLitters: 0,
    hasKennel: false,
    hasCrm: false,
    hasInbox: false,
    hasPlanner: false,
    hasAnalytics: false,
    hasAdvancedAnalytics: false,
    hasWaitingList: false,
    hasCustomForms: false,
  },
  amateur: {
    maxDogs: 25,
    maxActiveLitters: 3,
    hasKennel: true,
    hasCrm: false,
    hasInbox: true,
    hasPlanner: true,
    hasAnalytics: true,
    hasAdvancedAnalytics: false,
    hasWaitingList: false,
    hasCustomForms: false,
  },
  pro: {
    maxDogs: null,
    maxActiveLitters: null,
    hasKennel: true,
    hasCrm: true,
    hasInbox: false,
    hasPlanner: true,
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasWaitingList: true,
    hasCustomForms: true,
  },
  admin: {
    maxDogs: null,
    maxActiveLitters: null,
    hasKennel: true,
    hasCrm: true,
    hasInbox: false,
    hasPlanner: true,
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasWaitingList: true,
    hasCustomForms: true,
  },
}

export function getPlanLimits(role: string): PlanLimits {
  return PLAN_LIMITS[(role as UserRole)] || PLAN_LIMITS.free
}

export function canCreateDog(role: string, currentDogCount: number): boolean {
  const limits = getPlanLimits(role)
  if (limits.maxDogs === null) return true
  return currentDogCount < limits.maxDogs
}

export function canCreateLitter(role: string, activeLitterCount: number): boolean {
  const limits = getPlanLimits(role)
  if (limits.maxActiveLitters === null) return true
  return activeLitterCount < limits.maxActiveLitters
}

export function hasFeature(role: string, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(role)
  return !!limits[feature]
}

// Role hierarchy: free < amateur < pro < admin
const ROLE_ORDER: UserRole[] = ['free', 'amateur', 'pro', 'admin']

export function roleAtLeast(role: string, minRole: UserRole): boolean {
  const userIdx = ROLE_ORDER.indexOf((role as UserRole) || 'free')
  const minIdx = ROLE_ORDER.indexOf(minRole)
  return userIdx >= minIdx
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'amateur': return 'Amateur'
    case 'pro': return 'Profesional'
    case 'admin': return 'Admin'
    default: return 'Propietario'
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'amateur': return 'text-blue-400'
    case 'pro': return 'text-[#D74709]'
    case 'admin': return 'text-red-400'
    default: return 'text-white/40'
  }
}

export function getRoleBadge(role: string): { label: string; bg: string } {
  switch (role) {
    case 'amateur': return { label: 'Amateur', bg: 'bg-blue-500/15 text-blue-400' }
    case 'pro': return { label: 'PRO', bg: 'bg-[#D74709]/15 text-[#D74709]' }
    case 'admin': return { label: 'Admin', bg: 'bg-red-500/15 text-red-400' }
    default: return { label: 'Free', bg: 'bg-white/10 text-white/40' }
  }
}

// Pricing info
export const PRICING = {
  amateur: {
    monthly: 7.99,
    yearly: 79,
    currency: 'EUR',
  },
  pro: {
    monthly: 14.99,
    yearly: 139,
    currency: 'EUR',
  },
} as const
