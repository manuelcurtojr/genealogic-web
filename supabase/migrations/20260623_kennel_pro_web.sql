-- ═══════════════════════════════════════════════════════════════════════════
-- Web multi-página Kennel Pro: enabled_pages + about + kennel_photos
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Para Kennel Pro el perfil deja de ser "1 landing" y pasa a ser una web
-- con páginas reales navegables: Sobre nosotros, Instalaciones, Galería,
-- Blog (FAQ va embebida en la home, no es página propia).
--
-- Modelo:
--  - kennels.enabled_pages → qué páginas extra están activadas por el criador
--  - kennels.about_md       → texto largo de "Sobre nosotros"
--  - kennels.hero_image_url → foto grande opcional para el hero Pro
--  - kennel_photos          → fotos para galería + instalaciones (tabla nueva)
--
-- Regla de publicación (en código): una página solo se sirve al público si
-- está enabled Y tiene contenido suficiente (sobre = about_md no vacío,
-- galeria/instalaciones = >= 3 fotos, blog = >= 1 post publicado). En el
-- admin la página aparece igual para guiar al criador a llenarla.

-- Páginas extra de la web Pro. FAQ NO está aquí — vive en knowledge_entries
-- y se renderiza dentro de la home como bloque.
ALTER TABLE public.kennels
  ADD COLUMN IF NOT EXISTS enabled_pages jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS about_md text,
  ADD COLUMN IF NOT EXISTS hero_image_url text;

COMMENT ON COLUMN public.kennels.enabled_pages IS
  'Map de páginas extra activas en la web Pro. Ej: {"sobre":true,"galeria":true,"instalaciones":false,"blog":true}. La home, Nuestros perros y Contacto son siempre on.';
COMMENT ON COLUMN public.kennels.about_md IS
  'Texto largo "Sobre nosotros" en markdown ligero (renderizado conservador, sin HTML arbitrario).';
COMMENT ON COLUMN public.kennels.hero_image_url IS
  'Imagen grande opcional para el hero de la home Pro. URL pública (Supabase storage o externa). Si null se usa gradient + glow.';

-- ─── kennel_photos ─────────────────────────────────────────────────────
-- Fotos para galería y instalaciones. Se gestiona desde el panel admin
-- del kennel. URL pública (Supabase Storage) + posición para ordenar.

CREATE TABLE IF NOT EXISTS public.kennel_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id       uuid NOT NULL REFERENCES public.kennels(id) ON DELETE CASCADE,
  -- 'gallery' = fotos generales del criadero; 'facilities' = instalaciones
  kind            text NOT NULL CHECK (kind IN ('gallery', 'facilities')),
  url             text NOT NULL,
  storage_path    text,
  caption         text,
  -- Orden de aparición. Menor = primero. NULL = al final, orden created_at.
  position        integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kennel_photos_kennel_kind_idx
  ON public.kennel_photos (kennel_id, kind, position NULLS LAST, created_at);

-- RLS: lectura pública (las fotos van en la web pública del criadero).
-- Escritura solo por el owner del kennel (vía Storage policies + server actions
-- con admin client).
ALTER TABLE public.kennel_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kennel_photos_select_public" ON public.kennel_photos;
CREATE POLICY "kennel_photos_select_public"
  ON public.kennel_photos
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "kennel_photos_insert_owner" ON public.kennel_photos;
CREATE POLICY "kennel_photos_insert_owner"
  ON public.kennel_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kennels k
      WHERE k.id = kennel_photos.kennel_id AND k.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "kennel_photos_update_owner" ON public.kennel_photos;
CREATE POLICY "kennel_photos_update_owner"
  ON public.kennel_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.kennels k
      WHERE k.id = kennel_photos.kennel_id AND k.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "kennel_photos_delete_owner" ON public.kennel_photos;
CREATE POLICY "kennel_photos_delete_owner"
  ON public.kennel_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.kennels k
      WHERE k.id = kennel_photos.kennel_id AND k.owner_id = auth.uid()
    )
  );

-- ─── Backfill Irema (enterprise) ───────────────────────────────────────
-- Activa todas las páginas extra para que el día del deploy ya tenga
-- "todo el sitio" listo aunque algunas estén vacías (admin las llenará).
UPDATE public.kennels
SET enabled_pages = jsonb_build_object(
  'sobre',         true,
  'instalaciones', true,
  'galeria',       true,
  'blog',          true
)
WHERE id = '9675883f-f47e-4c51-bd5d-7fc2c6242963';
