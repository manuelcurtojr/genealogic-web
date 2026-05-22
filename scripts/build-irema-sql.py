#!/usr/bin/env python3
"""Genera el SQL para importar el contenido de iremacurto.com a kennel_pages."""
import json, os, sys

PAGES = [
    {
        "slug": "home",
        "nav_label": "Inicio",
        "nav_order": 0,
        "meta_title": "Irema Curtó · Criadero de Perro de Presa Canario en Tenerife",
        "meta_description": "Criadero familiar de Presa Canario en Tenerife desde 1975. Cinco décadas fieles al estándar tradicional.",
        "sections": [
            {"id": "home-hero", "type": "hero", "props": {
                "eyebrow": "Tenerife · Desde 1975",
                "title": "Presa Canario desde 1975",
                "subtitle": "Criadero familiar dedicado a la selección y mejora del Presa Canario, con los más altos estándares de la raza original.",
                "ctas": [{"label": "Ver ejemplares", "href": "./perros"}, {"label": "Hablar con el criador", "href": "./contacto", "variant": "outline"}],
                "height": "lg",
            }},
            {"id": "home-pillars", "type": "three-pillars", "props": {
                "title": "Tradición en evolución",
                "subtitle": "Cinco décadas fieles al Presa original — guardianes de la raza desde 1975.",
                "pillars": [
                    {"icon": "🐾", "title": "50 años criando", "body": "Cinco décadas dedicadas a la selección del Presa Canario tradicional."},
                    {"icon": "🌍", "title": "12 países", "body": "Más de 1.000 cachorros entregados a familias en distintos rincones del mundo."},
                    {"icon": "🏡", "title": "17.000 m²", "body": "Instalaciones propias en plena montaña de Tenerife."},
                ],
            }},
            {"id": "home-puppies", "type": "available-puppies-strip", "props": {
                "title": "Cachorros disponibles",
                "subtitle": "Datos en vivo desde Genealogic.",
                "cta_href": "./perros",
            }},
            {"id": "home-faq", "type": "faq", "props": {
                "title": "Preguntas frecuentes",
                "items": [
                    {"question": "¿Cuánto cuesta un cachorro?", "answer": "El precio depende del color, el sexo, el país de destino y la función que vaya a cumplir el perro: familia, guarda y defensa o trabajo intensivo. Cuéntanos qué buscas y te damos la cotización exacta sin compromiso."},
                    {"question": "¿Qué incluye la entrega?", "answer": "Cada cachorro se entrega con pasaporte canino, vacuna antirrábica, microchip, plan de vacunas al día, desparasitación interna y externa, genealogía digital en Genealogic con más de 40 generaciones, seguimiento post-venta, 1 año de garantía genética y 15 días de garantía vírica y bacteriana."},
                    {"question": "¿Hacéis envíos fuera de España?", "answer": "Sí. Hemos enviado cachorros a 12 países distintos. Coordinamos toda la logística (vuelo, transportista certificado, papeles veterinarios, exportación)."},
                    {"question": "¿Puedo visitar el criadero?", "answer": "Sí, las visitas son siempre con cita previa. Estamos en Tenerife, Islas Canarias. Escríbenos y coordinamos un día."},
                    {"question": "¿Qué pasa si la seña no se devuelve?", "answer": "La seña no se devuelve salvo problema de salud del cachorro o causa mayor del criadero. Está aplicada al precio total al recoger."},
                ],
            }},
            {"id": "home-cta", "type": "cta-banner", "props": {
                "title": "¿Listo para tener tu Presa Canario?",
                "subtitle": "Vendemos por reservas. Apúntate a la lista de espera y serás el primero en saber cuándo nace la próxima camada.",
                "cta_label": "Apuntarme",
                "cta_href": "./contacto",
            }},
        ],
    },
    {
        "slug": "perros",
        "nav_label": "Nuestros perros",
        "nav_order": 1,
        "meta_title": "Cachorros de Presa Canario disponibles · Irema Curtó",
        "meta_description": "Cachorros disponibles, próximas camadas y reproductores del criadero Irema Curtó.",
        "sections": [
            {"id": "p-h", "type": "page-header", "props": {"eyebrow": "Cachorros", "title": "Nuestros perros", "subtitle": "Ejemplares disponibles, próximas camadas y reproductores. Datos en vivo desde Genealogic."}},
            {"id": "p-tabs", "type": "dogs-tabs", "props": {}},
            {"id": "p-w", "type": "waitlist-cta", "props": {"title": "¿No encuentras lo que buscas?", "subtitle": "Apúntate a la lista de espera y serás de los primeros en saberlo cuando nazca la próxima camada.", "href": "./contacto", "cta_label": "Apuntarme"}},
        ],
    },
    {
        "slug": "razas",
        "nav_label": "Sobre la raza",
        "nav_order": 2,
        "meta_title": "Sobre el Perro de Presa Canario · Irema Curtó",
        "meta_description": "Características, estándar, colores y temperamento del Perro de Presa Canario.",
        "sections": [
            {"id": "r-hero", "type": "breed-hero", "props": {"breed_name": "El Presa Canario", "tagline": "Una raza musculosa, imponente y saludable, ideal para convivir con familias con niños como perro de guardia y defensa."}},
            {"id": "r-traits", "type": "breed-traits", "props": {
                "title": "Características físicas",
                "stats": [
                    {"label": "Altura", "value": "60-65 cm"},
                    {"label": "Peso", "value": "45-58 kg"},
                    {"label": "Vida", "value": "12-14 años"},
                    {"label": "Origen", "value": "Canarias"},
                ],
            }},
            {"id": "r-temp", "type": "breed-temperament", "props": {
                "title": "Temperamento",
                "traits": [
                    {"label": "Protección", "description": "Una raza extremadamente leal y protectora, especialmente eficaz como perro de guardia. Capaz de defender a su familia y hogar de cualquier amenaza externa."},
                    {"label": "Tolerancia", "description": "A pesar de ser un perro imponente y capaz de proteger a su familia, también es muy dócil y tolerante con los juegos y las interacciones físicas de los niños."},
                    {"label": "Versatilidad", "description": "Capaz de adaptarse a todo tipo de circunstancias, climas y trabajos. Es un perro muy inteligente y fácil de entrenar."},
                    {"label": "Rusticidad", "description": "Mantenimiento sencillo. Resistente a las condiciones del clima canario y de cualquier otro entorno."},
                ],
            }},
            {"id": "r-col", "type": "breed-colors", "props": {
                "title": "Capas reconocidas",
                "colors": [
                    {"name": "Negro", "hex": "#1a1a1a", "description": "Manto sólido sin atigrar"},
                    {"name": "Bardino oscuro", "hex": "#3d2818", "description": "Atigrado de base oscura"},
                    {"name": "Bardino gris", "hex": "#7c7c7a", "description": "Atigrado plateado"},
                    {"name": "Bardino rojo", "hex": "#7a3823", "description": "Atigrado de base rojiza"},
                    {"name": "Bardino dorado", "hex": "#b87f3a", "description": "Atigrado dorado"},
                    {"name": "Bardino claro", "hex": "#d4a574", "description": "Atigrado de base muy clara"},
                    {"name": "Leonado", "hex": "#a06a3c", "description": "Manto sólido, máscara oscura"},
                    {"name": "Arena", "hex": "#d6b896", "description": "Manto sólido crema, máscara oscura"},
                ],
            }},
        ],
    },
    {
        "slug": "historia",
        "nav_label": "Nuestra historia",
        "nav_order": 3,
        "meta_title": "Historia de Irema Curtó · Presa Canario desde 1975",
        "meta_description": "Estudio, creación y expansión del Perro de Presa Canario. Cinco décadas de historia del criadero Irema Curtó.",
        "sections": [
            {"id": "h-hero", "type": "story-hero", "props": {"eyebrow": "Nuestra historia", "title": "Estudio, creación y expansión", "subtitle": "Te contamos una historia de creación, preservación, estudio, defensa, difusión y expansión de una raza que marcaría un antes y un después en los perros funcionales."}},
            {"id": "h-tl", "type": "timeline", "props": {
                "items": [
                    {"year": "1975", "title": "Se concede el afijo Irema Curtó Kennels", "body": "El 4 de noviembre de 1975, la Real Sociedad Canina de España concede el afijo a Manuel Curtó Gracia."},
                    {"year": "1976", "title": "Creación del concepto Perro de Presa Canario", "body": "Manuel Curtó comienza a escribir artículos en El Día. Nace el concepto de la raza. Redacta el primer borrador del estándar basado en Boby y Piba."},
                    {"year": "1977", "title": "Primera camada de Presa Canario", "body": "Cruce entre Boby y Piba. Nacen 5 cachorros (Toby, Gey, Tamay, Isora y Viva), la base de la raza."},
                    {"year": "1985", "title": "Colaborador en Cadena COPE", "body": "Durante un año, todos los jueves, colaborador en COPE en el programa de María del Pino Fuentes como especialista canino."},
                    {"year": "1989", "title": "Corrección del estándar", "body": "Forma parte de la reunión decisiva para la modificación del estándar oficial, que se presentaría ante la FCI."},
                    {"year": "1980-2000", "title": "20 años escribiendo en revistas", "body": "Colaboraciones en Todo Perros, El Mundo del Perro y Canidapresa."},
                    {"year": "1991", "title": "Libro: El Perro de Presa Canario, su verdadero origen", "body": "Compuesto por artículos en orden cronológico, narra el origen histórico de la raza desde 1975 hasta 1991."},
                    {"year": "1996", "title": "Documental Senderos Isleños en TVE", "body": "Aparición hablando del Presa Canario, su origen y selección."},
                    {"year": "1999", "title": "Gladiator Dogs · Carl Semencic", "body": "Colaboración para el libro del Dr. Carl Semencic sobre perros tipo bull."},
                    {"year": "2003", "title": "Preservación con el UKC", "body": "Tras la decisión del club español de renombrarlo Dogo Canario y suprimir la capa negra, acude al UKC para que la raza fuera reconocida con su nombre tradicional."},
                    {"year": "2003", "title": "Libro en inglés: Perro de Presa Canario", "body": "Publicado por Kennel Club Books. Primer libro sobre la raza en inglés."},
                    {"year": "2012", "title": "Edición en español por Hispano-Europea", "body": "Versión española del libro publicado en 2003."},
                    {"year": "2014", "title": "20 artículos en iremacurto.com", "body": "Manuel Curtó Gracia escribe 20 artículos sobre lo acontecido en la raza desde 2001 hasta 2014."},
                ],
            }},
            {"id": "h-cta", "type": "cta-banner", "props": {"title": "Cinco décadas, una raza, una familia", "subtitle": "Si quieres formar parte de esta historia, hablemos.", "cta_label": "Contactar", "cta_href": "./contacto"}},
        ],
    },
    {
        "slug": "servicios",
        "nav_label": "Servicios",
        "nav_order": 4,
        "meta_title": "Servicios · Irema Curtó",
        "meta_description": "Servicios secundarios relacionados con el sector canino.",
        "sections": [
            {"id": "s-h", "type": "page-header", "props": {"eyebrow": "Servicios", "title": "Más allá de la cría", "subtitle": "Servicios secundarios que ofrecemos relacionados con el sector canino."}},
            {"id": "s-g", "type": "services-grid", "props": {
                "services": [
                    {"title": "Pupilaje ecuestre", "body": "Estancias temporales para caballos en nuestras instalaciones de Tenerife."},
                    {"title": "Asesoría sobre la raza", "body": "Consultoría profesional sobre estándar, selección y cría del Presa Canario."},
                    {"title": "Editorial y libros", "body": "Publicaciones sobre la raza, su historia y estándar."},
                ],
            }},
        ],
    },
    {
        "slug": "instalaciones",
        "nav_label": "Instalaciones",
        "nav_order": 5,
        "meta_title": "Instalaciones del criadero · Irema Curtó · Tenerife",
        "meta_description": "17.000 m² de instalaciones propias en plena montaña de Tenerife.",
        "sections": [
            {"id": "i-h", "type": "facilities-hero", "props": {"eyebrow": "Instalaciones", "title": "17.000 m² de instalaciones propias", "subtitle": "Las mismas instalaciones donde criamos al Presa Canario desde 1975: parideras climatizadas, zonas exteriores naturales y atención veterinaria continua, en plena montaña de Tenerife."}},
            {"id": "i-f", "type": "facility-features", "props": {
                "features": [
                    {"label": "Superficie", "value": "17.000 m²"},
                    {"label": "Parideras", "value": "Climatizadas"},
                    {"label": "Zonas exteriores", "value": "Naturales"},
                    {"label": "Atención veterinaria", "value": "Continua"},
                ],
            }},
            {"id": "i-v", "type": "visit-cta", "props": {"title": "Concierta tu visita", "subtitle": "Las visitas son con cita previa. Escríbenos y coordinamos un día que os venga bien para conocer las instalaciones y los cachorros.", "cta_label": "Pedir cita", "cta_href": "./contacto"}},
        ],
    },
    {
        "slug": "galeria",
        "nav_label": "Galería",
        "nav_order": 6,
        "meta_title": "Galería · Irema Curtó · Presa Canario en imágenes",
        "meta_description": "Fotos del criadero, los Presa Canarios y las familias.",
        "sections": [
            {"id": "g-h", "type": "page-header", "props": {"eyebrow": "Galería", "title": "Cinco décadas en imágenes", "subtitle": "Fotos del criadero, los Presa Canarios y las familias que ya tienen el suyo."}},
            {"id": "g-n", "type": "newsletter", "props": {"title": "Recibe novedades del criadero", "subtitle": "Apúntate y te avisamos cuando publiquemos nuevos perros, camadas o eventos.", "placeholderEmail": "tu@email.com", "ctaLabel": "Suscribirse"}},
        ],
    },
    {
        "slug": "blog",
        "nav_label": "Blog",
        "nav_order": 7,
        "meta_title": "Blog · Irema Curtó",
        "meta_description": "Artículos sobre el Perro de Presa Canario, cría seria y el día a día del criadero.",
        "sections": [
            {"id": "b-h", "type": "blog-hero", "props": {"eyebrow": "Blog", "title": "Lo último del criadero", "subtitle": "Artículos sobre la raza, la cría seria y el día a día del criadero."}},
            {"id": "b-g", "type": "posts-grid", "props": {}},
        ],
    },
    {
        "slug": "contacto",
        "nav_label": "Contacto",
        "nav_order": 8,
        "meta_title": "Contacto · Irema Curtó",
        "meta_description": "Habla con el criadero Irema Curtó. Tenerife, Islas Canarias. Visitas con cita previa.",
        "sections": [
            {"id": "c-h", "type": "page-header", "props": {"eyebrow": "Contacto", "title": "Cuéntanos", "subtitle": "Información sobre cachorros, lista de espera, asesoría o lo que necesites."}},
            {"id": "c-f", "type": "contact-form", "props": {
                "topics": ["Información sobre cachorros disponibles", "Apuntarme a lista de espera", "Pupilaje ecuestre", "Editorial / libro", "Asesoría", "Otros"],
            }},
            {"id": "c-i", "type": "contact-info", "props": {
                "title": "Detalles",
                "items": [
                    {"label": "Dirección", "value": "Tenerife, Islas Canarias"},
                    {"label": "Horario", "value": "Visitas con cita previa"},
                    {"label": "Afijo", "value": "Irema Curtó · desde 1975"},
                ],
            }},
        ],
    },
]


def sql_str(s):
    """Escapa string para SQL Postgres (single quotes)."""
    return s.replace("'", "''")


def main():
    lines = []
    lines.append("DO $$")
    lines.append("DECLARE v_kennel_id uuid;")
    lines.append("BEGIN")
    lines.append("  SELECT id INTO v_kennel_id FROM kennels WHERE slug = 'irema-curto';")
    lines.append("  IF v_kennel_id IS NULL THEN RAISE EXCEPTION 'Kennel irema-curto no encontrado'; END IF;")
    lines.append("")
    for p in PAGES:
        sections_json = json.dumps(p["sections"], ensure_ascii=False)
        # Para Postgres usar single-quote escape duplicando '
        sections_sql = sql_str(sections_json)
        lines.append(f"  INSERT INTO kennel_pages (kennel_id, slug, enabled, nav_label, nav_order, meta_title, meta_description, sections) VALUES (")
        lines.append(f"    v_kennel_id, '{p['slug']}', true, '{sql_str(p['nav_label'])}', {p['nav_order']},")
        lines.append(f"    '{sql_str(p['meta_title'])}', '{sql_str(p['meta_description'])}',")
        lines.append(f"    '{sections_sql}'::jsonb")
        lines.append(f"  ) ON CONFLICT (kennel_id, slug) DO UPDATE SET")
        lines.append(f"    enabled = EXCLUDED.enabled,")
        lines.append(f"    nav_label = EXCLUDED.nav_label,")
        lines.append(f"    nav_order = EXCLUDED.nav_order,")
        lines.append(f"    meta_title = EXCLUDED.meta_title,")
        lines.append(f"    meta_description = EXCLUDED.meta_description,")
        lines.append(f"    sections = EXCLUDED.sections,")
        lines.append(f"    draft_sections = NULL;")
        lines.append("")

    lines.append("  RAISE NOTICE 'Importadas % páginas para Irema Curtó', " + str(len(PAGES)) + ";")
    lines.append("END $$;")
    lines.append("")
    lines.append("SELECT slug, enabled, jsonb_array_length(sections) AS sections_count, meta_title FROM kennel_pages WHERE kennel_id = (SELECT id FROM kennels WHERE slug = 'irema-curto') ORDER BY nav_order;")

    out = os.path.join(os.path.dirname(__file__), "import-irema.sql")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Generado {out} ({len(lines)} líneas)")


if __name__ == "__main__":
    main()
