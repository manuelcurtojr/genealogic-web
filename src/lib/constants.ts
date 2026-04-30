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
  OWNER: 'owner' as UserRole,
  BREEDER: 'breeder' as UserRole,
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
  requiresKennel?: boolean    // only show if user has a kennel (= breeder)
  items: NavItem[]
}

// Sections visible per role:
// Owner (no kennel):  Principal | Perros | Herramientas (Calendar, Vet)
// Breeder (kennel):   Principal | Perros | Crianza | Criadero
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
    items: [
      { label: 'Calendario', href: '/calendar', icon: 'Calendar' },
      { label: 'Veterinario', href: '/vet', icon: 'Stethoscope' },
    ],
  },
  {
    id: 'breeding',
    label: 'Crianza',
    requiresKennel: true,
    items: [
      { label: 'Camadas', href: '/litters', icon: 'Baby' },
      { label: 'Planificador', href: '/planner', icon: 'GitCompareArrows' },
    ],
  },
  {
    id: 'kennel',
    label: 'Criadero',
    requiresKennel: true,
    items: [
      { label: 'Mi Criadero', href: '/kennel', icon: 'Store' },
      { label: 'Analíticas', href: '/analytics', icon: 'BarChart3' },
      { label: 'API', href: '/kennel/api', icon: 'Key' },
    ],
  },
]

// Legacy flat nav items (kept for backward compatibility)
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
