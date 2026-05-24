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
  requiresAdmin?: boolean
  /** Si el usuario ES pro, este item se oculta (porque hay uno mejor) */
  hideIfPro?: boolean
  /** Solo visible si el user tiene reservas/perros como cliente */
  requiresClient?: boolean
}

export interface NavSection {
  id: string
  label: string
  requiresKennel?: boolean
  requiresPro?: boolean
  requiresAdmin?: boolean
  /** Solo visible si el user es cliente (tiene reservas/perros recibidos) */
  requiresClient?: boolean
  items: NavItem[]
}

// Sidebar completo con TODAS las rutas del producto, organizadas por
// secciones temáticas. Cada item se muestra si el user cumple los flags
// (requiresKennel / requiresPro / requiresClient / requiresAdmin); las
// secciones se ocultan si ninguno de sus items pasa el filtro.
//
// El Command Bar (⌘K) sigue montado en DashboardShell para invocar
// acciones rápidas, pero ya no es la puerta principal de navegación.
//
// Reglas de visibilidad:
//   - Sin flags        → siempre
//   - requiresKennel   → solo criadores (con afijo registrado)
//   - requiresPro      → solo plan Pro/Premium
//   - requiresClient   → solo si tiene reservas o perros recibidos
//   - requiresAdmin    → solo profiles.role = 'admin'
//
// Convención de orden: lo que usa a diario va arriba; lo que se usa una
// vez al mes (cuenta, pagos, admin) va abajo.
export const NAV_SECTIONS: NavSection[] = [
  // ── Principal — siempre visible ──────────────────────────────────────
  {
    id: 'main',
    label: '',
    items: [
      { label: 'Escritorio', href: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'Buscar', href: '/search', icon: 'Search' },
      { label: 'Notificaciones', href: '/notifications', icon: 'Bell' },
      { label: 'Calendario', href: '/calendar', icon: 'Calendar' },
    ],
  },

  // ── Genealogía — herramientas core del criador ──────────────────────
  {
    id: 'genealogy',
    label: 'Genealogía',
    items: [
      { label: 'Perros', href: '/dogs', icon: 'Dog' },
      { label: 'Camadas', href: '/litters', icon: 'Baby', requiresKennel: true },
      { label: 'Cruces', href: '/cruces', icon: 'GitCompareArrows', requiresKennel: true },
      { label: 'Reproducción', href: '/reproduccion', icon: 'Heart', requiresKennel: true },
      { label: 'Genética', href: '/genetica', icon: 'Dna', requiresKennel: true },
      { label: 'Veterinario', href: '/vet', icon: 'Stethoscope' },
    ],
  },

  // ── Pipeline (Pro) — gestión comercial ──────────────────────────────
  {
    id: 'pipeline',
    label: 'Pipeline',
    requiresPro: true,
    requiresKennel: true,
    items: [
      { label: 'Reservas', href: '/reservas', icon: 'KanbanSquare', requiresPro: true, requiresKennel: true },
      { label: 'Contactos', href: '/contactos', icon: 'UsersRound', requiresPro: true, requiresKennel: true },
    ],
  },

  // ── Comunicación (Pro) ──────────────────────────────────────────────
  {
    id: 'comms',
    label: 'Comunicación',
    requiresPro: true,
    items: [
      { label: 'Emailbot', href: '/emailbot', icon: 'Mail', requiresPro: true },
      { label: 'Hilos', href: '/emailbot/hilos', icon: 'MessageSquare', requiresPro: true },
      { label: 'Test del bot', href: '/emailbot/test', icon: 'Beaker', requiresPro: true },
      { label: 'Conocimiento', href: '/conocimiento', icon: 'BookOpen', requiresPro: true },
      { label: 'Newsletter', href: '/newsletter', icon: 'Send', requiresPro: true },
    ],
  },

  // ── Web pública (Pro + Kennel) ──────────────────────────────────────
  {
    id: 'web',
    label: 'Web pública',
    requiresPro: true,
    requiresKennel: true,
    items: [
      { label: 'Páginas', href: '/web', icon: 'Globe', requiresPro: true, requiresKennel: true },
      { label: 'Visitas', href: '/visitas', icon: 'TrendingUp', requiresPro: true, requiresKennel: true },
      { label: 'Estadísticas', href: '/estadisticas', icon: 'BarChart3', requiresPro: true, requiresKennel: true },
      { label: 'Analíticas', href: '/analytics', icon: 'BarChart3', requiresKennel: true },
    ],
  },

  // ── Criadero — config del kennel ────────────────────────────────────
  {
    id: 'kennel',
    label: 'Criadero',
    requiresKennel: true,
    items: [
      { label: 'Mi criadero', href: '/kennel', icon: 'Store', requiresKennel: true },
      { label: 'Pagos (Stripe)', href: '/kennel/pagos', icon: 'CreditCard', requiresKennel: true },
      { label: 'API keys', href: '/kennel/api', icon: 'Key', requiresKennel: true },
    ],
  },

  // ── Propietario — solo si tiene reservas/perros como cliente ────────
  // Aparece para cualquiera con `puppy_reservations.client_user_id = me` o
  // `dogs.owner_id = me` (delivered_from_reservation_id NOT NULL). Un user
  // puede ser criador Y cliente simultáneamente (criador comprando a otro).
  {
    id: 'client',
    label: 'Propietario',
    requiresClient: true,
    items: [
      { label: 'Mis reservas', href: '/mis-reservas', icon: 'KanbanSquare', requiresClient: true },
      { label: 'Mis perros', href: '/mis-perros', icon: 'Dog', requiresClient: true },
    ],
  },

  // ── Comunidad — siempre visible ─────────────────────────────────────
  {
    id: 'community',
    label: 'Comunidad',
    items: [
      { label: 'Criaderos', href: '/kennels', icon: 'Users' },
    ],
  },

  // ── Cuenta (Pro) — subscription, billing, dominio ───────────────────
  {
    id: 'account',
    label: 'Cuenta',
    requiresPro: true,
    items: [
      { label: 'Suscripción', href: '/cuenta/suscripcion', icon: 'Sparkles', requiresPro: true },
      { label: 'Facturación', href: '/cuenta/facturacion', icon: 'Receipt', requiresPro: true },
      { label: 'Dominio', href: '/cuenta/dominio', icon: 'Link2', requiresPro: true },
    ],
  },

  // ── Admin — solo profiles.role='admin' ──────────────────────────────
  {
    id: 'admin',
    label: 'Admin',
    requiresAdmin: true,
    items: [
      { label: 'Panel', href: '/admin', icon: 'Shield', requiresAdmin: true },
      { label: 'Usuarios', href: '/admin/users', icon: 'Users', requiresAdmin: true },
      { label: 'Criaderos', href: '/admin/kennels', icon: 'Store', requiresAdmin: true },
      { label: 'Perros', href: '/admin/dogs', icon: 'Dog', requiresAdmin: true },
      { label: 'Catálogo', href: '/admin/catalog', icon: 'Tag', requiresAdmin: true },
      { label: 'Stats', href: '/admin/stats', icon: 'BarChart3', requiresAdmin: true },
      { label: 'Importador', href: '/admin/import', icon: 'Upload', requiresAdmin: true },
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
