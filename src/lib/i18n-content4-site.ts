// Fase 4 · Wave 4 — Diccionario ES→EN de las WEBS PÚBLICAS de criadero bajo
// dominio propio (lo que ve un VISITANTE en iremacurto.com y similares).
//
// Cubre los strings envueltos con t('...') / useT() en:
//   · src/components/site/**          (modal de contacto, nav móvil, galería,
//                                      newsletter, botón flotante, y todas las
//                                      secciones del web builder)
//   · src/app/c/**                    (home, páginas internas, blog del criadero)
//   · src/app/web-preview/**          (sin strings de visitante: solo chrome
//                                      interno del editor del dueño)
//
// Las CLAVES son el español EXACTO que aparece en cada t('...') (mismas tildes,
// mayúsculas, puntuación y elipsis …). Duplicados con otros content dicts
// (i18n.ts base, content/2/3, content4-*) son inofensivos: getTranslator
// cascadea y resuelve el primero que encuentra. 'es' es la clave base y no
// necesita entradas.
//
// GLOSARIO ESTRICTO: genealogy (NUNCA "pedigree" en UI), kennel, breeder,
// owner, litter, breed, sire (Padre), dam (Madre), puppy (cachorro), for sale
// (en venta), available (disponible), reserved (reservado), contact, about,
// reviews, waiting list, our dogs.

export const content4Site: Record<string, Record<string, string>> = {
  en: {
    // ─── Modal de contacto / formularios (contact-dialog, contact-form-inner) ───
    'Cerrar': 'Close',
    'Contacto directo': 'Direct contact',
    '¡Recibido!': 'Received!',
    'Enviar': 'Send',
    'Enviar mensaje': 'Send message',
    'Enviando…': 'Sending…',
    '— Seleccionar —': '— Select —',
    'No se pudo enviar': 'Could not send',
    'Error de red': 'Network error',
    'Cargando criadero…': 'Loading kennel…',
    'Cargando formulario…': 'Loading form…',
    'Tu mensaje ha llegado al criador. Te responderá personalmente lo antes posible.':
      'Your message has reached the breeder. They\'ll reply to you personally as soon as possible.',

    // ─── Botón flotante de solicitudes (floating-contact-button) ───
    'Enviar solicitud': 'Send request',
    'Abrir formulario de solicitud': 'Open request form',
    'Solicitudes': 'Requests',

    // ─── Nav móvil (mobile-nav) ───
    'Abrir menú': 'Open menu',

    // ─── Newsletter (newsletter-form) ───
    'Suscribirme': 'Subscribe',
    'Error': 'Error',
    '¡Suscrito! Te avisaremos en próximas camadas.':
      'Subscribed! We\'ll let you know about upcoming litters.',

    // ─── Galería / lightbox (gallery-grid-client) ───
    'Anterior': 'Previous',
    'Siguiente': 'Next',

    // ─── Home (home.tsx) ───
    'La casa': 'The kennel',
    'Disponibles': 'Available',
    'Disponible': 'Available',
    'Datos en vivo': 'Live data',
    'Ver todos': 'View all',
    'Macho': 'Male',
    'Hembra': 'Female',
    'Sin cachorros disponibles ahora mismo, pero tenemos':
      'No puppies available right now, but we have',
    'camada': 'litter',
    'camadas': 'litters',
    'en camino.': 'on the way.',

    // ─── Nuestros perros (perros.tsx) ───
    'Sin perros en esta categoría ahora mismo.': 'No dogs in this category right now.',
    'No hay cachorros disponibles ahora mismo. Apúntate a la lista de espera para la próxima camada.':
      'No puppies available right now. Join the waiting list for the next litter.',
    'Cachorros': 'Puppies',
    'Sementales': 'Studs',
    'Hembras de cría': 'Breeding females',
    'Criados por nosotros': 'Bred by us',
    'No hay cachorros disponibles ahora mismo. Apúntate a la lista de espera.':
      'No puppies available right now. Join the waiting list.',
    'Aún no hay sementales publicados.': 'No studs published yet.',
    'Aún no hay hembras de cría publicadas.': 'No breeding females published yet.',
    'Aún no hay perros criados publicados.': 'No bred dogs published yet.',
    '¿Te interesa una próxima camada?': 'Interested in an upcoming litter?',
    'Vendemos por reservas, no por disponibilidad. Apúntate a la lista de espera y te avisamos cuando haya cachorros.':
      'We sell by reservation, not by availability. Join the waiting list and we\'ll let you know when puppies are available.',
    'Apuntarme a la lista de espera': 'Join the waiting list',

    // ─── Blog (blog.tsx) ───
    'Aún no hay artículos publicados. Vuelve pronto.':
      'No articles published yet. Check back soon.',

    // ─── Contacto (contacto.tsx) ───
    'Cuéntanos': 'Tell us',
    'Contacto': 'Contact',
    'Mapa': 'Map',

    // ─── Instalaciones / galería (instalaciones.tsx) ───
    'Galería próximamente — estamos preparando las fotos.':
      'Gallery coming soon — we\'re preparing the photos.',
    'Comunidad': 'Community',

    // ─── Landing extras (landing.tsx) ───
    'Preguntas': 'Questions',
    'Últimos artículos': 'Latest articles',
    'Ver blog': 'View blog',
    'Hablar con el criador': 'Talk to the breeder',

    // ─── Sobre la raza (raza.tsx) ───
    'Nuestra raza': 'Our breed',
    'Sobre la raza': 'About the breed',
    'Temperamento': 'Temperament',
    'Colores aceptados': 'Accepted colors',
    'Características': 'Traits',

    // ─── Home pública del criadero (app/c/[slug]/page.tsx) ───
    'No encontrado': 'Not found',
    'La web pública aún no se ha publicado.': 'The public website hasn\'t been published yet.',
    'Ver perfil en Genealogic': 'View profile on Genealogic',
    'Ver en Genealogic': 'View on Genealogic',

    // ─── Layout público (app/c/[slug]/layout.tsx) ───
    'Todos los derechos reservados.': 'All rights reserved.',
    'Sitio creado con': 'Site built with',

    // ─── Página interna (app/c/[slug]/[page]/page.tsx) ───
    'Página no encontrada': 'Page not found',

    // ─── Post del blog (app/c/[slug]/blog/[postSlug]/page.tsx) ───
    'Este post no tiene contenido todavía.': 'This post has no content yet.',
    'Volver al blog': 'Back to the blog',
    'min de lectura': 'min read',
    'Sigue leyendo': 'Keep reading',
  },
}
