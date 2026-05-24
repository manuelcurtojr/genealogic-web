/**
 * Catálogo global de comandos del Command Bar (⌘K).
 *
 * Cada comando tiene:
 *  - id único
 *  - label visible
 *  - href destino
 *  - icon (string lookup en iconMap del CommandBar)
 *  - section (agrupador en el listado)
 *  - keywords adicionales para fuzzy search
 *  - requiresPro / requiresKennel / requiresAdmin para filtrado por permisos
 */

export type Command = {
  id: string
  label: string
  href: string
  icon: string
  section: string
  keywords?: string[]
  requiresPro?: boolean
  requiresKennel?: boolean
  requiresAdmin?: boolean
  /** Ocultar si el usuario YA tiene un criadero (ej. "Crear criadero" no debe aparecer si ya lo tienes) */
  hideIfKennel?: boolean
}

export const COMMANDS: Command[] = [
  // ── PRINCIPAL ──────────────────────────────────────────────────────────
  { id: 'dashboard', label: 'Escritorio', href: '/dashboard', icon: 'LayoutDashboard', section: 'Principal', keywords: ['inicio', 'home', 'panel'] },
  { id: 'search', label: 'Buscar perros, criaderos, razas', href: '/search', icon: 'Search', section: 'Principal', keywords: ['buscador', 'find'] },
  { id: 'notifications', label: 'Notificaciones', href: '/notifications', icon: 'Bell', section: 'Principal', keywords: ['avisos', 'alerts'] },

  // ── GENEALOGÍA ─────────────────────────────────────────────────────────
  { id: 'dogs', label: 'Mis perros', href: '/dogs', icon: 'Dog', section: 'Genealogía', keywords: ['perros', 'ejemplares', 'reproductores', 'cachorros', 'nuevo perro', 'añadir perro', 'crear perro'] },
  { id: 'litters', label: 'Camadas', href: '/litters', icon: 'Baby', section: 'Genealogía', requiresKennel: true, keywords: ['camada', 'litter', 'partos', 'nueva camada', 'crear camada'] },
  { id: 'cruces', label: 'Simulador de cruces', href: '/cruces', icon: 'GitCompareArrows', section: 'Genealogía', requiresKennel: true, keywords: ['cruce', 'planner', 'planificador', 'pedigrí', 'coi', 'consanguinidad', 'apareamiento', 'simulador', 'cruzar'] },
  { id: 'reproduccion', label: 'Calendario reproductivo (Gantt)', href: '/reproduccion', icon: 'Heart', section: 'Genealogía', requiresKennel: true, keywords: ['celos', 'gestación', 'reproducción', 'hembras', 'planificador', 'gantt', 'ciclos', 'cría'] },
  { id: 'genetica', label: 'Genotipos', href: '/genetica', icon: 'Dna', section: 'Genealogía', requiresKennel: true, keywords: ['adn', 'dna', 'loci', 'merle', 'color', 'genotipo', 'embark', 'wisdom', 'punnett', 'fenotipo', 'genetica'] },
  { id: 'calendar', label: 'Calendario', href: '/calendar', icon: 'Calendar', section: 'Genealogía', keywords: ['agenda', 'eventos', 'celos', 'fechas'] },
  { id: 'vet', label: 'Veterinario y recordatorios', href: '/vet', icon: 'Stethoscope', section: 'Genealogía', keywords: ['vacunas', 'desparasitación', 'salud', 'health'] },

  // ── PIPELINE (Pro) ─────────────────────────────────────────────────────
  { id: 'reservas', label: 'Reservas (pipeline)', href: '/reservas', icon: 'KanbanSquare', section: 'Pipeline', requiresPro: true, requiresKennel: true, keywords: ['kanban', 'pedidos', 'depósito', 'reserva cachorro'] },
  { id: 'contactos', label: 'Contactos', href: '/contactos', icon: 'UsersRound', section: 'Pipeline', requiresPro: true, requiresKennel: true, keywords: ['clientes', 'compradores', 'familias', 'lista espera', 'crm', 'suscriptores', 'leads', 'newsletter'] },

  // ── COMUNICACIÓN (Pro) ─────────────────────────────────────────────────
  { id: 'emailbot', label: 'Emailbot', href: '/emailbot', icon: 'Mail', section: 'Comunicación', requiresPro: true, keywords: ['bot', 'auto-reply', 'ia', 'chat', 'emails'] },
  { id: 'emailbot-test', label: 'Test del Emailbot', href: '/emailbot/test', icon: 'Beaker', section: 'Comunicación', requiresPro: true, keywords: ['playground', 'probar bot'] },
  { id: 'emailbot-hilos', label: 'Hilos del Emailbot', href: '/emailbot/hilos', icon: 'MessageSquare', section: 'Comunicación', requiresPro: true, keywords: ['conversaciones', 'historial bot', 'derivados'] },
  { id: 'conocimiento', label: 'Biblioteca de conocimiento', href: '/conocimiento', icon: 'BookOpen', section: 'Comunicación', requiresPro: true, keywords: ['faq', 'precio', 'política reserva', 'condiciones'] },
  { id: 'newsletter', label: 'Newsletter (suscriptores)', href: '/newsletter', icon: 'Send', section: 'Comunicación', requiresPro: true, keywords: ['email marketing', 'campañas', 'suscriptores'] },

  // ── WEB PÚBLICA (Pro) ──────────────────────────────────────────────────
  { id: 'web', label: 'Páginas de la web', href: '/web', icon: 'Globe', section: 'Web pública', requiresPro: true, keywords: ['sitio', 'site', 'web builder', 'editor'] },
  { id: 'estadisticas', label: 'Estadísticas operativas', href: '/estadisticas', icon: 'TrendingUp', section: 'Análisis', requiresPro: true, keywords: ['analytics', 'reservas', 'pipeline', 'clientes', 'visitas', 'tráfico', 'web', 'pageviews'] },

  // ── CRIADERO ───────────────────────────────────────────────────────────
  { id: 'kennel', label: 'Mi criadero', href: '/kennel', icon: 'Store', section: 'Criadero', requiresKennel: true, keywords: ['perfil', 'afijo', 'kennel'] },
  { id: 'kennel-edit', label: 'Editar criadero', href: '/kennel/edit', icon: 'Edit3', section: 'Criadero', requiresKennel: true, keywords: ['datos del criadero', 'logo', 'descripción'] },
  { id: 'kennel-new', label: 'Crear mi criadero', href: '/kennel/new', icon: 'PlusCircle', section: 'Criadero', hideIfKennel: true, keywords: ['nuevo afijo', 'crear kennel', 'registrar criadero', 'afijo'] },
  { id: 'analytics', label: 'Analíticas del negocio', href: '/analytics', icon: 'BarChart3', section: 'Análisis', requiresKennel: true, keywords: ['stats', 'métricas', 'analytics', 'criadero', 'perros', 'camadas', 'palmarés'] },
  { id: 'kennel-api', label: 'API keys del criadero', href: '/kennel/api', icon: 'Key', section: 'Criadero', requiresKennel: true, keywords: ['integración', 'token', 'developer'] },
  { id: 'kennels-directory', label: 'Comunidad de criaderos', href: '/kennels', icon: 'Users', section: 'Comunidad', keywords: ['directorio', 'otros criaderos', 'buscar criaderos', 'explorar', 'descubrir', 'comunidad'] },

  // ── CUENTA (Pro) ───────────────────────────────────────────────────────
  { id: 'suscripcion', label: 'Suscripción y plan', href: '/cuenta/suscripcion', icon: 'Sparkles', section: 'Cuenta', requiresPro: true, keywords: ['plan', 'upgrade', 'pro', 'premium', 'billing'] },
  { id: 'facturacion', label: 'Facturación e historial', href: '/cuenta/facturacion', icon: 'Receipt', section: 'Cuenta', requiresPro: true, keywords: ['invoices', 'facturas', 'stripe portal'] },
  { id: 'dominio', label: 'Dominio personalizado', href: '/cuenta/dominio', icon: 'Link2', section: 'Cuenta', requiresPro: true, keywords: ['custom domain', 'dns', 'vercel'] },

  // ── AJUSTES ────────────────────────────────────────────────────────────
  { id: 'settings', label: 'Ajustes de la cuenta', href: '/settings', icon: 'Settings', section: 'Ajustes', keywords: ['perfil', 'avatar', 'password', 'preferencias'] },

  // ── ADMIN ──────────────────────────────────────────────────────────────
  { id: 'admin', label: 'Panel admin', href: '/admin', icon: 'Shield', section: 'Admin', requiresAdmin: true },
  { id: 'admin-users', label: 'Admin · Usuarios', href: '/admin/users', icon: 'Users', section: 'Admin', requiresAdmin: true },
  { id: 'admin-kennels', label: 'Admin · Criaderos', href: '/admin/kennels', icon: 'Store', section: 'Admin', requiresAdmin: true },
  { id: 'admin-dogs', label: 'Admin · Perros', href: '/admin/dogs', icon: 'Dog', section: 'Admin', requiresAdmin: true },
  { id: 'admin-catalog', label: 'Admin · Catálogo (razas, colores)', href: '/admin/catalog', icon: 'Tag', section: 'Admin', requiresAdmin: true },
  { id: 'admin-stats', label: 'Admin · Stats plataforma', href: '/admin/stats', icon: 'BarChart3', section: 'Admin', requiresAdmin: true },
  { id: 'admin-import', label: 'Admin · Importador', href: '/admin/import', icon: 'Upload', section: 'Admin', requiresAdmin: true },
]

/**
 * Filtra el catálogo por permisos del usuario actual.
 */
export function commandsFor(opts: {
  hasKennel: boolean
  isPro: boolean
  isAdmin: boolean
}): Command[] {
  return COMMANDS.filter(c => {
    if (c.requiresAdmin && !opts.isAdmin) return false
    if (c.requiresPro && !opts.isPro) return false
    if (c.requiresKennel && !opts.hasKennel) return false
    if (c.hideIfKennel && opts.hasKennel) return false
    return true
  })
}

/**
 * Match flexible para fuzzy search: token-based, case+accent insensitive,
 * busca en label + keywords + section.
 */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function filterCommands(commands: Command[], query: string): Command[] {
  const q = normalize(query.trim())
  if (!q) return commands
  const tokens = q.split(/\s+/).filter(Boolean)
  return commands
    .map(c => {
      const haystack = normalize([c.label, c.section, ...(c.keywords || [])].join(' '))
      const allMatch = tokens.every(t => haystack.includes(t))
      if (!allMatch) return null
      // Score: match exacto en label > match en label > match en keywords/section
      const lbl = normalize(c.label)
      let score = 0
      if (lbl === q) score += 1000
      else if (lbl.startsWith(q)) score += 500
      else if (lbl.includes(q)) score += 200
      for (const t of tokens) if (lbl.includes(t)) score += 50
      return { c, score }
    })
    .filter((x): x is { c: Command; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map(x => x.c)
}
