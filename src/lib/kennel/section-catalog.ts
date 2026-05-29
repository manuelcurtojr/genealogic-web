/**
 * Catálogo de secciones disponibles del web builder.
 *
 * Cada entrada describe:
 *  - `type`: el identificador que va en sections[].type
 *  - `label`: cómo se muestra en la UI (lista de "añadir sección", título de card)
 *  - `description`: texto explicativo para el modal de añadir sección
 *  - `pages`: en qué slugs de página puede aparecer (["*"] = en todas)
 *  - `defaultProps`: props iniciales al añadir la sección
 *  - `liveData`: si tira datos en vivo (Genealogic, posts del blog, etc.)
 */

export type SectionCatalogEntry = {
  type: string;
  label: string;
  description: string;
  pages: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultProps: Record<string, any>;
  liveData?: boolean;
};

export const SECTION_CATALOG: SectionCatalogEntry[] = [
  // ── Landing essentials ──────────────────────────────────────────────
  {
    type: 'two-column-block',
    label: 'Bloque 2 columnas (foto + texto)',
    description: 'Foto a un lado y título + texto + botón al otro. La foto puede ir a izquierda o derecha.',
    pages: ['*'],
    defaultProps: {
      eyebrow: '',
      title: 'Título del bloque',
      body: 'Descripción del bloque a 2 columnas.',
      cta: { label: 'Más info', href: '/historia', variant: 'primary' },
      image: { url: '', alt: '' },
      imagePosition: 'left',
    },
  },
  {
    type: 'reviews',
    label: 'Reseñas / testimonios',
    description: 'Reseñas en grid con estrellas. Las añades a mano y, si pegas el link de tu ficha de Google Maps, aparece un botón "Ver todas las reseñas en Google".',
    pages: ['*'],
    defaultProps: {
      title: 'Lo que dicen nuestras familias',
      subtitle: '',
      reviews: [],
      google_maps_url: '',
      showAverage: true,
    },
  },
  {
    type: 'video-embed',
    label: 'Vídeo (YouTube/Vimeo)',
    description: 'Embed de un vídeo con titular opcional encima.',
    pages: ['*'],
    defaultProps: {
      eyebrow: '',
      title: '',
      url: '',
      caption: '',
      aspectRatio: '16:9',
    },
  },
  {
    type: 'press-logos',
    label: 'Hemos aparecido en (logos)',
    description: 'Banda de logos de medios donde ha aparecido el criadero.',
    pages: ['*'],
    defaultProps: {
      title: 'Hemos aparecido en',
      items: [],
    },
  },
  {
    type: 'kennel-stats',
    label: 'Stats del criadero',
    description: 'Números grandes (años, cachorros entregados, países, etc.).',
    pages: ['*'],
    defaultProps: {
      eyebrow: '',
      title: '',
      stats: [
        { value: '50', label: 'Años criando' },
        { value: '300+', label: 'Cachorros entregados' },
        { value: '12', label: 'Países' },
      ],
    },
  },
  {
    type: 'process-steps',
    label: 'Pasos del proceso',
    description: 'Pasos numerados (cómo reservar, cómo funciona, etc.).',
    pages: ['*'],
    defaultProps: {
      eyebrow: 'Cómo funciona',
      title: 'Reservar es muy sencillo',
      steps: [
        { title: 'Paso 1', body: 'Descripción' },
        { title: 'Paso 2', body: 'Descripción' },
        { title: 'Paso 3', body: 'Descripción' },
      ],
    },
  },
  {
    type: 'faq',
    label: 'Preguntas frecuentes',
    description: 'Acordeón de preguntas y respuestas.',
    pages: ['*'],
    defaultProps: {
      eyebrow: '',
      title: 'Preguntas frecuentes',
      items: [
        { q: 'Pregunta', a: 'Respuesta' },
      ],
    },
  },
  {
    type: 'latest-posts',
    label: 'Últimos posts del blog',
    description: 'Tira con los 3 últimos posts publicados (live).',
    pages: ['*'],
    liveData: true,
    defaultProps: {
      eyebrow: 'Blog',
      title: 'Últimas publicaciones',
      limit: 3,
    },
  },
  {
    type: 'chat-promo',
    label: 'Promo del chat',
    description: 'Banda invitando a abrir el chatbot del criadero.',
    pages: ['*'],
    defaultProps: {
      eyebrow: '',
      title: '¿Tienes dudas?',
      body: 'Habla con nuestro asistente — responde 24/7 sobre la raza, la reserva o cualquier cosa que necesites.',
      ctaLabel: 'Abrir chat',
    },
  },

  // ── Comunes ─────────────────────────────────────────────────────────
  {
    type: 'page-header',
    label: 'Cabecera de página',
    description: 'Eyebrow + título grande + subtítulo. Para abrir cualquier página interior.',
    pages: ['perros', 'servicios', 'instalaciones', 'blog', 'contacto'],
    defaultProps: {
      eyebrow: '',
      title: 'Título de la página',
      subtitle: '',
    },
  },
  {
    type: 'newsletter',
    label: 'Boletín',
    description: 'Formulario para suscribirse al newsletter.',
    pages: ['*'],
    defaultProps: {
      headline: 'Boletín',
      body: 'Recibe las últimas noticias en tu correo.',
      ctaLabel: 'Suscribirse',
    },
  },
  {
    type: 'trust-strip',
    label: 'Tira de confianza',
    description: 'Frase grande centrada con subtítulo. Buena para cerrar páginas.',
    pages: ['*'],
    defaultProps: {
      headline: 'Confianza que cruza fronteras',
      body: '',
    },
  },
  {
    type: 'cta-banner',
    label: 'Banner con llamada a la acción',
    description: 'Banda con titular + botón gordo. Para empujar a contactar/reservar.',
    pages: ['*'],
    defaultProps: {
      headline: 'Reserva tu cachorro',
      body: '',
      cta: { label: 'Empezar', href: '/contacto', variant: 'primary' },
    },
  },

  // ── Inicio ─────────────────────────────────────────────────────────
  {
    type: 'hero',
    label: 'Hero — portada principal',
    description: 'Foto/gradiente fullscreen con tagline grande y 2 CTAs.',
    pages: ['home'],
    defaultProps: {
      eyebrow: '',
      tagline: 'Nombre del criadero',
      tagline_emphasis: '',
      subtitle: '',
      ctas: [
        { label: 'Comprar cachorro', href: '#chat', variant: 'primary' },
        { label: 'Sobre la raza', href: '/raza', variant: 'outline' },
      ],
    },
  },
  {
    type: 'three-pillars',
    label: 'Tres pilares editorial',
    description: '3 columnas con título + texto narrativo + enlace a página interna.',
    pages: ['home'],
    defaultProps: {
      pillars: [
        { title: 'Pilar 1', body: '', cta: { label: 'Más', href: '/' } },
        { title: 'Pilar 2', body: '', cta: { label: 'Más', href: '/' } },
        { title: 'Pilar 3', body: '', cta: { label: 'Más', href: '/' } },
      ],
    },
  },
  {
    type: 'available-puppies-strip',
    label: 'Tira de ejemplares disponibles',
    description: '3-4 ejemplares (cachorros y adultos) del último listado de Genealogic + CTA al listado completo.',
    pages: ['home'],
    liveData: true,
    defaultProps: { limit: 4, ctaLabel: 'Ver todos los disponibles', breeds: [] },
  },

  // ── Perros ─────────────────────────────────────────────────────────
  {
    type: 'available-puppies-grid',
    label: 'Ejemplares disponibles',
    description: 'Catálogo de ejemplares (cachorros y adultos) en venta. Live de Genealogic.',
    pages: ['perros'],
    liveData: true,
    defaultProps: { showFilters: true, layout: 'grid' },
  },
  {
    type: 'breeding-dogs-grid',
    label: 'Reproductores',
    description: 'Grid de sementales y reproductoras con enlace a su genealogía en Genealogic.',
    pages: ['perros'],
    liveData: true,
    defaultProps: { filterBy: 'all', showPedigreeLink: true },
  },
  {
    type: 'dogs-tabs',
    label: 'Catálogo con pestañas',
    description:
      'Pestañas en la cabecera para navegar entre Reproductores, En venta, Camadas y Producidos por nosotros. Tira datos en vivo de Genealogic. Puedes filtrar las razas que se muestran.',
    pages: ['perros'],
    liveData: true,
    defaultProps: {
      tabs: ['reproductores', 'en-venta', 'camadas', 'producidos'],
      defaultTab: 'reproductores',
      breeds: [],
    },
  },
  {
    type: 'waitlist-cta',
    label: 'CTA lista de espera',
    description: 'Banda "no hay disponibles ahora — apúntate".',
    pages: ['perros', 'home'],
    defaultProps: {
      headline: '¿No encuentras lo que buscas?',
      body: 'Apúntate a la lista de espera y serás de los primeros en saberlo.',
      cta: { label: 'Apuntarme', href: '/contacto' },
    },
  },

  // ── Razas ──────────────────────────────────────────────────────────
  {
    type: 'breed-hero',
    label: 'Hero de raza',
    description: 'Portada de la página de raza: nombre + foto + 1 frase.',
    pages: ['razas'],
    defaultProps: { eyebrow: 'Sobre la raza', title: 'Nombre de la raza', subtitle: '' },
  },
  {
    type: 'breed-summary',
    label: 'Ficha técnica de raza',
    description: '3 stats grandes: altura, peso, esperanza de vida.',
    pages: ['razas'],
    defaultProps: {
      stats: [
        { label: 'Altura', value: '—', unit: 'cm' },
        { label: 'Peso', value: '—', unit: 'kg' },
        { label: 'Vida', value: '—', unit: 'años' },
      ],
    },
  },
  {
    type: 'breed-temperament',
    label: 'Carácter de la raza',
    description: '3 columnas con rasgos de carácter (protección, tolerancia, etc.).',
    pages: ['razas'],
    defaultProps: {
      pillars: [
        { title: 'Rasgo 1', body: '' },
        { title: 'Rasgo 2', body: '' },
        { title: 'Rasgo 3', body: '' },
      ],
    },
  },
  {
    type: 'breed-colors',
    label: 'Capas / colores de la raza',
    description:
      'Grid con los colores reconocidos. Cada capa puede llevar foto cuadrada y descripción.',
    pages: ['razas'],
    defaultProps: {
      title: 'Capas reconocidas',
      colors: [
        { name: 'Color 1', image_url: '', description: '' },
      ],
    },
  },
  {
    type: 'breed-traits',
    label: 'Estadísticas de la raza',
    description: 'Lista con barras de % (afecto familia, salud, energía, ladrido…).',
    pages: ['razas'],
    defaultProps: { title: 'Estadísticas', traits: [] },
  },

  // ── Historia ──────────────────────────────────────────────────────
  {
    type: 'story-hero',
    label: 'Hero de historia',
    description: 'Portada de la página de historia.',
    pages: ['historia'],
    defaultProps: { eyebrow: 'Nuestra historia', title: 'Título', subtitle: '' },
  },
  {
    type: 'timeline',
    label: 'Línea de tiempo',
    description: 'Hitos por año con título + descripción.',
    pages: ['historia'],
    defaultProps: { milestones: [] },
  },
  {
    type: 'team',
    label: 'Equipo / generaciones',
    description: 'Bloques con nombre + rol + biografía de cada miembro del equipo.',
    pages: ['historia'],
    defaultProps: { eyebrow: '', title: '', members: [] },
  },

  // ── Servicios ─────────────────────────────────────────────────────
  {
    type: 'services-grid',
    label: 'Grid de servicios',
    description: 'Tarjetas con icono + título + descripción + CTA.',
    pages: ['servicios'],
    defaultProps: {
      services: [
        { icon: 'advice', title: 'Servicio 1', body: '', cta: { label: 'Más info', href: '/contacto' } },
      ],
    },
  },

  // ── Instalaciones ─────────────────────────────────────────────────
  {
    type: 'facilities-hero',
    label: 'Hero de instalaciones',
    description: 'Portada de instalaciones: ubicación + frase descriptiva.',
    pages: ['instalaciones'],
    defaultProps: {
      eyebrow: 'Instalaciones',
      title: 'Ubicación',
      body: '',
      bg_image_url: '',
      bg_overlay_opacity: 0.55,
    },
  },
  {
    type: 'facility-features',
    label: 'Características de las instalaciones',
    description: 'Lista de stats: superficie, parideras, exterior, etc.',
    pages: ['instalaciones'],
    defaultProps: { features: [] },
  },
  {
    type: 'gallery-grid',
    label: 'Galería de fotos',
    description:
      'Grid de fotos con lightbox al hacer click. Eyebrow/título/subtítulo y botón debajo opcionales.',
    pages: ['instalaciones', 'home', 'galeria'],
    defaultProps: { images: [], layout: 'uniform', columns: 3 },
  },
  {
    type: 'visit-cta',
    label: 'CTA concierta visita',
    description: 'Banda "concierta tu visita" con botón.',
    pages: ['instalaciones'],
    defaultProps: {
      headline: 'Concierta tu visita',
      body: '',
      cta: { label: 'Pedir cita', href: '/contacto' },
    },
  },

  // ── Blog ──────────────────────────────────────────────────────────
  {
    type: 'blog-hero',
    label: 'Hero del blog',
    description: 'Portada del índice del blog.',
    pages: ['blog'],
    defaultProps: { eyebrow: 'Blog', title: 'Título del blog', subtitle: '' },
  },
  {
    type: 'featured-post',
    label: 'Post destacado',
    description: 'Último post o uno fijado, con foto grande y excerpt.',
    pages: ['blog'],
    liveData: true,
    defaultProps: { mode: 'latest' },
  },
  {
    type: 'posts-grid',
    label: 'Grid de posts',
    description: 'Listado paginado de posts del blog.',
    pages: ['blog'],
    liveData: true,
    defaultProps: { pageSize: 12, showCategories: true, layout: 'grid' },
  },

  // ── Contacto ──────────────────────────────────────────────────────
  {
    type: 'contact-form',
    label: 'Formulario de contacto',
    description: 'Form con nombre, email, teléfono, tema y mensaje.',
    pages: ['contacto'],
    defaultProps: {
      headline: 'Cuéntanos',
      subjectOptions: ['Información sobre cachorros', 'Lista de espera', 'Otros'],
    },
  },
  {
    type: 'contact-info',
    label: 'Datos de contacto',
    description: 'Dirección, teléfono, email, horarios.',
    pages: ['contacto'],
    defaultProps: {
      address: '',
      phone: '',
      email: '',
      hours: '',
    },
  },
  {
    type: 'map-embed',
    label: 'Mapa embebido',
    description: 'Mapa de Google con la dirección del criadero.',
    pages: ['contacto'],
    defaultProps: { address: '' },
  },
];

/** Devuelve las entradas del catálogo aplicables a una página. */
export function catalogForPage(slug: string): SectionCatalogEntry[] {
  return SECTION_CATALOG.filter(
    (e) => e.pages.includes('*') || e.pages.includes(slug),
  );
}

/** Busca una entrada del catálogo por type. */
export function getCatalogEntry(type: string): SectionCatalogEntry | undefined {
  return SECTION_CATALOG.find((e) => e.type === type);
}

/** Etiqueta humana para un section.type, con fallback al propio type. */
export function labelForType(type: string): string {
  return getCatalogEntry(type)?.label ?? type;
}

/** Genera un id corto único para una sección nueva. */
export function newSectionId(type: string): string {
  const r = Math.random().toString(36).slice(2, 8);
  return `sec_${type.replace(/[^a-z0-9]/gi, '').slice(0, 6)}_${r}`;
}
