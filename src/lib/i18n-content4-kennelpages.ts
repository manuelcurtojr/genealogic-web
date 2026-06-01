// Fase 4 · Wave 2 — Diccionario ES→EN de las PÁGINAS del CRIADERO y del
// WEB-BUILDER del dashboard.
//
// Cubre los strings envueltos con t('...') en:
//   · (dashboard)/kennel/**          (config, edit, new, api, pagos, contenido/*)
//   · (dashboard)/kennels/**         (directorio + web pública del criadero Pro)
//   · (dashboard)/web/**             (site builder: páginas, general, editor)
//
// Las claves son el español EXACTO pasado a t(). Duplicados con otros content
// dicts (i18n.ts base, content/2/3, content4-*) son inofensivos: getTranslator
// cascadea. 'es' no necesita entradas (es la clave base).
//
// GLOSARIO: genealogy (NUNCA pedigree), kennel, breeder, owner, litter, breed,
// reservation, public website, domain, affix, waiting list.

export const content4KennelPages: Record<string, Record<string, string>> = {
  en: {
    // ─── kennel/new ───
    'Crear criadero': 'Create kennel',
    'No autenticado': 'Not authenticated',
    'Plan': 'Plan',
    'elegido': 'chosen',
    'Crea primero tu afijo. En el siguiente paso activarás': 'Create your affix first. In the next step you\'ll activate',
    'Nombre del criadero *': 'Kennel name *',
    'Ej: Irema Curtó': 'e.g. Irema Curtó',
    'Continuar con': 'Continue with',
    'Podrás completar logo, raza y demás detalles después.': 'You can add logo, breed and other details later.',

    // ─── kennel/edit ───
    'Editar criadero': 'Edit kennel',
    'Información basica': 'Basic information',
    'Descripcion': 'Description',
    'Describe tu criadero...': 'Describe your kennel...',
    'Fecha de fundacion': 'Foundation date',
    'Sitio web': 'Website',
    'Redes sociales': 'Social media',
    'Activar WhatsApp': 'Enable WhatsApp',
    'Mostrar boton de WhatsApp en tu perfil': 'Show a WhatsApp button on your profile',
    'Número de WhatsApp': 'WhatsApp number',
    'Mensaje predeterminado': 'Default message',
    'Hola, me interesa...': 'Hi, I\'m interested in...',
    'Guardar cambios': 'Save changes',
    'Guardando...': 'Saving...',
    'Conecta tus automatizaciones (Make, Zapier, scripts) u otras apps externas a tu criadero.':
      'Connect your automations (Make, Zapier, scripts) or other external apps to your kennel.',

    // ─── kennel/api (API keys) ───
    '¿Revocar esta API key? Cualquier automatización que la use dejará de tener acceso.':
      'Revoke this API key? Any automation using it will lose access.',
    'Necesitas tener un criadero para gestionar API keys.': 'You need a kennel to manage API keys.',
    '¿Para qué sirven?': 'What are they for?',
    'Permiten a tus': 'They let your',
    'automatizaciones y herramientas externas': 'automations and external tools',
    '(Make, Zapier, scripts propios…) consultar tus perros, camadas y datos del criadero en tiempo real, vía API.':
      '(Make, Zapier, your own scripts…) query your dogs, litters and kennel data in real time, via API.',
    'Ver documentación de la API': 'View API documentation',
    'Esta es la única vez que verás esta clave.': 'This is the only time you\'ll see this key.',
    'Cópiala y guárdala en un sitio seguro (gestor de contraseñas, variable de entorno de tu automatización, etc.).':
      'Copy it and store it somewhere safe (password manager, environment variable of your automation, etc.).',
    'Copiado': 'Copied',
    'Copiar': 'Copy',
    'Cerrar': 'Close',
    'Nueva API key': 'New API key',
    'Ej: Make producción': 'e.g. Make production',
    'Generar': 'Generate',
    'Cancelar': 'Cancel',
    'Activas': 'Active',
    'Sin keys activas': 'No active keys',
    'creada': 'created',
    'usada': 'used',
    'nunca usada': 'never used',
    'Revocar': 'Revoke',
    'Revocadas': 'Revoked',
    'revocada': 'revoked',

    // ─── kennel/pagos (Stripe Connect) ───
    'Volver a Mi criadero': 'Back to My Kennel',
    'Mi criadero': 'My Kennel',
    'Pagos online': 'Online payments',
    'Conecta Stripe para cobrar online a tus clientes con tarjeta. El dinero llega directamente a tu cuenta bancaria (no pasa por Genealogic). Cumple PSD2, SEPA y normativa europea.':
      'Connect Stripe to charge your clients online by card. The money goes straight to your bank account (it doesn\'t pass through Genealogic). PSD2, SEPA and EU regulation compliant.',
    'Stripe no disponible': 'Stripe unavailable',
    'El equipo de Genealogic aún no ha configurado Stripe Connect en producción. Mientras tanto, puedes crear pagos y marcarlos como pagados manualmente (transferencia bancaria, efectivo) desde el panel de cada reserva.':
      'The Genealogic team hasn\'t set up Stripe Connect in production yet. In the meantime, you can create payments and mark them as paid manually (bank transfer, cash) from each reservation\'s panel.',
    'Estado de tu cuenta Stripe': 'Your Stripe account status',
    'Cómo funciona': 'How it works',
    'Conectas Stripe (5-10 min de onboarding, una vez)': 'You connect Stripe (5-10 min onboarding, once)',
    'Creas pagos en cada reserva del cliente (señal, pago intermedio, final)':
      'You create payments on each client reservation (deposit, interim payment, final)',
    'El cliente paga online desde su panel': 'The client pays online from their panel',
    'El dinero llega a tu cuenta bancaria en 1-7 días (depende del banco)':
      'The money reaches your bank account in 1-7 days (depends on the bank)',
    'Sin Stripe puedes seguir creando pagos y marcándolos como pagados manualmente':
      'Without Stripe you can still create payments and mark them as paid manually',
    'Cuenta activa — listo para cobrar': 'Account active — ready to charge',
    'Abrir dashboard Stripe': 'Open Stripe dashboard',
    'Sincronizar estado': 'Sync status',
    'Stripe ha restringido tu cuenta': 'Stripe has restricted your account',
    'Stripe necesita información adicional para mantener tu cuenta activa. Revisa el dashboard de Stripe para ver qué falta.':
      'Stripe needs additional information to keep your account active. Check the Stripe dashboard to see what\'s missing.',
    'Continuar onboarding': 'Continue onboarding',
    'Onboarding sin completar': 'Onboarding not completed',
    'Empezaste a conectar Stripe pero falta completar el formulario. Termina el proceso para poder cobrar online.':
      'You started connecting Stripe but the form isn\'t finished. Complete the process to charge online.',
    'Conecta una cuenta Stripe Express (5-10 min) para empezar a cobrar online.':
      'Connect a Stripe Express account (5-10 min) to start charging online.',
    'Conectar con Stripe': 'Connect with Stripe',

    // ─── kennel/contenido (layout + editores) ───
    'Edita tu web': 'Edit your website',
    'Contenido de': 'Content of',
    'Ver mi web': 'View my website',
    'Galería': 'Gallery',
    'Fotos generales del criadero: perros, eventos, familias con sus cachorros, momentos especiales. Mínimo 3 fotos para que la página sea pública.':
      'General kennel photos: dogs, events, families with their puppies, special moments. At least 3 photos for the page to go public.',
    'Instalaciones': 'Facilities',
    'Tour visual de dónde viven, juegan y crecen los perros. Mínimo 3 fotos para que la página sea pública. Usa pies de foto para describir cada zona.':
      'Visual tour of where the dogs live, play and grow. At least 3 photos for the page to go public. Use captions to describe each area.',
    'Nuestras razas': 'Our breeds',
    'Elige qué perro tuyo representa cada raza en tu web pública. Si no eliges nada, el sistema escoge automáticamente un reproductor con foto.':
      'Choose which of your dogs represents each breed on your public website. If you don\'t pick one, the system automatically chooses a breeding dog with a photo.',

    // ─── kennel/contenido/blog ───
    'Posts del criadero. Mínimo 1 publicado para que la página de blog sea pública.':
      'Kennel posts. At least 1 published for the blog page to go public.',
    'Total:': 'Total:',
    'publicados': 'published',
    'Nuevo post': 'New post',
    'Aún no tienes posts': 'You don\'t have any posts yet',
    'Crea tu primer post: nueva camada disponible, lección aprendida, novedad sobre la raza...':
      'Create your first post: new litter available, lesson learned, breed news...',
    'Crear primer post': 'Create first post',
    'Publicado': 'Published',
    'Borrador': 'Draft',
    'min lectura': 'min read',
    'Editar': 'Edit',
    'Volver al blog': 'Back to the blog',
    'Guarda como borrador mientras lo escribes. Publica cuando esté listo.':
      'Save as a draft while you write it. Publish when it\'s ready.',
    'Ver post público': 'View public post',
    'Editar post': 'Edit post',
    'Estado actual:': 'Current status:',

    // ─── kennels (directorio público) ───
    'Descubrimiento': 'Discovery',
    'Directorio de criaderos': 'Kennel directory',
    'criadero registrado en': 'kennel registered on',
    'criaderos registrados en': 'kennels registered on',
    'Nuestra raza': 'Our breed',

    // ─── kennels/[id]/contacto ───
    'Hablemos': 'Let\'s talk',
    'Contacta con': 'Contact',
    'Estamos aquí para responder dudas, planificar visitas y mantenerte al día sobre próximas camadas. Sin compromiso.':
      'We\'re here to answer questions, plan visits and keep you posted on upcoming litters. No commitment.',
    'Formulario': 'Form',
    'Escríbenos por aquí': 'Write to us here',
    'Te respondemos en menos de 24 horas. El formulario es la mejor vía para que no se nos escape ningún mensaje.':
      'We reply in under 24 hours. The form is the best way to make sure no message slips through.',
    'Este criadero aún no tiene un dueño registrado en Genealogic.':
      'This kennel doesn\'t have an owner registered on Genealogic yet.',
    'El criadero': 'The kennel',
    'Fundado en': 'Founded in',
    'Web propia': 'Own website',

    // ─── kennels/[id]/galeria + instalaciones (shells) ───
    'Imágenes': 'Images',
    'Activa la página "Galería" desde Mi criadero para que sea pública.':
      'Enable the "Gallery" page from My Kennel to make it public.',
    'Subir fotos': 'Upload photos',
    'Aún no has subido fotos': 'You haven\'t uploaded photos yet',
    'Sube al menos 3 fotos para que esta galería se haga pública.':
      'Upload at least 3 photos for this gallery to go public.',
    'Próximamente': 'Coming soon',
    'subirá fotos en breve.': 'will upload photos shortly.',
    'Dónde viven': 'Where they live',
    'Un vistazo a dónde viven, juegan y crecen nuestros perros.':
      'A glimpse of where our dogs live, play and grow.',
    'Activa la página "Instalaciones" desde Mi criadero para que sea pública.':
      'Enable the "Facilities" page from My Kennel to make it public.',
    'Sube al menos 3 fotos de tus instalaciones para que esta página se haga pública.':
      'Upload at least 3 photos of your facilities for this page to go public.',
    'subirá fotos de sus instalaciones en breve.': 'will upload photos of their facilities shortly.',

    // ─── kennels/[id]/blog ───
    'Notas y noticias': 'Notes and news',
    'Desde el criadero': 'From the kennel',
    'Camadas anunciadas, lecciones aprendidas, novedades y todo lo que merece la pena contar.':
      'Announced litters, lessons learned, news and everything worth sharing.',
    'Activa la página "Blog" desde Mi criadero para que sea pública.':
      'Enable the "Blog" page from My Kennel to make it public.',
    'Crear post': 'Create post',
    'Aún no hay posts publicados': 'No published posts yet',
    'Publica al menos 1 post para que esta sección se haga pública.':
      'Publish at least 1 post for this section to go public.',
    'publicará posts en breve.': 'will publish posts shortly.',
    'por': 'by',

    // ─── kennels/[id]/sobre ───
    'Quiénes somos': 'Who we are',
    'Sobre': 'About',
    'Activa la página "Sobre nosotros" desde Mi criadero para que sea pública.':
      'Enable the "About us" page from My Kennel to make it public.',
    'Editar contenido': 'Edit content',
    'Cuenta tu historia': 'Tell your story',
    'Escribe la historia del criadero, vuestra filosofía y qué os distingue. Se edita desde "Mi criadero → Editar contenido".':
      'Write the kennel\'s story, your philosophy and what sets you apart. Edit it from "My Kennel → Edit content".',
    'Más información sobre': 'More information about',
    'estará disponible muy pronto.': 'will be available very soon.',

    // ─── kennels/[id]/perros ───
    'Catálogo': 'Catalog',
    'Nuestros perros': 'Our dogs',
    'Reproductores activos, cachorros en venta, camadas planificadas y producidos por el criadero.':
      'Active breeding dogs, puppies for sale, planned litters and dogs produced by the kennel.',

    // ─── kennels/[id]/razas (lista) ───
    'Las razas que criamos en': 'The breeds we raise at',
    'La raza que criamos en': 'The breed we raise at',
    'Lo que la hace especial — y lo que conviene saber antes.':
      'What makes it special — and what\'s worth knowing first.',
    'Lo que las hace especiales — y lo que conviene saber antes.':
      'What makes them special — and what\'s worth knowing first.',
    'Sin imagen': 'No image',
    'Conoce la raza': 'Discover the breed',

    // ─── kennels/[id]/razas/[breedSlug] (ficha promocional) ───
    'La raza que criamos': 'The breed we raise',
    'En la foto:': 'In the photo:',
    'criado en': 'raised at',
    'Colores admitidos en el estándar': 'Colors accepted in the standard',
    'más': 'more',
    'Por qué nos gusta esta raza': 'Why we love this breed',
    'Lo que la distingue, en': 'What sets it apart, in',
    'puntos.': 'points.',
    'Temperamento': 'Temperament',
    '¿Para quién es esta raza?': 'Who is this breed for?',
    'Cómo es vivir con uno': 'What living with one is like',
    'Lo que conviene saber': 'What\'s worth knowing',
    'Ver nuestros': 'See our',
    'Ver estándar': 'View standard',
    'El estándar técnico completo de la raza en Genealogic':
      'The full technical breed standard on Genealogic',

    // ─── kennels/[id]/page (home pública) ───
    'año': 'year',
    'años': 'years',
    'Desde': 'Since',
    'Perro': 'Dog',
    'Perros': 'Dogs',
    'En la familia': 'In the family',
    'Camada': 'Litter',
    'Camadas': 'Litters',
    'cachorros': 'puppies',
    'Raza': 'Breed',
    'Razas': 'Breeds',
    'Especialidad': 'Specialty',
    'Este criadero está oculto al público': 'This kennel is hidden from the public',
    'Motivo:': 'Reason:',
    'Para apelar o aportar pruebas, contacta con': 'To appeal or provide evidence, contact',
    'sobre nosotros': 'about us',
    'galería': 'gallery',
    'desde': 'since',
    'criadero familiar': 'family kennel',
    'Conoce nuestra historia': 'Discover our story',
    'especializado en': 'specializing in',
    'Conoce a los protagonistas': 'Meet the stars',
    'Catálogo completo de reproductores, cachorros en venta, camadas y producidos por el criadero':
      'Full catalog of breeding dogs, puppies for sale, litters and dogs produced by the kennel',
    'Cada perro con su genealogía completa documentada en Genealogic.':
      'Each dog with its full genealogy documented on Genealogic.',
    'Ver todos los perros': 'See all dogs',
    'Cinco décadas en imágenes': 'Five decades in images',
    'Fotos del día a día del criadero, eventos, familias que ya tienen su cachorro y los perros que han marcado la trayectoria de':
      'Day-to-day kennel photos, events, families who already have their puppy, and the dogs that have shaped the journey of',
    'Ver galería': 'View gallery',
    'Volver': 'Back',
    'Criadero': 'Kennel',
    'Verificado': 'Verified',
    'Ver perros': 'See dogs',
    'Web': 'Website',
    'Trayectoria': 'Track record',
    '¿Te interesa una camada o un perro?': 'Interested in a litter or a dog?',
    'Escríbenos por el formulario y te respondemos en breve. Sin compromiso.':
      'Write to us through the form and we\'ll reply shortly. No commitment.',

    // ─── web/layout (gate) ───
    'Construye la web pública de tu criadero con un builder visual: páginas personalizadas, dominio propio, blog. Disponible próximamente para todos.':
      'Build your kennel\'s public website with a visual builder: custom pages, your own domain, blog. Coming soon for everyone.',
    'Volver al dashboard': 'Back to dashboard',

    // ─── web (lista de páginas) ───
    'Web pública': 'Public website',
    'Páginas': 'Pages',
    'General': 'General',
    '9 páginas troncales, siempre las mismas. Activa las que quieras mostrar y construye el contenido por secciones.':
      '9 core pages, always the same. Enable the ones you want to show and build the content by sections.',
    'Desactivar página': 'Disable page',
    'Activar página': 'Enable page',
    'Borrador sin publicar': 'Unpublished draft',
    'sección publicada': 'published section',
    'secciones publicadas': 'published sections',
    'en borrador': 'in draft',
    'Ver': 'View',
    // PAGE_HINT (web/page.tsx)
    'La portada de la web. Lo primero que ven los visitantes.':
      'The website\'s home page. The first thing visitors see.',
    'Listado de cachorros disponibles, próximas camadas y reproductores.':
      'List of available puppies, upcoming litters and breeding dogs.',
    'Información detallada sobre la raza (o razas) que crías.':
      'Detailed information about the breed (or breeds) you raise.',
    'El legado del criadero, hitos y equipo.': 'The kennel\'s legacy, milestones and team.',
    'Servicios secundarios: pupilaje, asesoría, libros, etc.':
      'Secondary services: boarding, advice, books, etc.',
    'Fotos del kennel, ubicación, características.': 'Kennel photos, location, features.',
    'Galería de fotos del criadero.': 'Kennel photo gallery.',
    'Índice de artículos. Los posts individuales se editan aparte.':
      'Article index. Individual posts are edited separately.',
    'Formulario y datos para que te contacten.': 'Form and details so people can contact you.',

    // ─── web/general (tema) ───
    'Elige el tema visual de tu web custom y ajusta los colores principales si quieres personalizarlo aún más. Los cambios se ven en tiempo real en la preview.':
      'Choose the visual theme for your custom website and adjust the main colors if you want to personalize it further. Changes show in real time in the preview.',
    'Migración pendiente': 'Migration pending',
    'El sistema de temas necesita ejecutar una migración en Supabase. Ve al':
      'The theme system needs to run a migration in Supabase. Go to the',
    'y ejecuta:': 'and run:',
    'Una vez ejecutado, refresca esta página y podrás guardar temas.':
      'Once run, refresh this page and you\'ll be able to save themes.',

    // ─── web/[slug] (editor) ───
    'Ver web pública': 'View public website',
    'Descartar': 'Discard',
    'Publicar': 'Publish',
    'Selecciona una sección': 'Select a section',
    'Pulsa una sección en la lista de la izquierda o directamente sobre ella en la vista previa.':
      'Click a section in the list on the left or directly on it in the preview.',
    'Atajos': 'Shortcuts',
    'Editar texto en línea': 'Edit text inline',
    'Duplicar sección': 'Duplicate section',
    'Eliminar sección': 'Delete section',
    'Deseleccionar': 'Deselect',
    'Deshacer': 'Undo',
    'Rehacer': 'Redo',
    'sin form': 'no form',
    'Duplicar': 'Duplicate',
    'Eliminar': 'Delete',

    // ─── web/[slug]/section-editor (JSON crudo) ───
    'Esta sección aún no tiene formulario específico. Edita las props como JSON crudo.':
      'This section doesn\'t have a specific form yet. Edit the props as raw JSON.',
    'JSON no válido:': 'Invalid JSON:',
    'Guardando…': 'Saving…',
    'Guardado a las': 'Saved at',
    'Formatear': 'Format',
    'Guardar': 'Save',
  },
}
