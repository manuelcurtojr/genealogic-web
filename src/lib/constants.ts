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
// Free:     Principal | Perros | Herramientas (Calendario, Vet)
// Amateur:  Principal | Perros | Crianza (Camadas, Planificador, Calendario, Vet) | Criadero (Mi Criadero, Solicitudes, Analíticas)
// Pro:      Principal | Perros | Crianza | Criadero (Mi Criadero, Analíticas) | CRM (Contactos, Negocios)

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
      { label: 'Contribuciones', href: '/contributions', icon: 'FileInput' },
      { label: 'Favoritos', href: '/favorites', icon: 'Heart' },
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
  {
    id: 'inbox',
    label: 'Solicitudes',
    minRole: 'amateur',
    // Only for amateur — pro users see CRM instead
    items: [
      { label: 'Bandeja', href: '/crm/inbox', icon: 'Inbox' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    minRole: 'pro',
    items: [
      { label: 'Contactos', href: '/crm/contacts', icon: 'Users' },
      { label: 'Negocios', href: '/crm/deals', icon: 'HandCoins' },
    ],
  },
]

// Legacy flat nav items (kept for backward compatibility during migration)
export const NAV_ITEMS = [
  { label: 'Escritorio', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Mis Perros', href: '/dogs', icon: 'Dog' },
  { label: 'Contribuciones', href: '/contributions', icon: 'FileInput' },
  { label: 'Camadas', href: '/litters', icon: 'Baby' },
  { label: 'Calendario', href: '/calendar', icon: 'Calendar' },
  { label: 'Planificador', href: '/planner', icon: 'GitCompareArrows' },
  { label: 'Veterinario', href: '/vet', icon: 'Stethoscope' },
  { label: 'Buscar', href: '/search', icon: 'Search' },
  { label: 'Favoritos', href: '/favorites', icon: 'Heart' },
  { label: 'Mi Criadero', href: '/kennel', icon: 'Store' },
  { label: 'Analíticas', href: '/analytics', icon: 'BarChart3' },
] as const

export const PRO_NAV_ITEMS = [
  { label: 'Contactos', href: '/crm/contacts', icon: 'Users' },
  { label: 'Negocios', href: '/crm/deals', icon: 'HandCoins' },
] as const
