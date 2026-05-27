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
  /** Oculto cuando la web se sirve dentro del WebView iOS (App Store 3.1.1) */
  hideOnIos?: boolean
}

export interface NavSection {
  id: string
  label: string
  requiresKennel?: boolean
  requiresPro?: boolean
  requiresAdmin?: boolean
  /** Solo visible si el user es cliente (tiene reservas/perros recibidos) */
  requiresClient?: boolean
  /** Oculto cuando la web se sirve dentro del WebView iOS (App Store 3.1.1) */
  hideOnIos?: boolean
  items: NavItem[]
}

// Sidebar consolidado tras la refactor 2026-05-24 #2:
//
//  - Comunicación: solo Emailbot + Newsletter (Hilos/Test/Conocimiento
//    viven como tabs dentro de Emailbot)
//  - Web pública: ELIMINADA, sus items son extensión natural del criadero
//    y viven en la sección Criadero (Páginas, Visitas, Estadísticas, Dominio)
//  - Analíticas eliminada del sidebar (confunde con Estadísticas;
//    accesible vía ⌘K y desde fichas individuales)
//  - Comunidad eliminada (criaderos se descubren desde /search)
//  - Cuenta eliminada — Suscripción + Facturación se gestionan desde
//    Ajustes; Dominio pasó a Criadero
//
// Reglas de visibilidad:
//   - Sin flags        → siempre
//   - requiresKennel   → solo criadores (con afijo registrado)
//   - requiresPro      → solo plan Pro/Premium
//   - requiresClient   → solo si tiene reservas o perros recibidos
//   - requiresAdmin    → solo profiles.role = 'admin'
export const NAV_SECTIONS: NavSection[] = [
  // ── Principal — siempre visible ──────────────────────────────────────
  // Notificaciones se accede vía la campana del header (siempre visible);
  // duplicarla aquí solo añade ruido.
  {
    id: 'main',
    label: '',
    items: [
      { label: 'Escritorio', href: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'Buscar', href: '/search', icon: 'Search' },
      { label: 'Calendario', href: '/calendar', icon: 'Calendar' },
    ],
  },

  // ── Genealogía — herramientas core del criador ──────────────────────
  // Reproducción y Veterinario viven como tabs del subnav de /calendar
  // (mismo módulo "tiempo"); no se duplican aquí.
  {
    id: 'genealogy',
    label: 'Genealogía',
    items: [
      { label: 'Perros', href: '/dogs', icon: 'Dog' },
      { label: 'Camadas', href: '/litters', icon: 'Baby', requiresKennel: true },
      { label: 'Simulador de cruces', href: '/cruces', icon: 'GitCompareArrows', requiresKennel: true },
      { label: 'Genotipos', href: '/genetica', icon: 'Dna', requiresKennel: true },
    ],
  },

  // ── Pipeline (Pro) — gestión comercial ──────────────────────────────
  {
    id: 'pipeline',
    label: 'Pipeline',
    // Pipeline está disponible para cualquier criador con kennel — no requiere
    // Pro. La vista Free es una bandeja simple de Reservas; Pro desbloquea
    // Contactos (CRM) y Contratos. Antes el sidebar ocultaba "Reservas" en
    // Free, así que los Free no veían las solicitudes que les llegaban por
    // su web pública. Fix de auditoría UX (A5).
    requiresKennel: true,
    hideOnIos: true,
    items: [
      { label: 'Reservas', href: '/reservas', icon: 'KanbanSquare', requiresKennel: true, hideOnIos: true },
      { label: 'Contactos', href: '/contactos', icon: 'UsersRound', requiresPro: true, requiresKennel: true, hideOnIos: true },
      { label: 'Contratos', href: '/contratos', icon: 'FileText', requiresPro: true, requiresKennel: true, hideOnIos: true },
    ],
  },

  // ── Comunicación (Pro) — solo entradas principales ──────────────────
  // Hilos del bot, Test del bot y Conocimiento viven como tabs dentro
  // de /emailbot; no se duplican aquí.
  {
    id: 'comms',
    label: 'Comunicación',
    requiresPro: true,
    hideOnIos: true,
    items: [
      { label: 'Emailbot', href: '/emailbot', icon: 'Mail', requiresPro: true, hideOnIos: true },
      { label: 'Newsletter', href: '/newsletter', icon: 'Send', requiresPro: true, hideOnIos: true },
    ],
  },

  // ── Criadero — solo entradas principales ────────────────────────────
  // Dominio, Pagos (Stripe) y API keys son configuración interna del
  // kennel; viven dentro de /kennel (no se duplican en sidebar).
  // Visitas también va dentro porque es parte del análisis del criadero;
  // dejamos Estadísticas como vista más general operativa.
  {
    id: 'kennel',
    label: 'Criadero',
    requiresKennel: true,
    items: [
      { label: 'Mi criadero', href: '/kennel', icon: 'Store', requiresKennel: true },
      { label: 'Páginas web', href: '/web', icon: 'Globe', requiresPro: true, requiresKennel: true, hideOnIos: true },
      { label: 'Estadísticas', href: '/estadisticas', icon: 'BarChart3', requiresPro: true, requiresKennel: true, hideOnIos: true },
    ],
  },

  // ── Propietario — solo si tiene reservas/perros como cliente ────────
  // Un user puede ser criador Y cliente simultáneamente (criador
  // comprando a otro). Aparece si hay reserva con client_user_id=me o
  // dog.owner_id=me (delivered_from_reservation_id NOT NULL).
  {
    id: 'client',
    label: 'Propietario',
    requiresClient: true,
    items: [
      { label: 'Mis reservas', href: '/mis-reservas', icon: 'KanbanSquare', requiresClient: true },
      { label: 'Mis perros', href: '/mis-perros', icon: 'Dog', requiresClient: true },
    ],
  },

  // ── Soporte — accesible para TODO usuario logueado (free incluido).
  // Antes /mis-solicitudes y /soporte vivían sin entrada en sidebar y el
  // usuario no podía abrir un ticket ni ver el histórico de sus claims
  // (perros/criaderos reclamados, tickets, feedback). El acceso solo
  // estaba vía URL directa o a través del widget de feedback.
  {
    id: 'support',
    label: 'Soporte',
    items: [
      { label: 'Mis solicitudes', href: '/mis-solicitudes', icon: 'Inbox' },
      { label: 'Contactar soporte', href: '/soporte', icon: 'LifeBuoy' },
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
      { label: 'Audit log', href: '/admin/audit', icon: 'ShieldAlert', requiresAdmin: true },
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
