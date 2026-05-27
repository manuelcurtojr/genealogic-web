-- ═══════════════════════════════════════════════════════════════════════════
-- Soft-hide reversible para dogs y kennels
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Política operativa: ni perros ni criaderos se eliminan físicamente. Cuando
-- un reporte (notice-and-action), una solicitud RGPD o una decisión admin
-- requieren retirar contenido, lo OCULTAMOS añadiendo hidden_at + motivo +
-- referencia al reporte. El registro permanece en la BBDD por dos razones:
--
--  1. Preservación del grafo genealógico — los descendientes deben poder
--     seguir mostrando el árbol (con placeholder "Perro oculto").
--  2. Reversibilidad — ante contra-notificación fundada o reposición, el
--     contenido vuelve instantáneamente sin pérdida de datos.
--
-- get_pedigree devuelve los perros ocultos con flag is_hidden=true y los
-- campos identificativos (name, photo, breed, etc.) anonimizados. Los IDs
-- de padres/madres se conservan para que el árbol no se rompa.
--
-- Idempotente. Re-aplicable.

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Columnas hidden_* en dogs
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.dogs
  ADD COLUMN IF NOT EXISTS hidden_at        timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_reason    text,
  ADD COLUMN IF NOT EXISTS hidden_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_report_id uuid REFERENCES public.content_reports(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_notes     text;

-- Motivos válidos (CHECK suelto — NULL permitido cuando no está oculto)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dogs_hidden_reason_chk'
  ) THEN
    ALTER TABLE public.dogs
      ADD CONSTRAINT dogs_hidden_reason_chk
      CHECK (hidden_reason IS NULL OR hidden_reason IN (
        'rgpd_request',        -- titular solicita supresión
        'copyright',           -- foto/datos sin derechos
        'inaccurate',          -- info falsa
        'inappropriate',       -- contenido ofensivo
        'impersonation',       -- suplantación
        'animal_welfare',      -- bienestar animal
        'duplicate',           -- duplicado de otro perro
        'owner_request',       -- el propio dueño quiere ocultar
        'admin_decision',      -- decisión admin sin notice
        'other'
      ));
  END IF;
END$$;

-- Coherencia: si hidden_at IS NULL, todos los demás campos hidden_* deben serlo
-- también; si hidden_at IS NOT NULL, hidden_reason es obligatorio.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dogs_hidden_coherence_chk'
  ) THEN
    ALTER TABLE public.dogs
      ADD CONSTRAINT dogs_hidden_coherence_chk
      CHECK (
        (hidden_at IS NULL AND hidden_reason IS NULL)
        OR (hidden_at IS NOT NULL AND hidden_reason IS NOT NULL)
      );
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS dogs_hidden_at_idx
  ON public.dogs (hidden_at) WHERE hidden_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS dogs_visible_public_idx
  ON public.dogs (created_at DESC)
  WHERE hidden_at IS NULL AND is_public = true;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Columnas hidden_* en kennels
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.kennels
  ADD COLUMN IF NOT EXISTS hidden_at        timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_reason    text,
  ADD COLUMN IF NOT EXISTS hidden_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_report_id uuid REFERENCES public.content_reports(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_notes     text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kennels_hidden_reason_chk'
  ) THEN
    ALTER TABLE public.kennels
      ADD CONSTRAINT kennels_hidden_reason_chk
      CHECK (hidden_reason IS NULL OR hidden_reason IN (
        'rgpd_request', 'copyright', 'inaccurate', 'inappropriate',
        'impersonation', 'animal_welfare', 'duplicate',
        'owner_request', 'admin_decision', 'other'
      ));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kennels_hidden_coherence_chk'
  ) THEN
    ALTER TABLE public.kennels
      ADD CONSTRAINT kennels_hidden_coherence_chk
      CHECK (
        (hidden_at IS NULL AND hidden_reason IS NULL)
        OR (hidden_at IS NOT NULL AND hidden_reason IS NOT NULL)
      );
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS kennels_hidden_at_idx
  ON public.kennels (hidden_at) WHERE hidden_at IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Función get_pedigree — sustituye o crea la versión que respeta hidden_at
-- ───────────────────────────────────────────────────────────────────────────
-- Versión defensiva: la función original no estaba versionada en migraciones
-- (debe estar definida en el panel de Supabase). Aquí la creamos/actualizamos
-- con la signature observada desde el código TypeScript: devuelve filas con
-- id, name, sex, registration, father_id, mother_id, generation, photo_url,
-- breed_name, color_name, slug. Añadimos columna is_hidden.
--
-- Para perros ocultos:
--  - name → '🔒 Perro oculto'
--  - photo_url → NULL
--  - registration → NULL
--  - breed_name → NULL  (preservamos color_name por si es relevante)
--  - slug → NULL  (no enlazable)
--  - father_id / mother_id → SE MANTIENEN (preservan el grafo)
--
-- Si el perro raíz está oculto, también devuelve placeholder (decidirá el
-- frontend si muestra 404 o vista admin).
--
-- DROP previo: la función ya existe en producción con un return type sin
-- la columna is_hidden / slug. Postgres no permite cambiar el return type
-- con CREATE OR REPLACE, así que hacemos DROP IF EXISTS antes.
DROP FUNCTION IF EXISTS public.get_pedigree(uuid, int);

CREATE OR REPLACE FUNCTION public.get_pedigree(dog_uuid uuid, max_gen int DEFAULT 5)
RETURNS TABLE (
  id           uuid,
  name         text,
  sex          text,
  registration text,
  father_id    uuid,
  mother_id    uuid,
  generation   int,
  photo_url    text,
  breed_name   text,
  color_name   text,
  slug         text,
  is_hidden    boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH RECURSIVE tree AS (
    SELECT
      d.id, d.name, d.sex, d.registration,
      d.father_id, d.mother_id,
      0::int AS generation,
      d.thumbnail_url AS photo_url,
      d.breed_id, d.color_id, d.slug,
      (d.hidden_at IS NOT NULL) AS is_hidden
    FROM public.dogs d
    WHERE d.id = dog_uuid

    UNION ALL

    SELECT
      d.id, d.name, d.sex, d.registration,
      d.father_id, d.mother_id,
      t.generation + 1,
      d.thumbnail_url,
      d.breed_id, d.color_id, d.slug,
      (d.hidden_at IS NOT NULL)
    FROM public.dogs d
    INNER JOIN tree t ON d.id = t.father_id OR d.id = t.mother_id
    WHERE t.generation < max_gen
  )
  SELECT DISTINCT ON (t.id)
    t.id,
    CASE WHEN t.is_hidden THEN 'Perro oculto'::text ELSE t.name END AS name,
    t.sex,
    CASE WHEN t.is_hidden THEN NULL ELSE t.registration END AS registration,
    t.father_id,
    t.mother_id,
    MIN(t.generation) OVER (PARTITION BY t.id) AS generation,
    CASE WHEN t.is_hidden THEN NULL ELSE t.photo_url END AS photo_url,
    CASE WHEN t.is_hidden THEN NULL ELSE b.name END AS breed_name,
    CASE WHEN t.is_hidden THEN NULL ELSE c.name END AS color_name,
    CASE WHEN t.is_hidden THEN NULL ELSE t.slug END AS slug,
    t.is_hidden
  FROM tree t
  LEFT JOIN public.breeds b ON b.id = t.breed_id
  LEFT JOIN public.colors c ON c.id = t.color_id
  ORDER BY t.id, t.generation ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_pedigree(uuid, int) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. search_dogs_balanced — excluir perros ocultos
-- ───────────────────────────────────────────────────────────────────────────
-- Reemplaza la función para garantizar que los perros ocultos no aparezcan
-- en la búsqueda pública. Si la función no existe (entornos nuevos), se crea.
-- DROP previo por si cambia el return type.
DROP FUNCTION IF EXISTS public.search_dogs_balanced(boolean, int, int);

CREATE OR REPLACE FUNCTION public.search_dogs_balanced(
  p_with_photo boolean DEFAULT true,
  p_offset int DEFAULT 0,
  p_limit int DEFAULT 24
)
RETURNS TABLE (
  id            uuid,
  name          text,
  slug          text,
  sex           text,
  thumbnail_url text,
  birth_date    date,
  breed_name    text,
  kennel_name   text,
  kennel_slug   text,
  rank_in_breed int,
  created_at    timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ranked AS (
    SELECT
      d.id, d.name, d.slug, d.sex, d.thumbnail_url, d.birth_date,
      b.name AS breed_name,
      k.name AS kennel_name,
      k.slug AS kennel_slug,
      ROW_NUMBER() OVER (
        PARTITION BY d.breed_id ORDER BY d.created_at DESC, d.id
      )::int AS rank_in_breed,
      d.created_at
    FROM public.dogs d
    LEFT JOIN public.breeds b ON b.id = d.breed_id
    LEFT JOIN public.kennels k
      ON k.id = d.kennel_id
     AND k.hidden_at IS NULL          -- excluye criaderos ocultos
    WHERE d.is_public = true
      AND d.hidden_at IS NULL          -- excluye perros ocultos
      AND CASE
        WHEN p_with_photo THEN d.thumbnail_url IS NOT NULL
        ELSE d.thumbnail_url IS NULL
      END
  )
  SELECT * FROM ranked
  ORDER BY rank_in_breed ASC, created_at DESC, id ASC
  OFFSET p_offset LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_dogs_balanced(boolean, int, int) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Comentarios para documentación viva
-- ───────────────────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.dogs.hidden_at IS
  'Soft-hide. Si NOT NULL, el perro no aparece en listados públicos; la genealogía sí lo muestra como placeholder. Reversible: SET hidden_at = NULL restaura.';
COMMENT ON COLUMN public.dogs.hidden_reason IS
  'Motivo de ocultación. Enumerado: rgpd_request, copyright, inaccurate, inappropriate, impersonation, animal_welfare, duplicate, owner_request, admin_decision, other.';
COMMENT ON COLUMN public.dogs.hidden_report_id IS
  'Referencia al content_reports.id que motivó la ocultación, si aplica.';

COMMENT ON COLUMN public.kennels.hidden_at IS
  'Soft-hide. Si NOT NULL, el criadero no aparece en listados públicos.';
COMMENT ON COLUMN public.kennels.hidden_reason IS
  'Motivo de ocultación. Mismo enumerado que dogs.';

COMMENT ON FUNCTION public.get_pedigree(uuid, int) IS
  'Devuelve la genealogía de un perro hasta max_gen generaciones. Los perros con hidden_at IS NOT NULL se devuelven con name="Perro oculto" y campos identificativos en NULL, preservando father_id/mother_id para no romper el grafo.';
