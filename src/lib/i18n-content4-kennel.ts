// Fase 4 · Wave 2 — Diccionario ES→EN de los componentes del CRIADERO (kennel).
//
// Cubre los strings envueltos con t('...') en src/components/kennel/**.tsx
// (perfil público Pro, editores de contenido, formularios de contacto, reseñas,
// galería, paneles de venta/transferencia, navegación del chrome, etc.).
//
// Las claves son el español EXACTO pasado a t(). Incluye también los VALORES
// de las constantes a nivel de módulo que se renderizan con t(constante)
// (FIELD_TYPES, MAP_OPTIONS, TABS, statusCfg, ITEMS de nav, PAGE_NAV_LABEL,
// PAGE_DESC, BASE_PAGES, LEGAL_DOCS, STATUS_LABEL).
//
// Duplicados con otros dicts (i18n.ts base, content/2/3, content4-*) son
// inofensivos: getTranslator cascadea. 'es' no necesita entradas (clave base).
// Glosario: genealogy (NUNCA pedigree en UI), kennel, breeder, owner, litter,
// sire (Padre), dam (Madre), heat, whelping, deworming, vaccine, reservation,
// deposit (seña), waiting list, public website, domain, lead, affix.

export const content4Kennel: Record<string, Record<string, string>> = {
  en: {
    // ─── Comunes / acciones ───
    'Guardar': 'Save', 'Guardar cambios': 'Save changes', 'Guardando...': 'Saving...',
    'Guardando…': 'Saving…', 'Guardado': 'Saved', 'Cancelar': 'Cancel',
    'Editar': 'Edit', 'Borrar': 'Delete', 'Ver': 'View', 'Buscar': 'Search',
    'Cerrar': 'Close', 'Enviar': 'Send', 'Quitar': 'Remove', 'Limpiar': 'Clear',
    'Anterior': 'Previous', 'Siguiente': 'Next', 'Restablecer': 'Reset',
    'Personalizar': 'Customize', 'Mostrar': 'Show', 'Ocultar': 'Hide',
    'Preview': 'Preview', 'Editor': 'Editor', 'Vista previa': 'Preview',

    // ─── about-content / about-hero / about-team / about-gallery ───
    'Línea del tiempo': 'Timeline',
    'hitos que marcaron la historia': 'milestones that shaped the history',
    'Conoce el lugar': 'Get to know the place',
    'Donde vive': 'Where',
    'Instalaciones': 'Facilities', 'Galería': 'Gallery', 'foto': 'photo',
    'Desde': 'Since', 'año': 'year', 'años': 'years',
    'Especialidad': 'Specialty', 'razas': 'breeds', 'hitos': 'milestones',
    'En la historia': 'In its history', 'Criadero': 'Kennel', 'est.': 'est.',
    'Equipo del criadero': 'Kennel team', 'Las personas': 'The people',
    'Quién está detrás': 'Who is behind it', 'Fundador': 'Founder',
    'Responsable de la cría, selección y continuidad del criadero.':
      'Responsible for the kennel’s breeding, selection and continuity.',

    // ─── about-editor ───
    'Sobre nosotros': 'About us',
    'Cuenta tu historia, tu filosofía de cría y qué os distingue. Soporta saltos de línea y':
      'Tell your story, your breeding philosophy and what sets you apart. Supports line breaks and',
    'Hace falta mínimo 50 caracteres para que la página sea pública.':
      'A minimum of 50 characters is required for the page to be public.',
    'Empieza por contar cuándo y por qué nació el criadero, qué razas crías y qué valores guían tu trabajo...':
      'Start by telling when and why the kennel was founded, which breeds you raise and what values guide your work...',
    'Aún no hay contenido para previsualizar.': 'No content to preview yet.',
    'caracteres': 'characters', 'Necesitas ≥50 para publicar': 'You need ≥50 to publish',
    'Tienes que iniciar sesión otra vez.': 'You need to log in again.',
    'No tienes permisos sobre este criadero.': 'You don’t have permission for this kennel.',
    'Esta función está en Kennel Pro.': 'This feature is in Kennel Pro.',
    'No se pudo guardar:': 'Couldn’t save:',

    // ─── breed-hero-picker ───
    'Aún no se han detectado razas en tu criadero.':
      'No breeds have been detected in your kennel yet.',
    'Marca al menos un perro como reproductor en su ficha. Cuando lo hagas, la raza aparecerá automáticamente aquí y en tu web Pro.':
      'Mark at least one dog as a breeding dog on its profile. Once you do, the breed will appear automatically here and on your Pro site.',
    'Elige qué perro tuyo representa cada raza en tu web pública. La foto elegida aparecerá como portada en':
      'Choose which of your dogs represents each breed on your public site. The chosen photo will appear as the cover on',
    'Nuestras razas': 'Our breeds', 'Automático': 'Automatic',
    'y en la ficha promocional de cada raza. Si dejas':
      'and on each breed’s promotional page. If you leave',
    'el sistema elige solo un reproductor con foto.':
      'the system automatically picks a breeding dog with a photo.',
    'Foto actualizada': 'Photo updated', 'Vuelves al modo automático': 'Back to automatic mode',
    'Error:': 'Error:', 'perro con foto': 'dog with photo', 'perros con foto': 'dogs with photos',
    'disponibles': 'available', 'Sin foto': 'No photo',
    'Foto elegida': 'Chosen photo', 'Foto automática': 'Automatic photo',
    'Elige una foto': 'Choose a photo', 'Volver a automático': 'Back to automatic',
    'No tienes ningún perro de esta raza con foto subida.':
      'You have no dog of this breed with an uploaded photo.',
    'Reproductor': 'Breeding',

    // ─── blog-slider (aria) ───
    // (Anterior / Siguiente arriba)

    // ─── contact-form-builder ───
    'Esto sobrescribirá los campos actuales. ¿Continuar?':
      'This will overwrite the current fields. Continue?',
    'Nueva pregunta': 'New question', 'Opción 1': 'Option 1', 'Opción 2': 'Option 2',
    '¿Eliminar este campo?': 'Delete this field?',
    'Constructor': 'Builder', 'Formulario de contacto': 'Contact form',
    'Configura las preguntas. Se usa en tu perfil estándar y en tu web personalizada.':
      'Configure the questions. Used on your standard profile and on your custom site.',
    'Plantillas rápidas': 'Quick templates', 'Genérica': 'Generic',
    'Nombre, email, teléfono y mensaje. Para contactos generales sin filtros.':
      'Name, email, phone and message. For general inquiries with no filters.',
    'Cría enfocada': 'Breeding-focused',
    'Color, sexo, función (familia / guarda / trabajo) + descripción. Filtra leads serios.':
      'Color, sex, purpose (family / guard / work) + description. Filters serious leads.',
    'Configuración personalizada — has modificado los campos de una plantilla.':
      'Custom setup — you’ve modified the fields of a template.',
    'Campos del formulario': 'Form fields',
    'Reordenar (usa los botones)': 'Reorder (use the buttons)',
    'Obligatorio': 'Required', 'Opcional': 'Optional', 'extra': 'extra',
    'Añadir campo': 'Add field', 'Textos del formulario': 'Form texts',
    'Botón de envío': 'Submit button', 'Enviar solicitud': 'Send request',
    'Mensaje de éxito': 'Success message',
    '¡Gracias! Te responderemos pronto.': 'Thanks! We’ll get back to you soon.',
    'Etiqueta visible': 'Visible label', 'Mapea a': 'Maps to',
    'Placeholder': 'Placeholder', 'Opciones (una por línea)': 'Options (one per line)',
    'Texto de ayuda (opcional)': 'Help text (optional)',
    'Texto pequeño debajo del campo': 'Small text below the field',
    '— Seleccionar —': '— Select —',
    // FIELD_TYPES (labels)
    'Texto corto': 'Short text', 'Email': 'Email', 'Teléfono': 'Phone',
    'Texto largo': 'Long text', 'Desplegable': 'Dropdown',
    'Selección única': 'Single choice', 'Casilla': 'Checkbox',
    // MAP_OPTIONS (labels)
    '— (campo extra)': '— (extra field)', 'Nombre del solicitante': 'Applicant name',
    'Email del solicitante': 'Applicant email', 'Teléfono del solicitante': 'Applicant phone',
    'Mensaje principal': 'Main message', 'Propósito / función': 'Purpose / use',
    'País': 'Country', 'Ciudad': 'City', 'Sexo preferido': 'Preferred sex',
    'Color preferido': 'Preferred color',

    // ─── contact-kennel-button ───
    'No se pudo enviar': 'Couldn’t send', 'Error de red': 'Network error',
    'Pedir información': 'Request info', 'Contacta con': 'Contact',
    'Cuéntanos qué buscas y te respondemos en breve. Sin compromiso.':
      'Tell us what you’re looking for and we’ll reply shortly. No commitment.',
    '¡Enviado!': 'Sent!',
    'verá tu mensaje y te responderá en breve.': 'will see your message and reply shortly.',
    'Enviando…': 'Sending…',

    // ─── contenido-subnav (ITEMS labels) ───
    'Destacados': 'Featured', 'Blog': 'Blog', 'FAQ': 'FAQ',
    'Reseñas': 'Reviews', 'Legal': 'Legal',

    // ─── faq-editor ───
    'Preguntas frecuentes': 'Frequently asked questions',
    'Aparecen en el Inicio de tu web pública. Las respondes una vez y ahorras tiempo a tus clientes (y a ti).':
      'They appear on your public site’s Home. Answer them once and save time for your clients (and yourself).',
    'Aún no hay preguntas': 'No questions yet',
    'Empieza con las 3-5 que te preguntan siempre: precio, disponibilidad, garantía, documentación, visitas...':
      'Start with the 3-5 you’re always asked: price, availability, guarantee, paperwork, visits...',
    '¿Borrar esta pregunta?': 'Delete this question?', 'No se pudo borrar': 'Couldn’t delete',
    'La pregunta es muy corta.': 'The question is too short.',
    'La respuesta es muy corta.': 'The answer is too short.',
    'Pregunta (ej: ¿Hacéis envíos a península?)': 'Question (e.g. Do you ship to the mainland?)',
    'Respuesta clara y directa...': 'A clear, direct answer...',

    // ─── featured-dogs-picker ───
    'Perros destacados en el Inicio': 'Featured dogs on the Home',
    'Elige los perros que verán primero los visitantes en la home de tu web pública. Si no marcas ninguno, mostramos automáticamente los de mejor foto.':
      'Choose the dogs visitors will see first on your public site’s home. If you mark none, we automatically show the ones with the best photos.',
    'perro destacado': 'featured dog', 'perros destacados': 'featured dogs',
    'se mostrarán solo los 6 primeros': 'only the first 6 will be shown',
    'Aún no tienes perros en el criadero': 'You have no dogs in the kennel yet',
    'Crea tu primer perro desde Mis perros.': 'Create your first dog from My Dogs.',

    // ─── kennel-chrome-nav ───
    'Abrir menú': 'Open menu', 'Cerrar menú': 'Close menu', 'Menú': 'Menu',

    // ─── kennel-chrome / kennel-pro-footer ───
    'Todos los derechos reservados.': 'All rights reserved.',
    'Web creada con': 'Site built with',
    'Mantente al día con': 'Stay up to date with',
    'Próximas camadas, novedades, eventos. Cero spam. Te das de baja con un click.':
      'Upcoming litters, news, events. Zero spam. Unsubscribe with one click.',
    // LEGAL_DOCS labels
    'Aviso legal': 'Legal notice', 'Política de privacidad': 'Privacy policy',
    'Política de cookies': 'Cookie policy', 'Términos y condiciones': 'Terms & conditions',

    // ─── kennel-config-view ───
    'Perros': 'Dogs', 'Visibles': 'Visible', 'Reproductores': 'Breeders', 'Camadas': 'Litters',
    'Personaliza las preguntas que ven los visitantes (plantilla + campos custom).':
      'Customize the questions visitors see (template + custom fields).',
    'Visitas a la web': 'Site visits',
    'Analíticas de tráfico, países, dispositivos y páginas más vistas.':
      'Traffic analytics, countries, devices and most-viewed pages.',
    'Dominio personalizado': 'Custom domain',
    'Conecta tu dominio propio (tucriadero.com).': 'Connect your own domain (yourkennel.com).',
    'Pagos online (Stripe)': 'Online payments (Stripe)',
    'Conecta Stripe Connect para cobrar reservas y entregas online.':
      'Connect Stripe Connect to charge for reservations and deliveries online.',
    'API keys': 'API keys',
    'Tokens para integrar datos con servicios externos.':
      'Tokens to integrate data with external services.',
    'Mi cuenta': 'My account', 'Mi criadero': 'My kennel',
    'Datos del criadero, contenido público y herramientas.':
      'Kennel details, public content and tools.',
    'Cambiar logo': 'Change logo', 'Afijo:': 'Affix:', 'Editar datos': 'Edit details',
    'Tu web pública': 'Your public site',
    'Edita lo que ven tus clientes': 'Edit what your clients see',
    'Sobre nosotros, galería, instalaciones y blog. Sin escribir HTML — se rellena solo con tu contenido.':
      'About us, gallery, facilities and blog. No HTML — it fills itself with your content.',
    'Editar contenido': 'Edit content', 'Ver mi web': 'View my site',
    'Ver mi perfil público': 'View my public profile',
    'Herramientas avanzadas': 'Advanced tools',
    'Formulario, dominio propio, pagos online, API keys, analíticas.':
      'Form, custom domain, online payments, API keys, analytics.',

    // ─── kennel-edit-panel ───
    'Editar criadero': 'Edit kennel', 'Información basica': 'Basic info',
    'Nombre del criadero *': 'Kennel name *', 'Descripcion': 'Description',
    'Describe tu criadero, tu filosofia de cria...':
      'Describe your kennel, your breeding philosophy...',
    'Fecha de fundacion': 'Foundation date', 'Sitio web': 'Website',
    'Seleccionar país': 'Select country', 'Buscar país...': 'Search country...',
    'Buscar ciudad...': 'Search city...', 'Selecciona un país primero': 'Select a country first',
    'Formato del nombre (afijo)': 'Name format (affix)',
    'Define como se formara el nombre de los cachorros de tu criadero':
      'Define how your kennel’s puppy names will be formed',
    'Razas que crias': 'Breeds you raise',
    'Selecciona las razas que apareceran en tu formulario de contacto':
      'Select the breeds that will appear in your contact form',
    'Redes sociales': 'Social media',
    'Activar WhatsApp': 'Enable WhatsApp',
    'Boton de WhatsApp en tu perfil publico': 'WhatsApp button on your public profile',
    'Número': 'Number', 'Mensaje predeterminado': 'Default message',
    'Hola, me interesa...': 'Hi, I’m interested...',

    // ─── kennel-legal-editor ───
    'Error al guardar': 'Error saving', 'Error': 'Error',
    'Datos legales de tu criadero': 'Your kennel’s legal details',
    'Estos datos rellenan automáticamente tus documentos legales (aviso legal, privacidad, cookies y términos). Si los dejas vacíos, se usa tu nombre y ubicación, y los huecos sin completar se marcan entre corchetes.':
      'These details automatically fill your legal documents (legal notice, privacy, cookies and terms). If left blank, your name and location are used, and any unfilled gaps are marked in brackets.',
    'Razón social / titular': 'Legal name / holder', 'Ej: Manuel Curtó SL': 'e.g. Manuel Curtó SL',
    'Quién es el responsable legal del sitio.': 'Who is legally responsible for the site.',
    'NIF / CIF / DNI': 'Tax ID', 'Ej: B12345678': 'e.g. B12345678',
    'Email de contacto legal': 'Legal contact email', 'Ej: info@tucriadero.com': 'e.g. info@yourkennel.com',
    'Para ejercer derechos RGPD.': 'To exercise GDPR rights.',
    'Domicilio': 'Address', 'Calle, código postal, localidad': 'Street, postal code, town',
    'Guardar datos': 'Save details', 'Tus documentos legales': 'Your legal documents',
    'Por defecto usan las plantillas de Genealogic con tus datos. Puedes verlos o, si lo necesitas, escribir tu propia versión.':
      'By default they use Genealogic’s templates with your details. You can view them or, if you need to, write your own version.',
    'Versión personalizada': 'Custom version', 'Plantilla por defecto': 'Default template',
    'Volver a la plantilla por defecto': 'Back to the default template',
    'Título': 'Title',
    'Escribe tu versión en Markdown. Puedes usar placeholders como {{kennel_legal_name}}.':
      'Write your version in Markdown. You can use placeholders like {{kennel_legal_name}}.',
    'Placeholders:': 'Placeholders:', 'Markdown:': 'Markdown:', 'listas con': 'lists with',
    'Guardar versión': 'Save version',

    // ─── kennel-public-tabs / perros-catalog (TABS + status + cards) ───
    'En venta': 'For sale',
    'Producido por el criadero': 'Produced by the kennel',
    'No hay perros visibles en este criadero.': 'There are no visible dogs in this kennel.',
    'Sin reproductores publicados.': 'No breeding dogs published.',
    'No hay perros en venta ahora mismo.': 'No dogs for sale right now.',
    'Sin camadas publicadas.': 'No litters published.',
    'aún no tiene perros criados publicados.': 'has no produced dogs published yet.',
    'Camada': 'Litter', 'Consultar precio': 'Check price',
    // statusCfg labels
    'Nacida': 'Born', 'Cubrición': 'Mated', 'Planificada': 'Planned', 'Entregada': 'Delivered',

    // ─── perros-catalog (search/filters) ───
    'Buscar en': 'Search in', 'Todas las razas': 'All breeds', 'Ambos sexos': 'Both sexes',
    'Macho': 'Male', 'Hembra': 'Female',
    'No hay reproductores que coincidan con los filtros.': 'No breeding dogs match the filters.',
    'Ahora mismo no hay cachorros disponibles': 'No puppies available right now',
    'Trabajamos por lista de espera. Pide información y te avisamos en cuanto haya una camada que encaje contigo.':
      'We work by waiting list. Request info and we’ll let you know as soon as there’s a litter that fits you.',
    'No hay perros en venta que coincidan.': 'No dogs for sale match.',
    'No hay camadas publicadas ahora mismo': 'No litters published right now',
    'Planificamos las camadas con cuidado. Pide información y te contamos qué tenemos previsto.':
      'We plan litters carefully. Request info and we’ll tell you what we have planned.',
    'No hay camadas que coincidan.': 'No litters match.',
    'No hay perros que coincidan.': 'No dogs match.',

    // ─── pro-home ───
    'Verificado': 'Verified', 'cachorro disponible': 'puppy available',
    'cachorros disponibles': 'puppies available', 'ahora': 'now',
    'Próxima camada planificada': 'Next litter planned', 'Ver nuestros perros': 'View our dogs',
    'Trayectoria': 'Track record',
    'Acabas de crear': 'You’ve just created', 'está empezando': 'is just starting',
    'Sube fotos a tu galería, escribe tu historia y añade tus perros para que tu web se vea increíble.':
      'Upload photos to your gallery, write your story and add your dogs so your site looks amazing.',
    'Pronto encontrarás aquí los perros, la historia y todo lo que hace único a este criadero.':
      'Soon you’ll find here the dogs, the story and everything that makes this kennel unique.',
    'Empezar a llenar mi web': 'Start filling my site',
    'La voz de los clientes': 'The clients’ voice',
    'Lo que dicen las familias': 'What families say', 'Comparte tu experiencia': 'Share your experience',
    'reseña': 'review', 'reseñas': 'reviews', 'Cliente': 'Client', 'Usuario': 'User',
    'Sé el primero en dejar una reseña': 'Be the first to leave a review',
    '¿Has tratado con': 'Have you dealt with',
    'Cuenta tu experiencia y ayuda a otras familias a decidir.':
      'Share your experience and help other families decide.',
    'Antes de contactar': 'Before contacting',
    'Desde el blog': 'From the blog', 'Últimas notas': 'Latest posts', 'Ver todas': 'View all',
    // AvailabilitySection
    'Disponible ahora': 'Available now',
    'Próxima camada y cachorros disponibles': 'Next litter and puppies available',
    'Próxima camada': 'Next litter', 'Cachorros disponibles': 'Puppies available',
    'Ver camada': 'View litter', 'En venta ahora mismo': 'For sale right now',
    'cachorro buscando familia': 'puppy looking for a family',
    'cachorros buscando familia': 'puppies looking for a family',
    'Ver disponibles': 'View available',
    // STATUS_LABEL
    'Camada planificada': 'Litter planned', 'En gestación': 'Pregnant',
    'Recién nacidos': 'Newborns', 'Entregados': 'Delivered',
    // formatExpected
    'Nacimiento esperado en': 'Birth expected in', 'Planificada para': 'Planned for',
    'Nacidos en': 'Born in', '— disponibles próximamente': '— available soon',

    // ─── pro-page-shell ───
    'Solo tú estás viendo esto.': 'Only you are seeing this.',

    // ─── photos-gallery ───
    'Ver foto': 'View photo',

    // ─── photos-manager ───
    'formato no soportado (JPG/PNG/WebP/HEIC)': 'unsupported format (JPG/PNG/WebP/HEIC)',
    'pesa más de 10 MB': 'is larger than 10 MB',
    'Esta función requiere Kennel Pro': 'This feature requires Kennel Pro',
    'Sube fotos a tu galería': 'Upload photos to your gallery',
    'Sube fotos de tus instalaciones': 'Upload photos of your facilities',
    'JPG, PNG, WebP o HEIC, hasta 10 MB por imagen. Puedes seleccionar varias a la vez.':
      'JPG, PNG, WebP or HEIC, up to 10 MB per image. You can select several at once.',
    'Subiendo': 'Uploading', 'Subiendo...': 'Uploading...', 'Seleccionar fotos': 'Select photos',
    'fotos': 'photos', 'faltan': 'need',
    'para publicar esta página': 'more to publish this page', 'Lista para publicar': 'Ready to publish',
    'Aún no has subido ninguna foto.': 'You haven’t uploaded any photo yet.',
    '¿Borrar esta foto? No se puede deshacer.': 'Delete this photo? This can’t be undone.',
    'Pie de foto (opcional)': 'Caption (optional)', 'Sin pie de foto': 'No caption',
    'Editar pie de foto': 'Edit caption', 'Borrar foto': 'Delete photo',

    // ─── post-editor ───
    'No se pudo guardar': 'Couldn’t save',
    'El título es muy corto (mínimo 3 caracteres)': 'The title is too short (minimum 3 characters)',
    '¿Borrar este post? No se puede deshacer.': 'Delete this post? This can’t be undone.',
    'No se pudo subir la imagen': 'Couldn’t upload the image',
    'Ej: Nueva camada disponible — primavera 2026': 'e.g. New litter available — spring 2026',
    'Resumen': 'Summary', '(opcional)': '(optional)',
    'Frase corta que invite a leer (aparece en la lista del blog y en redes sociales).':
      'A short line that invites reading (appears in the blog list and on social media).',
    'Imagen de portada': 'Cover image', 'Quitar imagen': 'Remove image', 'Subir imagen': 'Upload image',
    'Cuerpo del post': 'Post body',
    'Escribe el contenido del post. Soporta saltos de párrafo.':
      'Write the post content. Supports paragraph breaks.',
    'Guardar borrador': 'Save draft', 'Publicar': 'Publish', 'Borrar post': 'Delete post',

    // ─── public-view-toggle ───
    'Vista pública por defecto': 'Default public view',
    'Cuando alguien entra a tu URL pública, ¿qué quieres que vea?':
      'When someone visits your public URL, what do you want them to see?',
    'Perfil estándar': 'Standard profile', 'Activo': 'Active',
    'Vista automática de Genealogic con tus perros, camadas y palmarés. Funciona desde el día 1, sin configurar.':
      'Automatic Genealogic view with your dogs, litters and awards. Works from day 1, no setup.',
    'Web personalizada': 'Custom site',
    'Tu URL pública lleva directo a tu web hecha con el builder. Tu marca, tu diseño, sin "powered by".':
      'Your public URL leads straight to your site built with the builder. Your brand, your design, no "powered by".',
    'redirige a': 'redirects to',
    'Aún no has publicado tu web personalizada.': 'You haven’t published your custom site yet.',
    'Créala desde el editor →': 'Create it from the editor →',
    'Para hacer que tu URL pública lleve directo a tu web personalizada necesitas el plan Pro.':
      'To make your public URL lead straight to your custom site you need the Pro plan.',
    'Ver planes →': 'See plans →',

    // ─── reviews-editor ───
    'Reseñas de clientes': 'Client reviews',
    'Aparecen en el Inicio de tu web pública. Pega aquí los testimonios que te dan tus clientes (con su permiso, por supuesto).':
      'They appear on your public site’s Home. Paste here the testimonials your clients give you (with their permission, of course).',
    'Nueva reseña': 'New review', 'Aún no hay reseñas': 'No reviews yet',
    'La opinión sincera de un cliente vale más que cualquier copy de marketing.':
      'A client’s honest opinion is worth more than any marketing copy.',
    '¿Borrar esta reseña?': 'Delete this review?',
    'No se pudo cambiar visibilidad': 'Couldn’t change visibility',
    'Oculta': 'Hidden',
    'No se pudo subir la foto': 'Couldn’t upload the photo',
    'El nombre del cliente es muy corto.': 'The client’s name is too short.',
    'El texto de la reseña es muy corto.': 'The review text is too short.',
    'Subir foto del cliente': 'Upload client photo',
    'Nombre del cliente (ej: Familia García, Madrid)': 'Client name (e.g. García family, Madrid)',
    'Texto de la reseña tal cual te la dio el cliente...':
      'The review text exactly as the client gave it to you...',
    'Valoración:': 'Rating:', 'estrellas': 'stars', 'Sin nota': 'No rating',

    // ─── leave-review-button ───
    'Dejar reseña': 'Leave a review',
    'La reseña es muy corta (mínimo 20 caracteres).': 'The review is too short (minimum 20 characters).',
    'La reseña es muy larga (máximo 1500 caracteres).': 'The review is too long (maximum 1500 characters).',
    'Ya has dejado una reseña en este criadero.': 'You’ve already left a review for this kennel.',
    'No puedes dejarte reseñas a ti mismo.': 'You can’t review yourself.',
    'Tienes que iniciar sesión.': 'You need to log in.',
    'No se pudo enviar:': 'Couldn’t send:',
    '¡Gracias por tu reseña!': 'Thanks for your review!',
    'El criadero la revisará y aparecerá pública en cuanto la apruebe.':
      'The kennel will review it and it will appear publicly once approved.',
    'Tu opinión ayuda a otras familias.': 'Your opinion helps other families.',
    'Valoración': 'Rating', 'Tu reseña': 'Your review',
    'Cuenta tu experiencia con el criadero, qué te ha gustado, recomendarías...':
      'Share your experience with the kennel, what you liked, would you recommend it...',
    'Tu reseña no se publica al instante — el criadero la revisa antes de hacerla visible. Aparecerá con un badge automático según seas cliente o usuario registrado.':
      'Your review isn’t published instantly — the kennel reviews it before making it visible. It will show an automatic badge depending on whether you’re a client or a registered user.',
    'Enviar reseña': 'Submit review',

    // ─── newsletter-subscribe ───
    'Email no válido.': 'Invalid email.', 'No se pudo suscribir:': 'Couldn’t subscribe:',
    '¡Ya estabas suscrito!': 'You were already subscribed!', '¡Apuntado!': 'You’re in!',
    'Recibirás todas las novedades de este criadero.':
      'You’ll receive all the news from this kennel.',
    'Te avisamos cuando haya novedades.': 'We’ll let you know when there’s news.',
    'Suscribirme': 'Subscribe',

    // ─── owner-floating-nav ───
    'Plegar': 'Collapse', 'Plegar menú': 'Collapse menu',
    'Tu vista de criador': 'Your breeder view',
    'Estás viendo tu web pública en tu dominio. Los enlaces abren tu dashboard en genealogic.io en una pestaña nueva.':
      'You’re viewing your public site on your domain. The links open your dashboard on genealogic.io in a new tab.',
    'Estás viendo tu web pública. Solo tú ves este menú porque estás logueado como propietario.':
      'You’re viewing your public site. Only you see this menu because you’re logged in as the owner.',
    'Abrir menú de criador': 'Open breeder menu',
    // ITEMS labels
    'Escritorio': 'Dashboard', 'Cruces': 'Matings', 'Reproducción': 'Breeding',
    'Calendario': 'Calendar', 'Reservas': 'Reservations', 'Emailbot': 'Emailbot',
    'Ajustes': 'Settings',

    // ─── pages-toggles ───
    'Esta página requiere Kennel Pro. Apúntate a la lista de espera.':
      'This page requires Kennel Pro. Join the waiting list.',
    'No se pudo cambiar el estado. Inténtalo de nuevo.': 'Couldn’t change the status. Try again.',
    'Páginas': 'Pages', 'Páginas de tu web': 'Your site pages',
    'Activa las que quieras tener. Solo se publican cuando añades contenido (pulsa "Editar" para añadirlo).':
      'Enable the ones you want. They only publish once you add content (press "Edit" to add it).',
    'Siempre activa': 'Always on', 'Pendiente: contenido': 'Pending: content',
    'Próximamente': 'Coming soon',
    'La sección "Preguntas frecuentes" se renderiza dentro del Inicio cuando tienes entradas en la biblioteca del Emailbot — no es una página propia.':
      'The "Frequently asked questions" section renders within the Home when you have entries in the Emailbot library — it’s not a page of its own.',
    // PAGE_NAV_LABEL
    'Inicio': 'Home', 'Nuestros perros': 'Our dogs', 'Contacto': 'Contact',
    // PAGE_DESC
    'Cuenta tu historia, filosofía de cría y qué os distingue. Texto largo.':
      'Tell your story, breeding philosophy and what sets you apart. Long text.',
    'Fotos generales del criadero, perros y eventos.':
      'General photos of the kennel, dogs and events.',
    'Tour visual de dónde viven, juegan y crecen tus perros.':
      'A visual tour of where your dogs live, play and grow.',
    'Notas, novedades y anuncios de camadas.': 'Notes, news and litter announcements.',
    // BASE_PAGES desc
    'Landing con hero, perros destacados, FAQ y CTA.':
      'Landing with hero, featured dogs, FAQ and CTA.',
    'Catálogo completo: reproductores, venta, camadas y producidos.':
      'Full catalog: breeders, for sale, litters and produced.',
    'Formulario y datos del criadero.': 'Form and kennel details.',

    // ─── sale-panel ───
    'Anuncio de venta': 'Sale listing', 'No en venta': 'Not for sale',
    'El anuncio esta activo': 'The listing is active',
    'Activa el anuncio para vender': 'Turn on the listing to sell',
    'Precio': 'Price', 'Divisa': 'Currency', 'Precio total': 'Total price', 'Reserva': 'Deposit',
    'Ubicacion': 'Location', 'Código postal': 'Postal code', 'Ciudad, Pais': 'City, Country',
    'Introduce el código postal para autocompletar la ubicacion':
      'Enter the postal code to autocomplete the location',
    'Descripcion del anuncio': 'Listing description',
    'Describe el caracter, morfologia, vacunas incluidas, por que es especial...':
      'Describe the temperament, conformation, included vaccines, why it’s special...',
    'Guardar anuncio': 'Save listing',

    // ─── transfer-panel ───
    'No autenticado': 'Not authenticated', 'Transferir perro': 'Transfer dog',
    '¿Algo falla?': 'Something wrong?',
    'Al transferir, el nuevo propietario podra gestionar este perro. El perro seguira apareciendo en tu criadero.':
      'On transfer, the new owner will be able to manage this dog. The dog will still appear in your kennel.',
    'Email del nuevo propietario': 'New owner’s email',
    'No se encontro ningun usuario con ese email': 'No user found with that email',
    'El usuario debe estar registrado en Genealogic': 'The user must be registered on Genealogic',
    'Perro transferido correctamente': 'Dog transferred successfully',
    'Transfiriendo...': 'Transferring...',
  },
}
