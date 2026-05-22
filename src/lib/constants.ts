import type { UserRole } from './permissions'

export const BRAND = {
  name: 'Genealogic',
  primary: '#D74709',
  primaryHover: '#000000',
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
  requiresPro?: boolean       // only show if plan = 'pro' | 'premium'
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

  // ─── Pro tier sections (fusión Pawdoq Breeders) ──────────────────────────
  {
    id: 'pipeline',
    label: 'Pipeline',
    requiresKennel: true,
    requiresPro: true,
    items: [
      { label: 'Reservas', href: '/reservas', icon: 'KanbanSquare' },
      { label: 'Clientes', href: '/clientes', icon: 'UsersRound' },
    ],
  },
  {
    id: 'bot',
    label: 'Bot',
    requiresPro: true,
    items: [
      { label: 'Emailbot', href: '/emailbot', icon: 'Mail' },
      { label: 'Biblioteca', href: '/conocimiento', icon: 'BookOpen' },
      { label: 'Hilos reales', href: '/emailbot/hilos', icon: 'MessageSquare' },
      { label: 'Test', href: '/emailbot/test', icon: 'Beaker' },
    ],
  },
  {
    id: 'web',
    label: 'Web pública',
    requiresPro: true,
    items: [
      { label: 'Páginas', href: '/web', icon: 'Globe' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    requiresPro: true,
    items: [
      { label: 'Estadísticas', href: '/estadisticas', icon: 'TrendingUp' },
      { label: 'Newsletter', href: '/newsletter', icon: 'Send' },
    ],
  },
  {
    id: 'cuenta',
    label: 'Cuenta',
    requiresPro: true,
    items: [
      { label: 'Suscripción', href: '/cuenta/suscripcion', icon: 'Sparkles' },
      { label: 'Facturación', href: '/cuenta/facturacion', icon: 'Receipt' },
      { label: 'Dominio', href: '/cuenta/dominio', icon: 'Link2' },
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
