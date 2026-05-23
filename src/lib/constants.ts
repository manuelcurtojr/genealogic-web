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
  requiresKennel?: boolean
  requiresPro?: boolean
  /** Si el usuario ES pro, este item se oculta (porque hay uno mejor) */
  hideIfPro?: boolean
}

export interface NavSection {
  id: string
  label: string
  requiresKennel?: boolean
  requiresPro?: boolean
  items: NavItem[]
}

// Sidebar minimalista: solo lo más usado a diario. Todo lo demás se invoca
// con ⌘K (CommandBar). Reduce ruido cognitivo de 30+ rutas a ~9 items.
//
// Lo que NO está aquí pero sigue accesible via ⌘K:
//   Buscar, Veterinario, Genética, Newsletter, Biblioteca, Emailbot config,
//   Hilos, Test, Estadísticas, Analíticas, API keys, Suscripción,
//   Facturación, Dominio, Comunidad de criaderos, etc.
//
// Reglas:
//   - requiresKennel: solo criadores (con afijo registrado)
//   - requiresPro: solo Pro tier
//   - Sin flags: visible para todos
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'main',
    label: '',
    items: [
      { label: 'Escritorio', href: '/dashboard', icon: 'LayoutDashboard' },
      // Catálogo y herramientas del criador
      { label: 'Perros', href: '/dogs', icon: 'Dog' },
      { label: 'Camadas', href: '/litters', icon: 'Baby', requiresKennel: true },
      { label: 'Cruces', href: '/cruces', icon: 'GitCompareArrows', requiresKennel: true },
      { label: 'Reproducción', href: '/reproduccion', icon: 'Heart', requiresKennel: true },
      // Tiempo
      { label: 'Calendario', href: '/calendar', icon: 'Calendar' },
      // Operativa Pro
      { label: 'Reservas', href: '/reservas', icon: 'KanbanSquare', requiresPro: true, requiresKennel: true },
      { label: 'Clientes', href: '/clientes', icon: 'UsersRound', requiresPro: true, requiresKennel: true },
      // Criadero como hub: contiene Web pública, Dominio, API, etc. dentro
      { label: 'Criadero', href: '/kennel', icon: 'Store', requiresKennel: true },
      // Emailbot como sección propia (con tabs internos para Hilos / Test / Biblioteca)
      { label: 'Emailbot', href: '/emailbot', icon: 'Mail', requiresPro: true, requiresKennel: true },
    ],
  },
]

// Legacy flat nav items (kept for backward compatibility)
export const NAV_ITEMS = [
  { label: 'Escritorio', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Mis Perros', href: '/dogs', icon: 'Dog' },
  { label: 'Camadas', href: '/litters', icon: 'Baby' },
  { label: 'Simulador de cruces', href: '/cruces', icon: 'GitCompareArrows' },
  { label: 'Calendario', href: '/calendar', icon: 'Calendar' },
  { label: 'Veterinario', href: '/vet', icon: 'Stethoscope' },
  { label: 'Buscar', href: '/search', icon: 'Search' },
  { label: 'Mi Criadero', href: '/kennel', icon: 'Store' },
  { label: 'Analíticas', href: '/analytics', icon: 'BarChart3' },
] as const
