/**
 * Catálogo de features para la página /features.
 *
 * Orden importa: lo primero que se ve abajo del hero define el
 * posicionamiento. Genealogic NO es "otro CRM para criadores" — es
 * la mayor plataforma internacional de pedigrees indexados (+250.000
 * perros públicos) que ADEMÁS trae herramientas profesionales para
 * gestionar tu criadero encima. Por eso: 1) plataforma (lo único que
 * la competencia no puede copiar en 6 meses), 2) genealogía/cría/salud
 * (el core profesional), 3) catálogo/web/pipeline/comunicación/analítica
 * (lo que cualquier SaaS de nicho ofrece, pero hecho bien).
 *
 * Estructura: categorías → features mayores (con mockup grande, copy
 * largo, bullets) + featurettes (cards pequeñas, sin mockup, solo
 * icono + título + descripción breve).
 *
 * Convención de slugs: kebab-case ASCII. Se usan como anchor id
 * (#pedigree) para deep-linking desde el sidebar y desde landings.
 */
import type { ElementType } from 'react'
import {
  KanbanSquare, Globe, GitBranch, Mail, Dog, BarChart3,
  FileText, ArrowRightLeft, Camera, Stethoscope, Calendar,
  Send, Search, Star, Inbox, Upload, Sparkles, Heart,
  CreditCard, BookOpen, Bell, Users, Tag, MapPin, Eye, Lock,
  Database, Globe2, History, Dna, FlaskConical, FileSignature,
  Languages, Image as ImageIcon, ShieldCheck, Zap, Filter,
  TrendingUp, FileBarChart, Network, Activity, FilePlus, Baby,
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
  // 1. PLATAFORMA — el moat. Lo primero porque es lo único único.
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'plataforma',
    label: 'Plataforma internacional',
    tagline: 'No estás creando una web de criadero más. Te subes a una red internacional de genealogías con cientos de razas y miles de criaderos.',
    features: [
      {
        slug: 'directorio',
        icon: Database,
        problem: 'Tu perro existe solo donde tú lo subas',
        title: 'Más de 250.000 perros indexados',
        description: 'Genealogic agrupa una base internacional de genealogías pública e indexable en Google. Cuando subes un perro, se conecta automáticamente a su genealogía existente — y aparece en búsquedas globales por raza, criadero, país y línea.',
        bullets: [
          'Catálogo público con +250.000 perros de cientos de razas',
          'Sitemap shardeado: cada perro tiene URL indexable en Google',
          'Padres, hermanos y descendientes auto-enlazados aunque sean de otros criadores',
          'Búsqueda con tolerancia a tildes/acentos sobre 250k filas en <50ms',
          'Hreflang y localización: ES, EN, IT — un perro, varias audiencias',
        ],
        mockup: 'public-directory',
      },
      {
        slug: 'importer',
        icon: Upload,
        problem: 'Migrar tu genealogía de una plataforma a otra es un infierno',
        title: 'Importador de genealogías con IA',
        description: 'Pega una URL de Presadb, Dogsfiles, Breedarchive, Working-dog, K9data, OFA… y nuestro importador con Claude Sonnet extrae el perro completo: nombre, raza, padres hasta N generaciones, fotos, palmarés, registros. En 30 segundos.',
        bullets: [
          'Soporta 10+ sitios fuente con scrapers dedicados',
          'PDFs de genealogía FCI/AKC parseados con OCR + LLM',
          'Self-verify: el bot comprueba su propia extracción contra la fuente',
          'De-duplicación inteligente — no se importan dos veces los mismos abuelos',
          'Trazabilidad: cada dato importado guarda su `imported_from`',
        ],
        mockup: 'pedigree-importer',
      },
      {
        slug: 'soberania',
        icon: ShieldCheck,
        problem: 'No quieres depender de Facebook ni de un PDF que se pierde',
        title: 'Datos tuyos, exportables, RGPD',
        description: 'Tus perros, genealogías, contratos y clientes son tuyos — los exportas en CSV/PDF cuando quieras. Hosting en EU, cumplimiento RGPD completo, sistema notice-and-action para reportar contenido sin tener que enviar emails.',
        bullets: [
          'Exporta cualquier perro con su genealogía a PDF con tu marca',
          'CSV de clientes, reservas y pagos en un click',
          'Servidores en EU (Supabase eu-west) — RGPD by default',
          'Notice-and-action UI para reportar contenido en 30s',
          'Histórico de cambios por perro: nunca pierdes la trazabilidad',
        ],
        mockup: 'audit-history',
      },
    ],
    featurettes: [
      { icon: Globe2, title: 'API pública', description: 'Endpoint REST para integrar tus perros con tu web externa o app móvil.' },
      { icon: Network, title: 'Conexión cross-kennel', description: 'Tu macho semental aparece como padre en perros de otros criaderos automáticamente.' },
      { icon: History, title: 'Histórico por perro', description: 'Quién subió qué foto, cuándo se transfirió, quién editó el peso. Auditoría completa.' },
      { icon: Lock, title: 'Perfiles privados', description: 'Tú decides qué perro es público y qué perro solo lo ves tú.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. GENEALOGÍA — el corazón del producto
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'genealogia',
    label: 'Genealogía',
    tagline: 'El árbol más completo, calculado, navegable y exportable que hayas visto.',
    features: [
      {
        slug: 'pedigree',
        icon: GitBranch,
        problem: 'Tu genealogía está en PDF, en papel o se ha perdido',
        title: 'Árbol genealógico interactivo',
        description: 'Hasta 10 generaciones visualizadas en horizontal o vertical. Cada ancestro es navegable, con su foto, palmarés y descendientes. Coeficiente de consanguinidad (COI) calculado en cliente con código de colores.',
        bullets: [
          'Vista horizontal o vertical · zoom in/out · pan con drag',
          'COI calculado con 10 generaciones — semáforo verde/ámbar/rojo',
          'Click en cualquier ancestro para abrir su perfil completo',
          'Detecta ancestros duplicados (Wright path coefficient)',
          'Versión móvil con panel COI a pantalla completa',
        ],
        mockup: 'pedigree-tree',
      },
      {
        slug: 'coi',
        icon: Activity,
        problem: 'Sabes que la consanguinidad es mala, pero no sabes cuánto tienen tus perros',
        title: 'COI explicado, no solo calculado',
        description: 'Coeficiente de consanguinidad (Wright) para cada perro, calculado con hasta 10 generaciones. No te damos solo el número: te enseñamos QUÉ ancestros lo causan, cuántas veces aparecen y cómo se compara con la media de tu raza. Decisiones de cría con base científica.',
        bullets: [
          'Cálculo Wright sobre 10 generaciones (no las 4-5 típicas de PDFs FCI)',
          'Lista de ancestros duplicados ordenados por contribución %',
          'Wright path: cada camino genealógico que repite a un ancestro',
          'Comparativa vs media de la raza en Genealogic (percentil)',
          'Semáforo verde/ámbar/rojo según umbrales recomendados por la raza',
          'Histórico: ve cómo evoluciona el COI medio de tu criadero año tras año',
        ],
        mockup: 'coi-detail',
      },
      {
        slug: 'pdf-pedigree',
        icon: FileText,
        problem: 'Generar una genealogía imprimible requiere Photoshop o pagar a un diseñador',
        title: 'PDF de genealogía con tu marca',
        description: 'Genera un PDF con la genealogía del perro de 4 generaciones y la marca de tu criadero. Listo para entregar al cliente con cada cachorro.',
        bullets: [
          'Árbol de 4 generaciones en una sola página A4',
          'Datos del perro, propietario y criadero',
          'En español',
          'Documento digital (no sustituye al pedigree oficial del club)',
        ],
        mockup: 'pedigree-pdf',
      },
    ],
    featurettes: [
      { icon: Upload, title: 'Importar genealogía', description: 'URL de Presadb, Dogsfiles, Working-dog, K9data → árbol completo en 30s.' },
      { icon: Sparkles, title: 'Cálculo automático COI', description: 'Cada perro lo muestra al abrirlo, con la lista de ancestros duplicados.' },
      { icon: TrendingUp, title: 'COI medio de tu criadero', description: 'Tendencia anual de cuánto sube o baja la consanguinidad media en tus camadas.' },
      { icon: Network, title: 'Hermanos y descendientes', description: 'Auto-detectados al subir padres. No tienes que enlazarlos manualmente.' },
      { icon: Tag, title: 'Trazabilidad LOE / FCI', description: 'Registro oficial vinculado al perro como campo dedicado.' },
      { icon: FileBarChart, title: 'Exportable a PDF', description: 'Cualquier rama de la genealogía, descargable con tu logo.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. CRÍA — diferenciador clave para criadores serios
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'cria',
    label: 'Cría y reproducción',
    tagline: 'Planifica cruces, controla ciclos, gestiona camadas — sin Excel.',
    features: [
      {
        slug: 'cruces',
        icon: Heart,
        problem: 'Planificar un cruce a ojo es jugar a la ruleta',
        title: 'Simulador de cruces',
        description: 'Selecciona macho y hembra (los tuyos o cualquiera del directorio público) y predice el COI de la camada, los colores probables y los riesgos genéticos visibles antes de decidir cubrir.',
        bullets: [
          'COI proyectado con 10 generaciones de ambos lados',
          'Predicción de color basada en genotipos visibles (locus E, B, K…)',
          'Detección de duplicados peligrosos en la ascendencia común',
          'Compara hasta 4 cruces lado a lado',
          'Guarda cruces planificados como "borradores"',
        ],
        mockup: 'breeding-simulator',
        proOnly: true,
      },
      {
        slug: 'reproduccion',
        icon: Calendar,
        problem: 'Pierdes el control de los celos, montas, gestaciones y partos',
        title: 'Calendario reproductivo',
        description: 'Para cada hembra: registro de celos, montas, fechas estimadas de parto, lactancia y destete. Un Gantt anual con todas tus hembras de cría a la vez para planificar la temporada.',
        bullets: [
          'Ciclo de celo con fases (proestro, estro, diestro) y predicción del siguiente',
          'Monta → confirmación gestación → fecha estimada parto (62 días)',
          'Eventos del parto: número de cachorros, peso, complicaciones',
          'Vista Gantt: todas las hembras del kennel a la vez',
          'Recordatorios push 7 días antes del parto previsto',
        ],
        mockup: 'reproduction-gantt',
        proOnly: true,
      },
      {
        slug: 'camadas',
        icon: Baby,
        problem: 'Una camada de 8 cachorros = 8 fichas a crear a mano, mismo cruce',
        title: 'Camadas con un click',
        description: 'Crea la camada con padres + fecha. Añade cachorros (heredan automáticamente raza, criadero, padres). Cada cachorro entra directamente al pipeline de reservas con su slot disponible.',
        bullets: [
          'Cachorros heredan raza, padres, criadero y afijo automáticamente',
          'Generador de nombre con afijo: "Bermudo de Tu Criadero"',
          'Estado: disponible / reservado / entregado',
          'Galería conjunta de la camada + fichas individuales',
          'Auto-suscribe a los solicitantes a la newsletter de la camada',
        ],
        mockup: 'litter-detail',
      },
    ],
    featurettes: [
      { icon: Filter, title: 'Filtrar candidatos por COI', description: 'Busca padre para tu hembra filtrando por COI máximo del cruce.' },
      { icon: Activity, title: 'Stud-book privado', description: 'Histórico de todas tus cubriciones, parido o no, año a año.' },
      { icon: FilePlus, title: 'Certificado de monta', description: 'PDF firmado con propietario de macho/hembra y fecha.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. SALUD — el motivo por el que un comprador paga 2.000€ vs 800€
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'salud',
    label: 'Salud y genética',
    tagline: 'Cartilla veterinaria digital + genotipos + certificados, todo conectado al perro.',
    features: [
      {
        slug: 'cartilla',
        icon: Stethoscope,
        problem: 'Cartillas en papel que se pierden o se mojan',
        title: 'Cartilla veterinaria digital',
        description: 'Vacunas, desparasitaciones, tratamientos, pruebas, cirugías — todo con fecha, veterinario, notas y archivo adjunto (PDF, imagen). Recordatorios automáticos para la siguiente cita.',
        bullets: [
          'Tipos: vacuna · desparasitación · tratamiento · prueba · cirugía',
          'Recordatorios push N días antes del próximo evento',
          'Sube el PDF del veterinario directamente al registro',
          'Visibilidad: privado o público (para certificar al comprador)',
          'Histórico exportable a PDF para llevar al vet',
        ],
        mockup: 'vet-records',
      },
      {
        slug: 'genetica',
        icon: Dna,
        problem: 'Tus pruebas DNA están en emails dispersos',
        title: 'Genotipos y pruebas DNA',
        description: 'Registra cada test genético (color, displasia, enfermedades raciales) con resultado, laboratorio y fecha. El simulador de cruces usa estos genotipos para predecir el color y los riesgos de la camada.',
        bullets: [
          'Locus E, B, K, A, D, S… con valores genotípicos (e/e, B/b, etc.)',
          'Pruebas raciales: DM, PLL, vWD, CL, glaucoma, etc.',
          'Subida del certificado del laboratorio',
          'Visible en la ficha pública con badges',
          'Compatible con Embark, Wisdom Panel, Optimal Selection',
        ],
        mockup: 'genotypes',
        proOnly: true,
      },
    ],
    featurettes: [
      { icon: FlaskConical, title: 'OFA · PennHIP · BVA', description: 'Displasia y patelas con link al certificado oficial.' },
      { icon: Bell, title: 'Recordatorios de vacunas', description: 'Push + email cuando se acerca la fecha de la siguiente.' },
      { icon: ShieldCheck, title: 'Certificados verificables', description: 'Enlace público al PDF del laboratorio desde el perfil del perro.' },
      { icon: Camera, title: 'Foto del veterinario', description: 'Anejo gráfico para test físicos (ej. inspección de mordida).' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 5. CATÁLOGO — fotos, palmarés, histórico
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'catalogo',
    label: 'Catálogo de perros',
    tagline: 'Cada perro con su perfil completo: fotos, palmarés, historia, propietarios.',
    features: [
      {
        slug: 'perfil-perro',
        icon: Dog,
        problem: 'Las fotos de tus perros se pierden en Instagram',
        title: 'Perfil completo del perro',
        description: 'Cada perro tiene su perfil: identidad (microchip, registro), genealogía, fotos ilimitadas, palmarés, salud, ofertas en venta, copropiedades. URL pública compartible — el link que mandas por WhatsApp tiene SEO.',
        bullets: [
          'Galería con drag-and-drop para reordenar',
          'Foto principal con upscale por IA (de 800px a 2400px nítida)',
          'Estado: reproductor · cachorro disponible · criado · retirado',
          'URL pública con slug del nombre — compartible y SEO-friendly',
          'Vista pública diferente para "visitante" vs "propietario logueado"',
        ],
        mockup: 'dogs-grid',
      },
      {
        slug: 'historico-perro',
        icon: History,
        problem: 'No sabes quién subió esa foto ni quién cambió el peso',
        title: 'Histórico de cambios por perro',
        description: 'Tab "Histórico" en cada ficha de edición: timeline cronológico de TODOS los cambios, con autor, fecha+hora y descripción legible. Ideal para confianza post-venta entre criador y comprador.',
        bullets: [
          'Triggers PostgreSQL que registran cada INSERT/UPDATE',
          'Eventos: creación, foto subida/borrada, transferencia, edición de peso',
          'Snapshot del nombre del autor (sobrevive a borrado de cuenta)',
          'Visible para criador y propietario actual',
          'Agrupado por día para no saturar visualmente',
        ],
        mockup: 'audit-history',
      },
    ],
    featurettes: [
      { icon: ArrowRightLeft, title: 'Transferir propietario', description: 'En 1 click. Anonimiza al dueño anterior si quiere.' },
      { icon: ImageIcon, title: 'Fotos ilimitadas', description: 'Sube todas las que quieras por perro. Sin coste extra.' },
      { icon: Sparkles, title: 'Upscale IA de fotos', description: 'Mejora la foto de Instagram a calidad print en 1 click.' },
      { icon: Tag, title: 'Palmarés y títulos', description: 'CAC, CACIB, BIS, BOB con juez, fecha y certificado.' },
      { icon: Lock, title: 'Privado o público', description: 'Cada perro tiene su switch independiente.' },
      { icon: Filter, title: 'Filtros y búsqueda', description: 'Por raza, sexo, edad, color, estado, en venta.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 6. PIPELINE — reservas, contratos, pagos
  // ─────────────────────────────────────────────────────────────────
  {
    slug: 'pipeline',
    label: 'Pipeline de reservas',
    tagline: 'Convierte solicitudes en clientes felices sin que se te escape ni una.',
    features: [
      {
        slug: 'reservas',
        icon: KanbanSquare,
        problem: 'Pierdes solicitudes entre WhatsApps, emails y notas en papel',
        title: 'Pipeline de reservas',
        description: 'Una tabla densa y ordenable con todas tus solicitudes activas. Tabs por estado, panel lateral con el detalle del cliente, doble pestaña Activas/Cerradas para no saturar cuando llevas años. Diseñado para criaderos con 50+ solicitudes al mes.',
        bullets: [
          'Tabla sortable: cliente · perro · estado · última actividad · valor',
          'Panel lateral con mensajes, contratos, pagos del cliente',
          'Tabs por estado: nueva · evaluando · seña · contrato · entrega',
          'Toggle Activas / Cerradas — el archivo no estorba',
          'Notificación push + email cuando llega una nueva',
          'Solicitudes desde tu web pública entran directamente',
        ],
        mockup: 'reservations-table',
      },
      {
        slug: 'contratos',
        icon: FileSignature,
        problem: 'Re-escribes el mismo contrato cada vez',
        title: 'Plantillas de contrato reutilizables',
        description: 'Guarda tus modelos de contrato (compraventa, copropiedad reproductiva, opción de retiro) y úsalos en cada reserva en un click. Variables auto-rellenadas con los datos del cliente y del perro.',
        bullets: [
          'Editor Markdown con vista previa en vivo',
          'Variables: {{clientName}}, {{dogName}}, {{breed}}, {{totalPrice}}, {{deliveryDate}}…',
          'Marca uno como "por defecto" — sale pre-seleccionado en cada reserva',
          'Firma electrónica básica con timestamp + IP del firmante',
          'PDF firmado guardado en el expediente del cliente',
        ],
        mockup: 'contract-editor',
      },
      {
        slug: 'pagos',
        icon: CreditCard,
        problem: 'Cobros por Bizum y transferencias sin trazabilidad',
        title: 'Pagos con Stripe Connect',
        proOnly: true,
        description: 'Conecta tu cuenta Stripe y cobra señas, pagos parciales y entrega directamente desde la plataforma. El cliente paga con tarjeta, tú recibes en tu IBAN. Cero comisiones por parte de Genealogic — solo las de Stripe.',
        bullets: [
          'Calendario de pagos: seña → parcial → final',
          'Stripe Checkout integrado: tarjeta, Apple Pay, Google Pay, Bizum',
          'Comprobantes y facturas automáticos',
          'Webhook idempotente — los pagos NUNCA se duplican aunque Stripe reintente',
          'Reembolsos desde el panel sin entrar a Stripe',
        ],
        mockup: 'payments-timeline',
      },
    ],
    featurettes: [
      { icon: Inbox, title: 'Formulario de solicitud', description: 'Embebido en tu kennel pública, configurable y con anti-spam.' },
      { icon: Users, title: 'CRM unificado', description: 'Contactos, leads y compradores en un único panel con tags.' },
      { icon: Bell, title: 'Notificaciones', description: 'Email + push (iOS) cuando llega o cambia algo crítico.' },
      { icon: FilePlus, title: 'Visitas registradas', description: 'Apunta visitas al kennel con fecha, contacto y notas.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 7. WEB — kennel public, blog, reseñas
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
        description: 'Cada kennel Pro recibe una web pública completa: home con hero, sobre nosotros, perros, camadas, blog, contacto. Editor visual, dominio propio y SEO incluido.',
        bullets: [
          'Plantilla minimal pulida — diseño tipo Cal.com / Linear',
          'Editor de secciones con preview en vivo',
          'Dominio personalizado (criadero.com → tu kennel en Genealogic)',
          'SEO técnico: sitemap, schema.org, Open Graph, hreflang',
          'Móvil perfecto — no tienes que hacer nada',
          'Tema personalizable: colores primarios, tipografía, hero image',
        ],
        mockup: 'kennel-web',
        proOnly: true,
      },
      {
        slug: 'blog',
        icon: BookOpen,
        problem: 'No tienes tiempo de escribir y posicionar contenido',
        title: 'Blog integrado con SEO',
        description: 'Publica artículos sobre tu raza, tu filosofía, eventos. Cada post tiene su URL propia, meta tags, schema.org Article y se indexa automáticamente en Google.',
        bullets: [
          'Editor MDX simple con previsualización',
          'Imágenes con galería automática y lazy-load',
          'Categorías, tags, autor, lectura estimada',
          'Schema.org Article + sitemap.xml + RSS',
          'Compartir en redes con OG tags optimizados',
        ],
        mockup: 'blog-list',
        proOnly: true,
      },
    ],
    featurettes: [
      { icon: MapPin, title: 'Ubicación en mapa', description: 'Embebido sin coste extra ni token de Google Maps.' },
      { icon: Star, title: 'Reseñas verificadas', description: 'Solo clientes con reserva pueden dejar reseña.' },
      { icon: Send, title: 'Formulario de contacto', description: 'Configurable, con anti-spam y rate-limit.' },
      { icon: Lock, title: 'Sin anuncios de terceros', description: 'Tu marca, sin ruido.' },
      { icon: Eye, title: 'Vista previa antes de publicar', description: 'Cambia, revisa, publica.' },
      { icon: Languages, title: 'Multi-idioma', description: 'ES, EN, IT, FR — hreflang configurado.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 8. COMUNICACIÓN — emailbot, newsletter
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
        description: 'Conecta tu email del kennel (Gmail/IMAP) y el bot responde las preguntas frecuentes con tu tono. Cuando detecta que necesita un humano, te lo escala. Tú apruebas cada respuesta antes de enviar (modo seguro).',
        proOnly: true,
        bullets: [
          'Aprende de tus FAQs, tu web y tu histórico de emails',
          'Multilingüe: ES, EN, IT, FR, DE',
          'Modo seguro: cada respuesta requiere tu OK antes de enviarse',
          'Escala a humano si no puede o si el cliente lo pide',
          'Suite de tests para validar respuestas antes de activar',
        ],
        mockup: 'bot-conversation',
      },
      {
        slug: 'newsletter',
        icon: Send,
        problem: 'No tienes forma de mantener a los interesados al día',
        title: 'Newsletter con un click',
        description: 'Construye una lista de suscriptores desde tu web y mándales novedades cuando hay camada, evento o noticia. Sin Mailchimp, sin coste extra, sin límite de suscriptores.',
        proOnly: true,
        bullets: [
          'Composer drag-and-drop',
          'Plantillas: nueva camada, próximo evento, novedades',
          'Tasa de apertura y clicks por campaña',
          'GDPR-friendly: unsubscribe con un link en cada email',
          'Auto-suscripción de solicitantes de una camada',
        ],
        mockup: 'newsletter-composer',
      },
    ],
    featurettes: [
      { icon: Inbox, title: 'Hilos de email', description: 'Todo el histórico con cada cliente en un único hilo.' },
      { icon: BookOpen, title: 'Biblioteca de conocimiento', description: 'Lo que escribes una vez, el bot lo reutiliza siempre.' },
      { icon: Zap, title: 'Respuesta en <1 min', description: 'El bot responde 24/7. Tú revisas cuando quieras.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // 9. ANALÍTICA — el por qué de las decisiones
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
        description: 'Page views, sesiones únicas, top referrers, países, dispositivos. Funnel desde visita hasta reserva. Sabes qué funciona y qué no — sin cookies, sin Google Analytics.',
        bullets: [
          'Visitas por día con tendencia 7/30/90 días',
          'Top referrers: Google, Instagram, otros criaderos',
          'Conversión: visita → solicitud → seña → reserva',
          'Sin cookies — GDPR-friendly por defecto',
          'Comparativa con período anterior',
        ],
        mockup: 'stats-dashboard',
      },
    ],
    featurettes: [
      { icon: TrendingUp, title: 'Funnel de conversión', description: 'Visita → ficha de perro → solicitud → seña → contrato → entrega.' },
      { icon: Search, title: 'Búsqueda interna tracked', description: 'Sabes qué buscan los visitantes en tu web pública.' },
      { icon: Eye, title: 'Heatmap básico', description: 'Páginas más vistas, profundidad de scroll, perros más clickados.' },
      { icon: FileBarChart, title: 'Exportable a CSV', description: 'Cruza los datos con tu Excel o Looker Studio.' },
    ],
  },
]
