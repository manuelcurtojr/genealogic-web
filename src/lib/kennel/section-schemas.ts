/**
 * Schemas declarativos para los formularios de secciones.
 *
 * Cada `SectionSchema` declara qué campos editables tiene una sección y
 * cómo deben renderizarse en el panel derecho del editor `/admin/web`.
 *
 * Si una sección no tiene schema declarado, el editor cae a JSON crudo.
 */

export type FieldDef =
  | { kind: 'text'; key: string; label: string; placeholder?: string; description?: string }
  | { kind: 'textarea'; key: string; label: string; rows?: number; placeholder?: string; description?: string }
  | { kind: 'number'; key: string; label: string; min?: number; max?: number; description?: string }
  | {
      kind: 'select';
      key: string;
      label: string;
      options: { value: string; label: string }[];
      description?: string;
    }
  | { kind: 'cta'; key: string; label: string; description?: string }
  | { kind: 'image'; key: string; label: string; placeholder?: string; description?: string }
  | { kind: 'tags'; key: string; label: string; placeholder?: string; description?: string }
  | {
      kind: 'list';
      key: string;
      label: string;
      itemLabelKey?: string; // Si lo defines, el header del item usa ese campo del item
      itemFields: FieldDef[];
      addLabel?: string;
      description?: string;
    }
  | {
      kind: 'group';
      key: string;
      label: string;
      fields: FieldDef[];
      description?: string;
    };

export type SectionSchema = {
  type: string;
  fields: FieldDef[];
};

const heroLikeFields: FieldDef[] = [
  { kind: 'text', key: 'eyebrow', label: 'Eyebrow (línea pequeña arriba)', placeholder: 'Ej. Tenerife · Desde 1975' },
  { kind: 'text', key: 'title', label: 'Título grande', placeholder: 'Título principal' },
  { kind: 'textarea', key: 'subtitle', label: 'Subtítulo', rows: 3, placeholder: 'Una o dos frases que acompañan al título' },
];

export const SECTION_SCHEMAS: SectionSchema[] = [
  // ── Two-column block ──────────────────────────────────────────────
  {
    type: 'two-column-block',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Eyebrow' },
      { kind: 'text', key: 'title', label: 'Título' },
      { kind: 'textarea', key: 'body', label: 'Cuerpo', rows: 5 },
      { kind: 'cta', key: 'cta', label: 'Botón (opcional)' },
      {
        kind: 'group',
        key: 'image',
        label: 'Imagen',
        fields: [
          { kind: 'image', key: 'url', label: 'Imagen' },
          { kind: 'text', key: 'alt', label: 'Texto alternativo' },
        ],
      },
      {
        kind: 'select',
        key: 'imagePosition',
        label: 'Posición de la foto',
        options: [
          { value: 'left', label: 'Foto a la izquierda · texto a la derecha' },
          { value: 'right', label: 'Foto a la derecha · texto a la izquierda' },
        ],
      },
      {
        kind: 'select',
        key: 'background',
        label: 'Fondo',
        options: [
          { value: 'dark', label: 'Oscuro' },
          { value: 'darker', label: 'Negro puro' },
        ],
      },
    ],
  },

  // ── Reviews ───────────────────────────────────────────────────────
  {
    type: 'reviews',
    fields: [
      { kind: 'text', key: 'title', label: 'Título', placeholder: 'Lo que dicen nuestras familias' },
      { kind: 'textarea', key: 'subtitle', label: 'Subtítulo (opcional)', rows: 2 },
      {
        kind: 'text',
        key: 'google_maps_url',
        label: 'Enlace a tu ficha de Google Maps (opcional)',
        placeholder: 'https://maps.app.goo.gl/… o https://www.google.com/maps/place/…',
        description:
          'Si lo pegas, aparece un botón "Ver todas las reseñas en Google" al final de la sección. (El integrador automático con Google Places API llegará más adelante.)',
      },
      {
        kind: 'select',
        key: 'showAverage',
        label: 'Mostrar puntuación media',
        options: [
          { value: 'true', label: 'Sí' },
          { value: 'false', label: 'No' },
        ],
      },
      {
        kind: 'list',
        key: 'reviews',
        label: 'Reseñas',
        addLabel: 'Añadir reseña',
        itemLabelKey: 'author',
        itemFields: [
          { kind: 'text', key: 'author', label: 'Nombre del autor' },
          { kind: 'number', key: 'rating', label: 'Estrellas (1-5)', min: 1, max: 5 },
          { kind: 'textarea', key: 'text', label: 'Texto de la reseña', rows: 4 },
          { kind: 'text', key: 'date', label: 'Fecha (texto libre)' },
          {
            kind: 'select',
            key: 'source',
            label: 'Fuente',
            options: [
              { value: 'manual', label: 'Manual' },
              { value: 'google', label: 'Google' },
              { value: 'facebook', label: 'Facebook' },
            ],
          },
          { kind: 'image', key: 'avatar_url', label: 'Foto del autor (opcional)' },
        ],
      },
    ],
  },

  // ── Video embed ───────────────────────────────────────────────────
  {
    type: 'video-embed',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Eyebrow (opcional)' },
      { kind: 'text', key: 'title', label: 'Título (opcional)' },
      {
        kind: 'text',
        key: 'url',
        label: 'URL del vídeo',
        placeholder: 'https://www.youtube.com/watch?v=… o https://vimeo.com/…',
      },
      { kind: 'text', key: 'caption', label: 'Pie de vídeo (opcional)' },
      {
        kind: 'select',
        key: 'aspectRatio',
        label: 'Proporción',
        options: [
          { value: '16:9', label: '16:9 (horizontal)' },
          { value: '9:16', label: '9:16 (vertical / móvil)' },
          { value: '1:1', label: '1:1 (cuadrado)' },
        ],
      },
    ],
  },

  // ── Press logos ───────────────────────────────────────────────────
  {
    type: 'press-logos',
    fields: [
      { kind: 'text', key: 'title', label: 'Título', placeholder: 'Hemos aparecido en' },
      {
        kind: 'list',
        key: 'items',
        label: 'Medios',
        addLabel: 'Añadir medio',
        itemLabelKey: 'name',
        itemFields: [
          { kind: 'text', key: 'name', label: 'Nombre del medio' },
          { kind: 'image', key: 'logo_url', label: 'Logo (opcional)' },
          { kind: 'text', key: 'link_url', label: 'Link al artículo/programa (opcional)' },
          { kind: 'text', key: 'year', label: 'Año (opcional)' },
        ],
      },
    ],
  },

  // ── Kennel stats ──────────────────────────────────────────────────
  {
    type: 'kennel-stats',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Eyebrow' },
      { kind: 'text', key: 'title', label: 'Título' },
      {
        kind: 'list',
        key: 'stats',
        label: 'Stats',
        addLabel: 'Añadir stat',
        itemLabelKey: 'label',
        itemFields: [
          { kind: 'text', key: 'value', label: 'Valor', placeholder: '50, 300, 12…' },
          { kind: 'text', key: 'suffix', label: 'Sufijo (opcional)', placeholder: '+, %…' },
          { kind: 'text', key: 'label', label: 'Etiqueta', placeholder: 'Años criando' },
        ],
      },
    ],
  },

  // ── Process steps ─────────────────────────────────────────────────
  {
    type: 'process-steps',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Eyebrow' },
      { kind: 'text', key: 'title', label: 'Título' },
      {
        kind: 'list',
        key: 'steps',
        label: 'Pasos',
        addLabel: 'Añadir paso',
        itemLabelKey: 'title',
        itemFields: [
          { kind: 'text', key: 'title', label: 'Título del paso' },
          { kind: 'textarea', key: 'body', label: 'Descripción', rows: 3 },
        ],
      },
    ],
  },

  // ── FAQ ───────────────────────────────────────────────────────────
  {
    type: 'faq',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Eyebrow' },
      { kind: 'text', key: 'title', label: 'Título' },
      {
        kind: 'list',
        key: 'items',
        label: 'Preguntas',
        addLabel: 'Añadir pregunta',
        itemLabelKey: 'q',
        itemFields: [
          { kind: 'text', key: 'q', label: 'Pregunta' },
          { kind: 'textarea', key: 'a', label: 'Respuesta', rows: 5 },
        ],
      },
    ],
  },

  // ── Latest posts ──────────────────────────────────────────────────
  {
    type: 'latest-posts',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Eyebrow', placeholder: 'Blog' },
      { kind: 'text', key: 'title', label: 'Título', placeholder: 'Últimas publicaciones' },
      { kind: 'number', key: 'limit', label: 'Posts a mostrar', min: 1, max: 6 },
    ],
  },

  // ── Chat promo ────────────────────────────────────────────────────
  {
    type: 'chat-promo',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Eyebrow' },
      { kind: 'text', key: 'title', label: 'Título', placeholder: '¿Tienes dudas?' },
      { kind: 'textarea', key: 'body', label: 'Cuerpo', rows: 3 },
      { kind: 'text', key: 'ctaLabel', label: 'Texto del botón', placeholder: 'Abrir chat' },
    ],
  },

  // ── Hero ──────────────────────────────────────────────────────────
  {
    type: 'hero',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Eyebrow', placeholder: 'Tenerife · Desde 1975' },
      { kind: 'text', key: 'tagline', label: 'Tagline (parte 1)', placeholder: 'Presa Canario' },
      { kind: 'text', key: 'tagline_emphasis', label: 'Tagline (parte 2 en cursiva)', placeholder: 'desde 1975' },
      { kind: 'textarea', key: 'subtitle', label: 'Subtítulo', rows: 3 },
      {
        kind: 'list',
        key: 'ctas',
        label: 'Botones',
        addLabel: 'Añadir botón',
        itemLabelKey: 'label',
        itemFields: [
          { kind: 'text', key: 'label', label: 'Texto del botón' },
          { kind: 'text', key: 'href', label: 'Enlace', placeholder: '/raza, #chat, https://…' },
          {
            kind: 'select',
            key: 'variant',
            label: 'Estilo',
            options: [
              { value: 'primary', label: 'Primary (sólido blanco)' },
              { value: 'outline', label: 'Outline (borde)' },
              { value: 'ghost', label: 'Ghost (sin borde)' },
            ],
          },
        ],
      },
      {
        kind: 'text',
        key: 'bg_video_url',
        label: 'Fondo · vídeo (YouTube o MP4)',
        placeholder: 'https://www.youtube.com/watch?v=… o https://…/foo.mp4',
        description:
          'Si lo rellenas, el hero usa este vídeo como fondo (autoplay, mute, loop). Tiene prioridad sobre la imagen y el gradiente por defecto.',
      },
      {
        kind: 'image',
        key: 'bg_image_url',
        label: 'Fondo · imagen (alternativa al vídeo o poster mientras carga)',
      },
      {
        kind: 'number',
        key: 'bg_overlay_opacity',
        label: 'Opacidad del velo negro (0–1)',
        min: 0,
        max: 1,
        description: '0 = sin velo, 1 = totalmente opaco. Recomendado: 0.4–0.7 para que el texto sea legible sobre vídeo/foto.',
      },
    ],
  },

  // ── Page header / story-hero / breed-hero / facilities-hero / blog-hero
  { type: 'page-header', fields: heroLikeFields },
  { type: 'story-hero', fields: heroLikeFields },
  { type: 'breed-hero', fields: heroLikeFields },
  { type: 'blog-hero', fields: heroLikeFields },
  {
    type: 'facilities-hero',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Eyebrow' },
      { kind: 'text', key: 'title', label: 'Título' },
      { kind: 'textarea', key: 'body', label: 'Cuerpo', rows: 4 },
      { kind: 'image', key: 'bg_image_url', label: 'Imagen de fondo (opcional)' },
      {
        kind: 'number',
        key: 'bg_overlay_opacity',
        label: 'Opacidad overlay (0–1)',
        min: 0,
        max: 1,
      },
    ],
  },

  // ── Three pillars (home) y breed-temperament (raza)
  {
    type: 'three-pillars',
    fields: [
      {
        kind: 'list',
        key: 'pillars',
        label: 'Pilares',
        addLabel: 'Añadir pilar',
        itemLabelKey: 'title',
        itemFields: [
          { kind: 'text', key: 'title', label: 'Título' },
          { kind: 'textarea', key: 'body', label: 'Cuerpo', rows: 4 },
          { kind: 'cta', key: 'cta', label: 'Enlace (opcional)' },
        ],
      },
    ],
  },
  {
    type: 'breed-temperament',
    fields: [
      {
        kind: 'list',
        key: 'pillars',
        label: 'Rasgos',
        addLabel: 'Añadir rasgo',
        itemLabelKey: 'title',
        itemFields: [
          { kind: 'text', key: 'title', label: 'Título' },
          { kind: 'textarea', key: 'body', label: 'Cuerpo', rows: 4 },
        ],
      },
    ],
  },

  // ── Trust strip / waitlist / visit / cta banner
  {
    type: 'trust-strip',
    fields: [
      { kind: 'text', key: 'headline', label: 'Titular' },
      { kind: 'textarea', key: 'body', label: 'Subtítulo', rows: 3 },
    ],
  },
  {
    type: 'waitlist-cta',
    fields: [
      { kind: 'text', key: 'headline', label: 'Titular' },
      { kind: 'textarea', key: 'body', label: 'Cuerpo', rows: 3 },
      { kind: 'cta', key: 'cta', label: 'Botón' },
    ],
  },
  {
    type: 'visit-cta',
    fields: [
      { kind: 'text', key: 'headline', label: 'Titular' },
      { kind: 'textarea', key: 'body', label: 'Cuerpo', rows: 3 },
      { kind: 'cta', key: 'cta', label: 'Botón' },
    ],
  },
  {
    type: 'cta-banner',
    fields: [
      { kind: 'text', key: 'headline', label: 'Titular' },
      { kind: 'textarea', key: 'body', label: 'Cuerpo', rows: 3 },
      { kind: 'cta', key: 'cta', label: 'Botón' },
    ],
  },

  // ── Newsletter
  {
    type: 'newsletter',
    fields: [
      { kind: 'text', key: 'headline', label: 'Titular' },
      { kind: 'textarea', key: 'body', label: 'Subtítulo', rows: 3 },
      { kind: 'text', key: 'ctaLabel', label: 'Texto del botón', placeholder: 'Suscribirse' },
      { kind: 'text', key: 'placeholderEmail', label: 'Placeholder del email', placeholder: 'tu@email.com' },
    ],
  },

  // ── Timeline (historia)
  {
    type: 'timeline',
    fields: [
      {
        kind: 'list',
        key: 'milestones',
        label: 'Hitos',
        addLabel: 'Añadir hito',
        itemLabelKey: 'year',
        itemFields: [
          { kind: 'text', key: 'year', label: 'Año o periodo', placeholder: '1975, 1980 – 2000…' },
          { kind: 'text', key: 'title', label: 'Título del hito' },
          { kind: 'textarea', key: 'body', label: 'Descripción', rows: 5 },
        ],
      },
    ],
  },

  // ── Team
  {
    type: 'team',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Eyebrow' },
      { kind: 'text', key: 'title', label: 'Título de la sección' },
      {
        kind: 'list',
        key: 'members',
        label: 'Miembros del equipo',
        addLabel: 'Añadir miembro',
        itemLabelKey: 'name',
        itemFields: [
          { kind: 'text', key: 'name', label: 'Nombre' },
          { kind: 'text', key: 'role', label: 'Rol' },
          { kind: 'textarea', key: 'bio', label: 'Biografía', rows: 6 },
          { kind: 'image', key: 'photo', label: 'Foto (opcional)' },
        ],
      },
    ],
  },

  // ── Services grid
  {
    type: 'services-grid',
    fields: [
      {
        kind: 'list',
        key: 'services',
        label: 'Servicios',
        addLabel: 'Añadir servicio',
        itemLabelKey: 'title',
        itemFields: [
          {
            kind: 'select',
            key: 'icon',
            label: 'Icono',
            options: [
              { value: '', label: 'Ninguno' },
              { value: 'horse', label: 'Caballo' },
              { value: 'book', label: 'Libro' },
              { value: 'advice', label: 'Asesoría' },
            ],
          },
          { kind: 'text', key: 'title', label: 'Título del servicio' },
          { kind: 'textarea', key: 'body', label: 'Descripción', rows: 4 },
          { kind: 'cta', key: 'cta', label: 'Botón (opcional)' },
        ],
      },
    ],
  },

  // ── Breed summary / colors / traits
  {
    type: 'breed-summary',
    fields: [
      {
        kind: 'list',
        key: 'stats',
        label: 'Stats (3 recomendado)',
        addLabel: 'Añadir stat',
        itemLabelKey: 'label',
        itemFields: [
          { kind: 'text', key: 'label', label: 'Etiqueta', placeholder: 'Altura, Peso, Vida…' },
          { kind: 'text', key: 'value', label: 'Valor', placeholder: '60–65, 45–58, 12–14…' },
          { kind: 'text', key: 'unit', label: 'Unidad', placeholder: 'cm, kg, años…' },
        ],
      },
    ],
  },
  {
    type: 'breed-colors',
    fields: [
      { kind: 'text', key: 'title', label: 'Título', placeholder: 'Capas reconocidas' },
      {
        kind: 'list',
        key: 'colors',
        label: 'Capas',
        addLabel: 'Añadir capa',
        itemLabelKey: 'name',
        itemFields: [
          { kind: 'text', key: 'name', label: 'Nombre', placeholder: 'Negro, Bardino oscuro…' },
          { kind: 'image', key: 'image_url', label: 'Foto (cuadrada, opcional)' },
          { kind: 'text', key: 'description', label: 'Descripción (opcional)' },
        ],
      },
    ],
  },
  {
    type: 'breed-traits',
    fields: [
      { kind: 'text', key: 'title', label: 'Título', placeholder: 'Estadísticas' },
      {
        kind: 'list',
        key: 'traits',
        label: 'Rasgos',
        addLabel: 'Añadir rasgo',
        itemLabelKey: 'label',
        itemFields: [
          { kind: 'text', key: 'label', label: 'Rasgo', placeholder: 'Afecto con la familia' },
          { kind: 'text', key: 'level', label: 'Nivel descriptivo', placeholder: 'El máximo, Mucho, Depende…' },
          { kind: 'number', key: 'pct', label: 'Porcentaje', min: 0, max: 100 },
        ],
      },
    ],
  },

  // ── Facility features
  {
    type: 'facility-features',
    fields: [
      {
        kind: 'list',
        key: 'features',
        label: 'Características',
        addLabel: 'Añadir',
        itemLabelKey: 'label',
        itemFields: [
          { kind: 'text', key: 'label', label: 'Etiqueta', placeholder: 'Superficie, Parideras…' },
          { kind: 'text', key: 'value', label: 'Valor', placeholder: '17.000 m²…' },
          { kind: 'text', key: 'icon', label: 'Icono (opcional)' },
        ],
      },
    ],
  },

  // ── Contact
  {
    type: 'contact-form',
    fields: [
      { kind: 'text', key: 'headline', label: 'Titular' },
      { kind: 'tags', key: 'subjectOptions', label: 'Opciones del campo "Tema"' },
    ],
  },
  {
    type: 'contact-info',
    fields: [
      { kind: 'text', key: 'address', label: 'Dirección' },
      { kind: 'text', key: 'phone', label: 'Teléfono' },
      { kind: 'text', key: 'email', label: 'Email' },
      { kind: 'text', key: 'hours', label: 'Horario' },
    ],
  },
  {
    type: 'map-embed',
    fields: [{ kind: 'text', key: 'address', label: 'Dirección a mostrar' }],
  },

  // ── Live data sections (poco editables)
  {
    type: 'available-puppies-strip',
    fields: [
      { kind: 'number', key: 'limit', label: 'Cuántos ejemplares mostrar', min: 1, max: 8 },
      { kind: 'text', key: 'ctaLabel', label: 'Texto del botón' },
      {
        kind: 'tags',
        key: 'breeds',
        label: 'Filtrar por raza (opcional)',
        description:
          'Lista de razas a mostrar (case-insensitive). Vacío = todas. Útil para criadores con varias razas que solo quieren mostrar una en este bloque.',
      },
    ],
  },
  {
    type: 'available-puppies-grid',
    fields: [
      {
        kind: 'select',
        key: 'layout',
        label: 'Layout',
        options: [
          { value: 'grid', label: 'Grid' },
          { value: 'list', label: 'Lista' },
        ],
      },
    ],
  },
  {
    type: 'breeding-dogs-grid',
    fields: [
      {
        kind: 'select',
        key: 'filterBy',
        label: 'Filtrar por',
        options: [
          { value: 'all', label: 'Todos' },
          { value: 'males', label: 'Solo machos' },
          { value: 'females', label: 'Solo hembras' },
        ],
      },
    ],
  },
  {
    type: 'dogs-tabs',
    fields: [
      {
        kind: 'tags',
        key: 'tabs',
        label: 'Pestañas activas (en orden)',
        description: 'Valores válidos: reproductores · en-venta · camadas · producidos',
      },
      {
        kind: 'select',
        key: 'defaultTab',
        label: 'Pestaña por defecto',
        options: [
          { value: 'reproductores', label: 'Reproductores' },
          { value: 'en-venta', label: 'En venta' },
          { value: 'camadas', label: 'Camadas' },
          { value: 'producidos', label: 'Producidos por nosotros' },
        ],
      },
      {
        kind: 'tags',
        key: 'breeds',
        label: 'Razas a mostrar',
        placeholder: 'Ej. Presa Canario',
        description:
          'Solo se muestran perros y camadas de estas razas. Si lo dejas vacío, salen todas las razas que tengas en Genealogic. Escribe el nombre exacto tal como aparece allí.',
      },
    ],
  },
  {
    type: 'featured-post',
    fields: [
      {
        kind: 'select',
        key: 'mode',
        label: 'Modo',
        options: [
          { value: 'latest', label: 'Último publicado' },
          { value: 'pinned', label: 'Fijado (slug abajo)' },
        ],
      },
      { kind: 'text', key: 'pinnedSlug', label: 'Slug del post fijado' },
    ],
  },
  {
    type: 'posts-grid',
    fields: [
      { kind: 'number', key: 'pageSize', label: 'Posts por página', min: 3, max: 30 },
    ],
  },

  // ── Gallery
  {
    type: 'gallery-grid',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'Eyebrow (opcional)', placeholder: 'Clientes, Entregas…' },
      { kind: 'text', key: 'title', label: 'Título (opcional)', placeholder: 'Familias felices' },
      { kind: 'textarea', key: 'subtitle', label: 'Subtítulo (opcional)', rows: 2 },
      { kind: 'cta', key: 'cta', label: 'Botón debajo del grid (opcional)' },
      {
        kind: 'select',
        key: 'columns',
        label: 'Columnas',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
      },
      {
        kind: 'list',
        key: 'images',
        label: 'Imágenes',
        addLabel: 'Añadir imagen',
        itemLabelKey: 'alt',
        itemFields: [
          { kind: 'image', key: 'url', label: 'Imagen' },
          { kind: 'text', key: 'alt', label: 'Texto alternativo' },
        ],
      },
    ],
  },
];

export function getSectionSchema(type: string): SectionSchema | undefined {
  return SECTION_SCHEMAS.find((s) => s.type === type);
}
