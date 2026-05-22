DO $$
DECLARE v_kennel_id uuid;
BEGIN
  SELECT id INTO v_kennel_id FROM kennels WHERE slug = 'irema-curto';
  IF v_kennel_id IS NULL THEN RAISE EXCEPTION 'Kennel irema-curto no encontrado'; END IF;

  INSERT INTO kennel_pages (kennel_id, slug, enabled, nav_label, nav_order, meta_title, meta_description, sections) VALUES (
    v_kennel_id, 'home', true, 'Inicio', 0,
    'Irema Curtó · Criadero de Perro de Presa Canario en Tenerife', 'Criadero familiar de Presa Canario en Tenerife desde 1975. Cinco décadas fieles al estándar tradicional.',
    '[{"id": "home-hero", "type": "hero", "props": {"eyebrow": "Tenerife · Desde 1975", "title": "Presa Canario desde 1975", "subtitle": "Criadero familiar dedicado a la selección y mejora del Presa Canario, con los más altos estándares de la raza original.", "ctas": [{"label": "Ver ejemplares", "href": "./perros"}, {"label": "Hablar con el criador", "href": "./contacto", "variant": "outline"}], "height": "lg", "background_image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_adan-de-irema.jpg"}}, {"id": "home-pillars", "type": "three-pillars", "props": {"title": "Tradición en evolución", "subtitle": "Cinco décadas fieles al Presa original — guardianes de la raza desde 1975.", "pillars": [{"icon": "🐾", "title": "50 años criando", "body": "Cinco décadas dedicadas a la selección del Presa Canario tradicional."}, {"icon": "🌍", "title": "12 países", "body": "Más de 1.000 cachorros entregados a familias en distintos rincones del mundo."}, {"icon": "🏡", "title": "17.000 m²", "body": "Instalaciones propias en plena montaña de Tenerife."}]}}, {"id": "home-puppies", "type": "available-puppies-strip", "props": {"title": "Cachorros disponibles", "subtitle": "Datos en vivo desde Genealogic.", "cta_href": "./perros"}}, {"id": "home-faq", "type": "faq", "props": {"title": "Preguntas frecuentes", "items": [{"question": "¿Cuánto cuesta un cachorro?", "answer": "El precio depende del color, el sexo, el país de destino y la función que vaya a cumplir el perro: familia, guarda y defensa o trabajo intensivo. Cuéntanos qué buscas y te damos la cotización exacta sin compromiso."}, {"question": "¿Qué incluye la entrega?", "answer": "Cada cachorro se entrega con pasaporte canino, vacuna antirrábica, microchip, plan de vacunas al día, desparasitación interna y externa, genealogía digital en Genealogic con más de 40 generaciones, seguimiento post-venta, 1 año de garantía genética y 15 días de garantía vírica y bacteriana."}, {"question": "¿Hacéis envíos fuera de España?", "answer": "Sí. Hemos enviado cachorros a 12 países distintos. Coordinamos toda la logística (vuelo, transportista certificado, papeles veterinarios, exportación)."}, {"question": "¿Puedo visitar el criadero?", "answer": "Sí, las visitas son siempre con cita previa. Estamos en Tenerife, Islas Canarias. Escríbenos y coordinamos un día."}, {"question": "¿Qué pasa si la seña no se devuelve?", "answer": "La seña no se devuelve salvo problema de salud del cachorro o causa mayor del criadero. Está aplicada al precio total al recoger."}]}}, {"id": "home-clientes", "type": "gallery-grid", "props": {"title": "Familias felices", "subtitle": "Cachorros que ya están en casa. Cada entrega es una nueva familia.", "images": [{"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-1.jpg", "alt": "Cliente con su Presa Canario"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-2.jpg", "alt": "Cliente con su Presa Canario"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-3.jpg", "alt": "Cliente con su Presa Canario"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-4.jpg", "alt": "Cliente con su Presa Canario"}]}}, {"id": "home-cta", "type": "cta-banner", "props": {"title": "¿Listo para tener tu Presa Canario?", "subtitle": "Vendemos por reservas. Apúntate a la lista de espera y serás el primero en saber cuándo nace la próxima camada.", "cta_label": "Apuntarme", "cta_href": "./contacto"}}]'::jsonb
  ) ON CONFLICT (kennel_id, slug) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    nav_label = EXCLUDED.nav_label,
    nav_order = EXCLUDED.nav_order,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    sections = EXCLUDED.sections,
    draft_sections = NULL;

  INSERT INTO kennel_pages (kennel_id, slug, enabled, nav_label, nav_order, meta_title, meta_description, sections) VALUES (
    v_kennel_id, 'perros', true, 'Nuestros perros', 1,
    'Cachorros de Presa Canario disponibles · Irema Curtó', 'Cachorros disponibles, próximas camadas y reproductores del criadero Irema Curtó.',
    '[{"id": "p-h", "type": "page-header", "props": {"eyebrow": "Cachorros", "title": "Nuestros perros", "subtitle": "Ejemplares disponibles, próximas camadas y reproductores. Datos en vivo desde Genealogic."}}, {"id": "p-tabs", "type": "dogs-tabs", "props": {}}, {"id": "p-w", "type": "waitlist-cta", "props": {"title": "¿No encuentras lo que buscas?", "subtitle": "Apúntate a la lista de espera y serás de los primeros en saberlo cuando nazca la próxima camada.", "href": "./contacto", "cta_label": "Apuntarme"}}]'::jsonb
  ) ON CONFLICT (kennel_id, slug) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    nav_label = EXCLUDED.nav_label,
    nav_order = EXCLUDED.nav_order,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    sections = EXCLUDED.sections,
    draft_sections = NULL;

  INSERT INTO kennel_pages (kennel_id, slug, enabled, nav_label, nav_order, meta_title, meta_description, sections) VALUES (
    v_kennel_id, 'razas', true, 'Sobre la raza', 2,
    'Sobre el Perro de Presa Canario · Irema Curtó', 'Características, estándar, colores y temperamento del Perro de Presa Canario.',
    '[{"id": "r-hero", "type": "breed-hero", "props": {"breed_name": "El Presa Canario", "tagline": "Una raza musculosa, imponente y saludable, ideal para convivir con familias con niños como perro de guardia y defensa.", "background_image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0706.jpg"}}, {"id": "r-traits", "type": "breed-traits", "props": {"title": "Características físicas", "stats": [{"label": "Altura", "value": "60-65 cm"}, {"label": "Peso", "value": "45-58 kg"}, {"label": "Vida", "value": "12-14 años"}, {"label": "Origen", "value": "Canarias"}]}}, {"id": "r-temp", "type": "breed-temperament", "props": {"title": "Temperamento", "traits": [{"label": "Protección", "description": "Una raza extremadamente leal y protectora, especialmente eficaz como perro de guardia. Capaz de defender a su familia y hogar de cualquier amenaza externa."}, {"label": "Tolerancia", "description": "A pesar de ser un perro imponente y capaz de proteger a su familia, también es muy dócil y tolerante con los juegos y las interacciones físicas de los niños."}, {"label": "Versatilidad", "description": "Capaz de adaptarse a todo tipo de circunstancias, climas y trabajos. Es un perro muy inteligente y fácil de entrenar."}, {"label": "Rusticidad", "description": "Mantenimiento sencillo. Resistente a las condiciones del clima canario y de cualquier otro entorno."}]}}, {"id": "r-col", "type": "breed-colors", "props": {"title": "Capas reconocidas", "colors": [{"name": "Negro", "hex": "#1a1a1a", "description": "Manto sólido sin atigrar", "image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/capas_negro.png"}, {"name": "Bardino oscuro", "hex": "#3d2818", "description": "Atigrado de base oscura", "image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/capas_bardino-oscuro.png"}, {"name": "Bardino gris", "hex": "#7c7c7a", "description": "Atigrado plateado", "image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/capas_bardino-gris.png"}, {"name": "Bardino rojo", "hex": "#7a3823", "description": "Atigrado de base rojiza", "image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/capas_bardino-rojo.png"}, {"name": "Bardino dorado", "hex": "#b87f3a", "description": "Atigrado dorado", "image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/capas_bardino-dorado.webp"}, {"name": "Bardino claro", "hex": "#d4a574", "description": "Atigrado de base muy clara", "image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/capas_bardino-claro.png"}, {"name": "Leonado", "hex": "#a06a3c", "description": "Manto sólido, máscara oscura", "image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/capas_leonado.png"}, {"name": "Arena", "hex": "#d6b896", "description": "Manto sólido crema, máscara oscura", "image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/capas_arena.png"}]}}]'::jsonb
  ) ON CONFLICT (kennel_id, slug) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    nav_label = EXCLUDED.nav_label,
    nav_order = EXCLUDED.nav_order,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    sections = EXCLUDED.sections,
    draft_sections = NULL;

  INSERT INTO kennel_pages (kennel_id, slug, enabled, nav_label, nav_order, meta_title, meta_description, sections) VALUES (
    v_kennel_id, 'historia', true, 'Nuestra historia', 3,
    'Historia de Irema Curtó · Presa Canario desde 1975', 'Estudio, creación y expansión del Perro de Presa Canario. Cinco décadas de historia del criadero Irema Curtó.',
    '[{"id": "h-hero", "type": "story-hero", "props": {"eyebrow": "Nuestra historia", "title": "Estudio, creación y expansión", "subtitle": "Te contamos una historia de creación, preservación, estudio, defensa, difusión y expansión de una raza que marcaría un antes y un después en los perros funcionales.", "background_image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0707.jpg"}}, {"id": "h-tl", "type": "timeline", "props": {"items": [{"year": "1975", "title": "Se concede el afijo Irema Curtó Kennels", "body": "El 4 de noviembre de 1975, la Real Sociedad Canina de España concede el afijo a Manuel Curtó Gracia."}, {"year": "1976", "title": "Creación del concepto Perro de Presa Canario", "body": "Manuel Curtó comienza a escribir artículos en El Día. Nace el concepto de la raza. Redacta el primer borrador del estándar basado en Boby y Piba."}, {"year": "1977", "title": "Primera camada de Presa Canario", "body": "Cruce entre Boby y Piba. Nacen 5 cachorros (Toby, Gey, Tamay, Isora y Viva), la base de la raza."}, {"year": "1985", "title": "Colaborador en Cadena COPE", "body": "Durante un año, todos los jueves, colaborador en COPE en el programa de María del Pino Fuentes como especialista canino."}, {"year": "1989", "title": "Corrección del estándar", "body": "Forma parte de la reunión decisiva para la modificación del estándar oficial, que se presentaría ante la FCI."}, {"year": "1980-2000", "title": "20 años escribiendo en revistas", "body": "Colaboraciones en Todo Perros, El Mundo del Perro y Canidapresa."}, {"year": "1991", "title": "Libro: El Perro de Presa Canario, su verdadero origen", "body": "Compuesto por artículos en orden cronológico, narra el origen histórico de la raza desde 1975 hasta 1991."}, {"year": "1996", "title": "Documental Senderos Isleños en TVE", "body": "Aparición hablando del Presa Canario, su origen y selección."}, {"year": "1999", "title": "Gladiator Dogs · Carl Semencic", "body": "Colaboración para el libro del Dr. Carl Semencic sobre perros tipo bull."}, {"year": "2003", "title": "Preservación con el UKC", "body": "Tras la decisión del club español de renombrarlo Dogo Canario y suprimir la capa negra, acude al UKC para que la raza fuera reconocida con su nombre tradicional."}, {"year": "2003", "title": "Libro en inglés: Perro de Presa Canario", "body": "Publicado por Kennel Club Books. Primer libro sobre la raza en inglés."}, {"year": "2012", "title": "Edición en español por Hispano-Europea", "body": "Versión española del libro publicado en 2003."}, {"year": "2014", "title": "20 artículos en iremacurto.com", "body": "Manuel Curtó Gracia escribe 20 artículos sobre lo acontecido en la raza desde 2001 hasta 2014."}]}}, {"id": "h-cta", "type": "cta-banner", "props": {"title": "Cinco décadas, una raza, una familia", "subtitle": "Si quieres formar parte de esta historia, hablemos.", "cta_label": "Contactar", "cta_href": "./contacto"}}]'::jsonb
  ) ON CONFLICT (kennel_id, slug) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    nav_label = EXCLUDED.nav_label,
    nav_order = EXCLUDED.nav_order,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    sections = EXCLUDED.sections,
    draft_sections = NULL;

  INSERT INTO kennel_pages (kennel_id, slug, enabled, nav_label, nav_order, meta_title, meta_description, sections) VALUES (
    v_kennel_id, 'servicios', true, 'Servicios', 4,
    'Servicios · Irema Curtó', 'Servicios secundarios relacionados con el sector canino.',
    '[{"id": "s-h", "type": "page-header", "props": {"eyebrow": "Servicios", "title": "Más allá de la cría", "subtitle": "Servicios secundarios que ofrecemos relacionados con el sector canino."}}, {"id": "s-g", "type": "services-grid", "props": {"services": [{"title": "Pupilaje ecuestre", "body": "Estancias temporales para caballos en nuestras instalaciones de Tenerife."}, {"title": "Asesoría sobre la raza", "body": "Consultoría profesional sobre estándar, selección y cría del Presa Canario."}, {"title": "Editorial y libros", "body": "Publicaciones sobre la raza, su historia y estándar."}]}}]'::jsonb
  ) ON CONFLICT (kennel_id, slug) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    nav_label = EXCLUDED.nav_label,
    nav_order = EXCLUDED.nav_order,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    sections = EXCLUDED.sections,
    draft_sections = NULL;

  INSERT INTO kennel_pages (kennel_id, slug, enabled, nav_label, nav_order, meta_title, meta_description, sections) VALUES (
    v_kennel_id, 'instalaciones', true, 'Instalaciones', 5,
    'Instalaciones del criadero · Irema Curtó · Tenerife', '17.000 m² de instalaciones propias en plena montaña de Tenerife.',
    '[{"id": "i-h", "type": "facilities-hero", "props": {"eyebrow": "Instalaciones", "title": "17.000 m² de instalaciones propias", "subtitle": "Las mismas instalaciones donde criamos al Presa Canario desde 1975: parideras climatizadas, zonas exteriores naturales y atención veterinaria continua, en plena montaña de Tenerife.", "background_image_url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_caseta.jpg"}}, {"id": "i-f", "type": "facility-features", "props": {"features": [{"label": "Superficie", "value": "17.000 m²"}, {"label": "Parideras", "value": "Climatizadas"}, {"label": "Zonas exteriores", "value": "Naturales"}, {"label": "Atención veterinaria", "value": "Continua"}]}}, {"id": "i-gallery", "type": "gallery-grid", "props": {"title": "Recorrido por el criadero", "images": [{"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_caseta.jpg", "alt": "Instalación del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_cuartos.jpg", "alt": "Instalación del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_lateral.jpg", "alt": "Instalación del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_perreras-arriba.jpg", "alt": "Instalación del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_perreras.jpg", "alt": "Instalación del criadero Irema Curtó"}]}}, {"id": "i-v", "type": "visit-cta", "props": {"title": "Concierta tu visita", "subtitle": "Las visitas son con cita previa. Escríbenos y coordinamos un día que os venga bien para conocer las instalaciones y los cachorros.", "cta_label": "Pedir cita", "cta_href": "./contacto"}}]'::jsonb
  ) ON CONFLICT (kennel_id, slug) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    nav_label = EXCLUDED.nav_label,
    nav_order = EXCLUDED.nav_order,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    sections = EXCLUDED.sections,
    draft_sections = NULL;

  INSERT INTO kennel_pages (kennel_id, slug, enabled, nav_label, nav_order, meta_title, meta_description, sections) VALUES (
    v_kennel_id, 'galeria', true, 'Galería', 6,
    'Galería · Irema Curtó · Presa Canario en imágenes', 'Fotos del criadero, los Presa Canarios y las familias.',
    '[{"id": "g-h", "type": "page-header", "props": {"eyebrow": "Galería", "title": "Cinco décadas en imágenes", "subtitle": "Fotos del criadero, los Presa Canarios y las familias que ya tienen el suyo."}}, {"id": "g-dogs", "type": "gallery-grid", "props": {"title": "Nuestros perros", "subtitle": "Presa Canarios de Irema", "images": [{"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0706.jpg", "alt": "Presa Canario del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0707.jpg", "alt": "Presa Canario del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0708.jpg", "alt": "Presa Canario del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0709.jpg", "alt": "Presa Canario del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0710.jpg", "alt": "Presa Canario del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0711.jpg", "alt": "Presa Canario del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0712.jpg", "alt": "Presa Canario del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_4403.jpg", "alt": "Presa Canario del criadero Irema Curtó"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_5256.jpg", "alt": "Presa Canario del criadero Irema Curtó"}]}}, {"id": "g-clientes", "type": "gallery-grid", "props": {"title": "Familias felices", "subtitle": "Cachorros que ya están en casa", "images": [{"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-1.jpg", "alt": "Cliente con su Presa Canario"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-2.jpg", "alt": "Cliente con su Presa Canario"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-3.jpg", "alt": "Cliente con su Presa Canario"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-4.jpg", "alt": "Cliente con su Presa Canario"}]}}, {"id": "g-inst", "type": "gallery-grid", "props": {"title": "Instalaciones", "subtitle": "17.000 m² en Tenerife", "images": [{"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_caseta.jpg", "alt": "Instalación del criadero"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_cuartos.jpg", "alt": "Instalación del criadero"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_lateral.jpg", "alt": "Instalación del criadero"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_perreras-arriba.jpg", "alt": "Instalación del criadero"}, {"url": "https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_perreras.jpg", "alt": "Instalación del criadero"}]}}, {"id": "g-n", "type": "newsletter", "props": {"title": "Recibe novedades del criadero", "subtitle": "Apúntate y te avisamos cuando publiquemos nuevos perros, camadas o eventos.", "placeholderEmail": "tu@email.com", "ctaLabel": "Suscribirse"}}]'::jsonb
  ) ON CONFLICT (kennel_id, slug) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    nav_label = EXCLUDED.nav_label,
    nav_order = EXCLUDED.nav_order,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    sections = EXCLUDED.sections,
    draft_sections = NULL;

  INSERT INTO kennel_pages (kennel_id, slug, enabled, nav_label, nav_order, meta_title, meta_description, sections) VALUES (
    v_kennel_id, 'blog', true, 'Blog', 7,
    'Blog · Irema Curtó', 'Artículos sobre el Perro de Presa Canario, cría seria y el día a día del criadero.',
    '[{"id": "b-h", "type": "blog-hero", "props": {"eyebrow": "Blog", "title": "Lo último del criadero", "subtitle": "Artículos sobre la raza, la cría seria y el día a día del criadero."}}, {"id": "b-g", "type": "posts-grid", "props": {}}]'::jsonb
  ) ON CONFLICT (kennel_id, slug) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    nav_label = EXCLUDED.nav_label,
    nav_order = EXCLUDED.nav_order,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    sections = EXCLUDED.sections,
    draft_sections = NULL;

  INSERT INTO kennel_pages (kennel_id, slug, enabled, nav_label, nav_order, meta_title, meta_description, sections) VALUES (
    v_kennel_id, 'contacto', true, 'Contacto', 8,
    'Contacto · Irema Curtó', 'Habla con el criadero Irema Curtó. Tenerife, Islas Canarias. Visitas con cita previa.',
    '[{"id": "c-h", "type": "page-header", "props": {"eyebrow": "Contacto", "title": "Cuéntanos", "subtitle": "Información sobre cachorros, lista de espera, asesoría o lo que necesites."}}, {"id": "c-f", "type": "contact-form", "props": {"topics": ["Información sobre cachorros disponibles", "Apuntarme a lista de espera", "Pupilaje ecuestre", "Editorial / libro", "Asesoría", "Otros"]}}, {"id": "c-i", "type": "contact-info", "props": {"title": "Detalles", "items": [{"label": "Dirección", "value": "Tenerife, Islas Canarias"}, {"label": "Horario", "value": "Visitas con cita previa"}, {"label": "Afijo", "value": "Irema Curtó · desde 1975"}]}}]'::jsonb
  ) ON CONFLICT (kennel_id, slug) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    nav_label = EXCLUDED.nav_label,
    nav_order = EXCLUDED.nav_order,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    sections = EXCLUDED.sections,
    draft_sections = NULL;

  RAISE NOTICE 'Importadas % páginas para Irema Curtó', 9;
END $$;

SELECT slug, enabled, jsonb_array_length(sections) AS sections_count, meta_title FROM kennel_pages WHERE kennel_id = (SELECT id FROM kennels WHERE slug = 'irema-curto') ORDER BY nav_order;