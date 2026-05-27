/**
 * Catálogo de features para la página /features.
 *
 * Estructura: categorías → features mayores (con mockup grande, copy
 * largo, bullets) + featurettes (cards pequeñas, sin mockup, solo
 * icono + título + descripción breve).
 *
 * El sidebar y el contenido principal leen de aquí. Para añadir una
 * feature, basta con añadirla al array — el sidebar se actualiza solo.
 *
 * Convención de slugs: kebab-case ASCII. Se usan como anchor id
 * (#pipeline-reservas) para deep-linking desde el sidebar y desde
 * cualquier landing.
 */
import type { ElementType } from 'react'
import {
  KanbanSquare, Globe, GitBranch, Mail, Dog, BarChart3,
  FileText, ArrowRightLeft, Camera, Stethoscope, Calendar,
  Send, Shield, Search, Star, Inbox, Upload, Sparkles, Heart,
  CreditCard, BookOpen, Bell, Users, Tag, MapPin, Eye, Lock,
} from 'lucide-react'

export interface Featurette {
  icon: ElementType
  title: string
  description: string
}

export interface MajorFeature {
  slug: string
  icon: ElementType
  /** Eyebrow corto sobre el título — el problema que resuelve */
  problem: string
  /** Título de la sección */
  title: string
  /** 1-2 frases que explican el qué */
  description: string
  /** 3-5 bullets concretos de lo que hace */
  bullets: string[]
  /** Slug del mockup a renderizar (el componente Mockup lo resuelve) */
  mockup: string
  /** Si la feature requiere plan Pro, mostramos badge */
  proOnly?: boolean
}

export interface Category {
  slug: string
  label: string
  /** Resumen para el header de la categoría en la página */
  tagline: string
  features: MajorFeature[]
  /** Card grid debajo de las features mayores */
  featurettes: Featurette[]
}

export const CATEGORIES: Category[] = [
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'pipeline',
    label: 'Pipeline de ventas',
    tagline: 'Convierte solicitudes en clientes felices sin que se te escape ni una.',
    features: [
      {
        slug: 'reservas',
        icon: KanbanSquare,
        problem: 'Pierdes solicitudes entre WhatsApps, emails y notas en papel',
        title: 'Pipeline de reservas en kanban',
        description: 'Todas las solicitudes que recibes (web pública, formulario, manual) entran a un único pipeline. Arrastra entre estados, ve el histórico de cada cliente y nunca más pierdas una venta.',
        bullets: [
          'Drag-and-drop entre 7 estados: interesado → seña → contrato → pago → entrega',
          'Cada solicitud guarda el thread de mensajes y el histórico',
          'Notificación inmediata cuando llega una nueva',
          'Vista list o kanban según prefieras',
        ],
        mockup: 'pipeline-kanban',
      },
      {
        slug: 'contratos',
        icon: FileText,
        problem: 'Re-escribes el mismo contrato cada vez',
        title: 'Plantillas de contrato reutilizables',
        description: 'Guarda tus modelos de contrato (compraventa, copropiedad reproductiva, opciones de retiro) y úsalos en cada reserva en un click. Variables auto-rellenadas con los datos del cliente.',
        bullets: [
          'Editor Markdown con vista previa en vivo',
          'Variables {{clientName}}, {{dogName}}, {{breed}}, {{totalPrice}}…',
          'Marca uno como "por defecto" — sale pre-seleccionado',
          'Firma electrónica básica con timestamp + IP',
        ],
        mockup: 'contract-editor',
      },
      {
        slug: 'pagos',
        icon: CreditCard,
        problem: 'Cobros por Bizum y transferencias sin trazabilidad',
        title: 'Pagos con Stripe Connect',
        proOnly: true,
        description: 'Conecta tu cuenta Stripe y cobra señas, pagos parciales y entrega directamente desde la plataforma. El cliente paga online, tú recibes en tu IBAN.',
        bullets: [
          'Calendario de pagos: seña → pago parcial → final',
          'Stripe Checkout integrado: el cliente paga con tarjeta',
          'Comprobantes y facturas automáticos',
          'Cero comisiones de Genealogic (solo las de Stripe)',
        ],
        mockup: 'payments-timeline',
      },
    ],
    featurettes: [
      { icon: Inbox, title: 'Solicitudes desde tu web', description: 'Formulario configurable embebido en tu kennel pública.' },
      { icon: Users, title: 'CRM unificado', description: 'Contactos, leads y suscriptores en un único panel.' },
      { icon: Bell, title: 'Notificaciones', description: 'Email + push cuando llega o cambia algo crítico.' },
      { icon: Sparkles, title: 'Workflow personalizable', description: 'Cambia los estados del pipeline a tu manera.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'web',
    label: 'Web pública del kennel',
    tagline: 'Una web de criadero seria, sin pelearte con WordPress.',
    features: [
      {
        slug: 'pages',
        icon: Globe,
        problem: 'Tu web actual es de 2010 — o directamente no la tienes',
        title: 'Web profesional sin tocar código',
        description: 'Cada kennel Pro recibe una web pública completa: home con hero, sobre nosotros, perros, galería, blog, contacto. Editor visual, dominio propio y SEO incluido.',
        bullets: [
          'Plantilla minimal pulida — diseño tipo Cal.com',
          'Editor de secciones con preview en vivo',
          'Dominio personalizado (criadero.com → tu kennel)',
          'SEO técnico: sitemap, schema.org, Open Graph',
          'Móvil perfecto — no necesitas hacer nada',
        ],
        mockup: 'kennel-web',
        proOnly: true,
      },
      {
        slug: 'blog',
        icon: BookOpen,
        problem: 'No tienes tiempo de escribir y posicionar contenido',
        title: 'Blog integrado con SEO',
        description: 'Publica artículos sobre tu raza, tu filosofía, eventos. Cada post tiene su URL propia, meta tags y se indexa automáticamente en Google.',
        bullets: [
          'Editor MDX simple',
          'Imágenes con galería automática',
          'Categorías y tags',
          'Lectura estimada, fecha, autor',
        ],
        mockup: 'blog-list',
        proOnly: true,
      },
    ],
    featurettes: [
      { icon: MapPin, title: 'Ubicación en mapa', description: 'Embebido en la web sin coste extra.' },
      { icon: Star, title: 'Reseñas verificadas', description: 'Solo clientes con reserva pueden dejar reseña.' },
      { icon: Mail, title: 'Newsletter integrada', description: 'Suscriptores desde tu web → campañas con un click.' },
      { icon: Send, title: 'Formulario de contacto', description: 'Configurable, con anti-spam y rate-limit.' },
      { icon: Lock, title: 'Sin anuncios de terceros', description: 'Tu marca, sin ruido.' },
      { icon: Eye, title: 'Vista previa antes de publicar', description: 'Cambia, revisa, publica.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'genealogia',
    label: 'Genealogía y perros',
    tagline: 'Pedigree, perros, fotos, salud. Todo conectado.',
    features: [
      {
        slug: 'pedigree',
        icon: GitBranch,
        problem: 'Tu pedigree está en PDF, en papel o se ha perdido',
        title: 'Árbol genealógico interactivo',
        description: 'Hasta 10 generaciones visualizadas, navegables y exportables. Cálculo automático de coeficiente de consanguinidad (COI) con código de colores.',
        bullets: [
          'Vista horizontal o vertical, zoom in/out',
          'COI calculado con 10 generaciones — semáforo verde/ámbar/rojo',
          'Click en cualquier ancestro para abrir su perfil',
          'Exporta a PDF con tu marca',
          'Hermanos, descendientes, palmarés — todo enlazado',
        ],
        mockup: 'pedigree-tree',
      },
      {
        slug: 'catalogo',
        icon: Dog,
        problem: 'Las fotos de tus perros se pierden en Instagram',
        title: 'Catálogo de perros con su historia',
        description: 'Cada perro tiene su perfil completo: fotos ilimitadas, pedigree, palmarés, salud, ofertas en venta, copropiedades. Compartible con un link.',
        bullets: [
          'Galería con drag-and-drop para reordenar',
          'Estado: reproductor / cachorro disponible / criado',
          'Filtros por raza, sexo, edad, color',
          'URL pública compartible (Instagram, WhatsApp)',
        ],
        mockup: 'dogs-grid',
      },
      {
        slug: 'cruces',
        icon: Heart,
        problem: 'Planificar un cruce a ojo es jugar a la ruleta',
        title: 'Simulador de cruces',
        description: 'Selecciona macho y hembra y predice el COI de la camada, los colores probables, riesgos genéticos visibles. Antes de cruzar, lo sabes.',
        bullets: [
          'COI proyectado con 10 generaciones',
          'Predicción de color basada en genotipos visibles',
          'Detección de duplicados peligrosos en la ascendencia',
          'Compara varios cruces lado a lado',
        ],
        mockup: 'breeding-simulator',
        proOnly: true,
      },
    ],
    featurettes: [
      { icon: Upload, title: 'Importar genealogía', description: 'Pega una URL de Presadb, Ingrus, Dogsfiles, etc. y la importamos.' },
      { icon: ArrowRightLeft, title: 'Transferir propietario', description: 'En 1 click. Anonimiza al dueño anterior si quiere.' },
      { icon: Camera, title: 'Fotos ilimitadas', description: 'Sube todas las que quieras por perro. Sin coste extra.' },
      { icon: Stethoscope, title: 'Registros veterinarios', description: 'Vacunas, controles, displasia, pruebas DNA.' },
      { icon: Calendar, title: 'Calendario reproductivo', description: 'Ciclos de celo, gestaciones, camadas en un gantt.' },
      { icon: Sparkles, title: 'Cálculo automático COI', description: 'Cada perro lo muestra al abrirlo.' },
      { icon: Tag, title: 'Trazabilidad LOE', description: 'Inscripción oficial vinculada al perro.' },
      { icon: Shield, title: 'Pruebas de salud', description: 'OFA, PennHIP, DNA — link al certificado.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'comunicacion',
    label: 'Comunicación',
    tagline: 'Atiende mejor con menos esfuerzo.',
    features: [
      {
        slug: 'emailbot',
        icon: Mail,
        problem: 'Respondes las mismas preguntas 10 veces al día',
        title: 'Emailbot que responde solo',
        description: 'Conecta tu email del kennel y el bot responde las preguntas frecuentes con tu tono. Cuando detecta que necesita un humano, te lo escala.',
        proOnly: true,
        bullets: [
          'Aprende de tus FAQs y tu web',
          'Multilingüe: ES, EN, IT, FR, DE',
          'Escala a humano si no puede',
          'Respuesta en <1 minuto 24/7',
          'Tú apruebas cada respuesta antes de enviar (modo seguro)',
        ],
        mockup: 'bot-conversation',
      },
      {
        slug: 'newsletter',
        icon: Send,
        problem: 'No tienes forma de mantener a los interesados al día',
        title: 'Newsletter con un click',
        description: 'Construye una lista de suscriptores desde tu web y mándales novedades cuando hay camada, evento o noticia. Sin Mailchimp, sin coste extra.',
        proOnly: true,
        bullets: [
          'Composer drag-and-drop',
          'Plantillas: nueva camada, próximo evento, novedades',
          'Tasa de apertura y clicks',
          'GDPR-friendly: unsubscribe con un link',
        ],
        mockup: 'newsletter-composer',
      },
    ],
    featurettes: [
      { icon: Inbox, title: 'Hilos de email', description: 'Todo el histórico con cada cliente, en un único hilo.' },
      { icon: BookOpen, title: 'Biblioteca de conocimiento', description: 'Lo que escribes una vez, el bot lo reutiliza siempre.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'analitica',
    label: 'Analítica y datos',
    tagline: 'Decide con datos, no con intuición.',
    features: [
      {
        slug: 'stats',
        icon: BarChart3,
        problem: 'No sabes cuánta gente visita tu web ni de dónde',
        title: 'Estadísticas en tiempo real',
        proOnly: true,
        description: 'Page views, sesiones únicas, top referrers, países, dispositivos. Funnel desde visita hasta reserva. Saber qué funciona y qué no.',
        bullets: [
          'Visitas por día con tendencia',
          'Top referrers (Google, Instagram, etc.)',
          'Conversión: visita → solicitud → reserva',
          'Sin cookies — GDPR-friendly por defecto',
        ],
        mockup: 'stats-dashboard',
      },
    ],
    featurettes: [
      { icon: Search, title: 'Búsqueda interna tracked', description: 'Sabes qué buscan los visitantes en tu web.' },
      { icon: Eye, title: 'Heatmap básico', description: 'Páginas más vistas, profundidad de scroll.' },
    ],
  },
]
