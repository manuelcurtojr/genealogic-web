// Fase 4 · Wave 3 — Diccionario ES→EN del SHELL del dashboard + SOPORTE + BUSCADOR.
//
// Cubre los strings envueltos con t('...') / getTranslator(...) en:
//   · (dashboard)/soporte/page.tsx
//   · (dashboard)/search/page.tsx + (dashboard)/perros/page.tsx
//   · (dashboard)/error.tsx
//   · components/dashboard/daily-checkin.tsx
//   · components/search/** (recent-views-slider · directory-tabs · dogs-directory)
//   · components/layout/** (public-menu-button · search-bar · notifications-panel ·
//     command-bar · public-header · dashboard-shell · sidebar [solo el fix del title])
//
// Las claves son el español EXACTO pasado a t(). Duplicados con otros content
// dicts (i18n.ts base, content/2/3, otros content4) son inofensivos: getTranslator
// cascadea y devuelve el primer match. 'es' no necesita entradas (es la clave base).
//
// OJO con los caracteres especiales: '…' es el carácter elipsis (U+2026), distinto
// de '...' (tres puntos). '—' es em dash. '¿' '¡' signos de apertura. Se conservan
// byte a byte para que la clave haga match.

export const content4Shell: Record<string, Record<string, string>> = {
  en: {
    // ─── Header / drawer público (public-header · public-menu-button) ───
    'Abrir menú': 'Open menu',
    'Cerrar menú': 'Close menu',
    'Explorar': 'Explore',
    'Producto': 'Product',
    'Recursos': 'Resources',
    'Buscar perros': 'Search dogs',
    'Criaderos': 'Kennels',
    'Para criadores': 'For breeders',
    'Precios': 'Pricing',
    'API pública': 'Public API',
    'Blog': 'Blog',
    'Crear cuenta': 'Create account',
    'Iniciar sesión': 'Log in',
    'Registrarse': 'Sign up',
    'Perros': 'Dogs',

    // ─── Buscador del header (search-bar) ───
    'Buscar perros, criaderos, razas...': 'Search dogs, kennels, breeds...',
    'Buscando...': 'Searching...',
    'Sin resultados para': 'No results for',
    'Ver todos los resultados de': 'See all results for',

    // ─── Command bar (command-bar) ───
    'Buscar o ir a…': 'Search or jump to…',
    'Buscar': 'Search',
    'navegar': 'navigate',
    'ir': 'go',
    'resultado': 'result',
    'resultados': 'results',

    // ─── Panel de notificaciones (notifications-panel) ───
    'Notificaciones': 'Notifications',
    'Todas': 'All',
    'No leídas': 'Unread',
    'Marcar leídas': 'Mark as read',
    '¡Todo al día!': 'All caught up!',
    'Sin notificaciones': 'No notifications',
    'No tienes nada pendiente.': 'You have nothing pending.',
    'Te avisaremos aquí en tiempo real.': 'We\'ll notify you here in real time.',
    'Ver centro de notificaciones': 'Open notification center',
    'perros importados': 'dogs imported',
    'Borrador pendiente de confirmar': 'Draft pending confirmation',

    // ─── Shell (dashboard-shell) ───
    'Genos — asistente de Genealogic': 'Genos — Genealogic assistant',

    // ─── Sidebar (fix del title del logout) ───
    'Cerrar sesión': 'Log out',
    'Ajustes': 'Settings',

    // ─── Vistos recientemente (recent-views-slider) ───
    'Vistos recientemente': 'Recently viewed',
    'Limpiar': 'Clear',
    'Perro': 'Dog',
    'Criadero': 'Kennel',
    'Raza': 'Breed',

    // ─── Tabs de descubrimiento (directory-tabs) ───
    'Razas': 'Breeds',

    // ─── Directorio de perros (dogs-directory) ───
    'Buscar perro por nombre...': 'Search dog by name...',
    'Todas las razas': 'All breeds',
    'Ambos sexos': 'Both sexes',
    'Macho': 'Male',
    'Hembra': 'Female',
    'En venta': 'For sale',
    'No se encontraron resultados.': 'No results found.',
    'Prueba con otros filtros.': 'Try other filters.',
    'Consultar precio': 'Check price',
    'Has llegado al final': 'You\'ve reached the end',

    // ─── /search (página resumen) ───
    'Descubrimiento': 'Discovery',
    'Perros, criaderos y razas registrados en Genealogic.':
      'Dogs, kennels and breeds registered on Genealogic.',
    'Buscar por nombre de perro, criadero o raza...':
      'Search by dog name, kennel or breed...',
    'Escribe al menos 2 letras para buscar.': 'Type at least 2 letters to search.',
    'Busca a la vez entre perros, criaderos y razas.':
      'Search dogs, kennels and breeds all at once.',
    'Buscando…': 'Searching…',
    'perros': 'dogs',
    'Ver todos': 'See all',

    // ─── /perros (directorio) ───
    'Directorio': 'Directory',
    'Explora los perros registrados en Genealogic.':
      'Explore the dogs registered on Genealogic.',

    // ─── error.tsx ───
    'Algo salio mal': 'Something went wrong',
    'Ha ocurrido un error inesperado. Intenta recargar la página.':
      'An unexpected error occurred. Try reloading the page.',
    'Intentar de nuevo': 'Try again',

    // ─── /soporte ───
    '¿En qué te ayudamos?': 'How can we help?',
    'Escribe tu consulta y un humano del equipo te responderá lo antes posible. Solemos tardar menos de 24h en días laborables.':
      'Write your question and a human from the team will reply as soon as possible. We usually take less than 24h on business days.',
    'Tus últimas solicitudes': 'Your latest requests',
    'Ver todas mis solicitudes': 'See all my requests',

    // ─── Daily Check-In (daily-checkin) ───
    'Resumen diario': 'Daily summary',
    'Tu día en Genealogic': 'Your day on Genealogic',
    'Al día': 'Up to date',
    'Vencidos': 'Overdue',
    'Últimos 7 días': 'Last 7 days',
    'Hoy': 'Today',
    'Tareas programadas': 'Scheduled tasks',
    'Próximos 14d': 'Next 14d',
    'Por venir': 'Upcoming',
    'Para hoy': 'For today',
    'Ver': 'View',
    'más': 'more',
    'No hay tareas pendientes. Cuando programes vacunas, eventos o cruces, aparecerán aquí.':
      'No pending tasks. When you schedule vaccines, events or matings, they\'ll show up here.',
    'Recordatorio veterinario': 'Vet reminder',
    'Veterinario': 'Veterinary',
    'Vacuna': 'Vaccine',
    'Desparasitación': 'Deworming',
    'Revisión': 'Checkup',
    'Celo': 'Heat',
    'Cruce': 'Mating',
    'Parto': 'Birth',
    'Aseo': 'Grooming',
    'Exposición': 'Show',
    'Evento': 'Event',
  },
}
