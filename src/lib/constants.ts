import type { UserRole } from './permissions'

export const BRAND = {
  name: 'Genealogic',
  primary: '#D74709',
  primaryHover: '#c03d07',
  primaryLight: '#f8e8e0',
  male: '#017DFA',
  female: '#e84393',
  success: '#27ae60',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#3498db',
} as const

export const ROLES = {
  FREE: 'free' as UserRole,
  AMATEUR: 'amateur' as UserRole,
  PRO: 'pro' as UserRole,
  ADMIN: 'admin' as UserRole,
} as const

// Navigation organized by sections
export interface NavItem {
  label: string
  href: string
  icon: string
}

export interface NavSection {
  id: string
  label: string
  minRole?: UserRole          // minimum role to see this section
  requiresKennel?: boolean    // only show if user has a kennel
  items: NavItem[]
}

// Sections visible per role:
// Free:     Principal | Perros | Herramientas (Vet)
// Amateur:  Principal | Perros | Crianza (Camadas, Vet) | Criadero (Mi Criadero, Analíticas)
// Pro:      Same as Amateur

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'main',
    label: 'Principal',
    items: [
      { label: 'Escritorio', href: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'Buscar', href: '/search', icon: 'Search' },
    ],
  },
  {
    id: 'dogs',
    label: 'Perros',
    items: [
      { label: 'Mis Perros', href: '/dogs', icon: 'Dog' },
    ],
  },
  {
    id: 'tools',
    label: 'Herramientas',
    // This section only shows for free users — amateur+ see these in 'breeding'
    items: [
      { label: 'Calendario', href: '/calendar', icon: 'Calendar' },
      { label: 'Veterinario', href: '/vet', icon: 'Stethoscope' },
    ],
  },
  {
    id: 'breeding',
    label: 'Crianza',
    minRole: 'amateur',
    items: [
      { label: 'Camadas', href: '/litters', icon: 'Baby' },
      { label: 'Planificador', href: '/planner', icon: 'GitCompareArrows' },
      { label: 'Calendario', href: '/calendar', icon: 'Calendar' },
      { label: 'Veterinario', href: '/vet', icon: 'Stethoscope' },
    ],
  },
  {
    id: 'kennel',
    label: 'Criadero',
    minRole: 'amateur',
    items: [
      { label: 'Mi Criadero', href: '/kennel', icon: 'Store' },
      { label: 'Analíticas', href: '/analytics', icon: 'BarChart3' },
    ],
  },
]

// Legacy flat nav items (kept for backward compatibility during migration)
export const NAV_ITEMS = [
  { label: 'Escritorio', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Mis Perros', href: '/dogs', icon: 'Dog' },
  { label: 'Camadas', href: '/litters', icon: 'Baby' },
  { label: 'Planificador', href: '/planner', icon: 'GitCompareArrows' },
  { label: 'Calendario', href: '/calendar', icon: 'Calendar' },
  { label: 'Veterinario', href: '/vet', icon: 'Stethoscope' },
  { label: 'Buscar', href: '/search', icon: 'Search' },
  { label: 'Mi Criadero', href: '/kennel', icon: 'Store' },
  { label: 'Analíticas', href: '/analytics', icon: 'BarChart3' },
] as const

export const PRO_NAV_ITEMS: ReadonlyArray<{ label: string; href: string; icon: string }> = []
