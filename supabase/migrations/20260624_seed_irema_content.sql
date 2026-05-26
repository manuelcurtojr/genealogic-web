-- ═══════════════════════════════════════════════════════════════════════════
-- Seed contenido de Irema desde kennel_pages → nueva web Pro
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Migra el contenido existente del builder de Irema (kennel_pages.sections)
-- al nuevo modelo: kennels.about_md + kennel_photos. El builder antiguo
-- (/c/irema-curto) sigue funcionando con sus sections — esta migración
-- COPIA, no mueve.
--
-- Idempotente: solo poblamos los campos si están vacíos (NOT NULL guards),
-- y para fotos comprobamos kennel_id+url antes de insertar.

DO $$
DECLARE
  v_kennel_id constant uuid := '9675883f-f47e-4c51-bd5d-7fc2c6242963';
  v_existing_about text;
BEGIN
  SELECT about_md INTO v_existing_about FROM public.kennels WHERE id = v_kennel_id;

  -- ─── Sobre nosotros (about_md) ───────────────────────────────────────
  -- Combinamos el subtitle del hero "Nuestra historia" + timeline en MD.
  IF v_existing_about IS NULL OR v_existing_about = '' THEN
    UPDATE public.kennels
    SET about_md = $about$
Te contamos una historia de creación, preservación, estudio, defensa, difusión y expansión de una raza que marcaría un antes y un después en los perros funcionales.

**1975 · Se concede el afijo Irema Curtó Kennels**
El 4 de noviembre de 1975, la Real Sociedad Canina de España concede el afijo a Manuel Curtó Gracia.

**1976 · Creación del concepto Perro de Presa Canario**
Manuel Curtó comienza a escribir artículos en El Día. Nace el concepto de la raza. Redacta el primer borrador del estándar basado en Boby y Piba.

**1977 · Primera camada de Presa Canario**
Cruce entre Boby y Piba. Nacen 5 cachorros (Toby, Gey, Tamay, Isora y Viva), la base de la raza.

**1985 · Colaborador en Cadena COPE**
Durante un año, todos los jueves, colaborador en COPE en el programa de María del Pino Fuentes como especialista canino.

**1989 · Corrección del estándar**
Forma parte de la reunión decisiva para la modificación del estándar oficial, que se presentaría ante la FCI.

**1980-2000 · 20 años escribiendo en revistas**
Colaboraciones en Todo Perros, El Mundo del Perro y Canidapresa.

**1991 · Libro: El Perro de Presa Canario, su verdadero origen**
Compuesto por artículos en orden cronológico, narra el origen histórico de la raza desde 1975 hasta 1991.

**1996 · Documental Senderos Isleños en TVE**
Aparición hablando del Presa Canario, su origen y selección.

**1999 · Gladiator Dogs · Carl Semencic**
Colaboración para el libro del Dr. Carl Semencic sobre perros tipo bull.

**2003 · Preservación con el UKC**
Tras la decisión del club español de renombrarlo Dogo Canario y suprimir la capa negra, acude al UKC para que la raza fuera reconocida con su nombre tradicional.

**2003 · Libro en inglés: Perro de Presa Canario**
Publicado por Kennel Club Books. Primer libro sobre la raza en inglés.

**2012 · Edición en español por Hispano-Europea**
Versión española del libro publicado en 2003.

**2014 · 20 artículos en iremacurto.com**
Manuel Curtó Gracia escribe 20 artículos sobre lo acontecido en la raza desde 2001 hasta 2014.
$about$
    WHERE id = v_kennel_id;
  END IF;

  -- ─── Galería (kennel_photos kind='gallery') ──────────────────────────
  -- 9 fotos de perros + 4 de clientes. Las dejamos solo aquí (no en facilities).
  INSERT INTO public.kennel_photos (kennel_id, kind, url, caption, position)
  SELECT v_kennel_id, 'gallery', url, caption, position
  FROM (VALUES
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0706.jpg', 'Presa Canario de Irema',  10),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0707.jpg', 'Presa Canario de Irema',  20),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0708.jpg', 'Presa Canario de Irema',  30),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0709.jpg', 'Presa Canario de Irema',  40),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0710.jpg', 'Presa Canario de Irema',  50),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0711.jpg', 'Presa Canario de Irema',  60),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_0712.jpg', 'Presa Canario de Irema',  70),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_4403.jpg', 'Presa Canario de Irema',  80),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/drive_img_5256.jpg', 'Presa Canario de Irema',  90),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-1.jpg', 'Familia con su Presa Canario', 100),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-2.jpg', 'Familia con su Presa Canario', 110),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-3.jpg', 'Familia con su Presa Canario', 120),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/clientes_cliente-4.jpg', 'Familia con su Presa Canario', 130)
  ) AS t(url, caption, position)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.kennel_photos kp
    WHERE kp.kennel_id = v_kennel_id AND kp.url = t.url AND kp.kind = 'gallery'
  );

  -- ─── Instalaciones (kennel_photos kind='facilities') ─────────────────
  INSERT INTO public.kennel_photos (kennel_id, kind, url, caption, position)
  SELECT v_kennel_id, 'facilities', url, caption, position
  FROM (VALUES
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_caseta.jpg',           'Caseta principal', 10),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_cuartos.jpg',          'Parideras climatizadas', 20),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_lateral.jpg',          'Lateral del recinto', 30),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_perreras-arriba.jpg',  'Perreras superiores', 40),
    ('https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/kennels/irema-curto/site/instalaciones_perreras.jpg',         'Perreras inferiores', 50)
  ) AS t(url, caption, position)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.kennel_photos kp
    WHERE kp.kennel_id = v_kennel_id AND kp.url = t.url AND kp.kind = 'facilities'
  );
END $$;
