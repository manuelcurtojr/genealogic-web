-- ============================================================================
-- Port del web builder de Pawdoq Breeders a Genealogic — 22 may 2026
--
-- Sustituye la kennel_pages simple (markdown) por el schema Pawdoq:
--   - kennel_pages: 8 páginas troncales con sections jsonb (tipo Elementor)
--   - kennel_posts: blog con body JSON (TipTap)
--   - kennel_post_categories: categorías del blog
--
-- Scope adaptado: tenant_id → kennel_id. RLS por kennel owner.
-- ============================================================================

-- 1. Drop kennel_pages simple (no tiene contenido aún)
DROP TABLE IF EXISTS public.kennel_pages CASCADE;

-- 2. Recrear kennel_pages con schema Pawdoq adaptado
CREATE TABLE public.kennel_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES public.kennels(id) ON DELETE CASCADE,
  slug text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  nav_label text,
  nav_order int NOT NULL DEFAULT 0,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  draft_sections jsonb,
  sections_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  meta_title text,
  meta_description text,
  meta_i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  translations_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kennel_id, slug),
  CONSTRAINT kennel_pages_slug_check CHECK (
    slug IN ('home', 'perros', 'razas', 'historia', 'servicios', 'instalaciones', 'galeria', 'blog', 'contacto')
  )
);

CREATE INDEX kennel_pages_kennel_idx ON public.kennel_pages (kennel_id);

ALTER TABLE public.kennel_pages ENABLE ROW LEVEL SECURITY;

-- Lectura pública (la web es pública)
CREATE POLICY "kennel_pages_read_public" ON public.kennel_pages FOR SELECT USING (true);

-- Escritura solo dueño del kennel
CREATE POLICY "kennel_pages_write_owner" ON public.kennel_pages FOR ALL
  USING (kennel_id IN (SELECT id FROM public.kennels WHERE owner_id = auth.uid()))
  WITH CHECK (kennel_id IN (SELECT id FROM public.kennels WHERE owner_id = auth.uid()));

CREATE POLICY "kennel_pages_admin_all" ON public.kennel_pages FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS kennel_pages_set_updated_at ON public.kennel_pages;
CREATE TRIGGER kennel_pages_set_updated_at BEFORE UPDATE ON public.kennel_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. kennel_posts — blog
CREATE TABLE IF NOT EXISTS public.kennel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES public.kennels(id) ON DELETE CASCADE,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','scheduled')),
  published_at timestamptz,
  scheduled_for timestamptz,
  cover_image_url text,
  cover_image_alt text,
  title text NOT NULL,
  excerpt text,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  body_text text,
  author_name text,
  author_avatar_url text,
  reading_time_minutes int,
  category_slug text,
  tags text[],
  seo_title text,
  seo_description text,
  i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  views_count int NOT NULL DEFAULT 0,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kennel_id, slug)
);

CREATE INDEX IF NOT EXISTS kennel_posts_kennel_idx ON public.kennel_posts (kennel_id);
CREATE INDEX IF NOT EXISTS kennel_posts_published_idx
  ON public.kennel_posts (kennel_id, published_at DESC)
  WHERE status = 'published';

ALTER TABLE public.kennel_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kennel_posts_read_public" ON public.kennel_posts FOR SELECT
  USING (status = 'published' OR kennel_id IN (
    SELECT id FROM public.kennels WHERE owner_id = auth.uid()
  ));
CREATE POLICY "kennel_posts_write_owner" ON public.kennel_posts FOR ALL
  USING (kennel_id IN (SELECT id FROM public.kennels WHERE owner_id = auth.uid()))
  WITH CHECK (kennel_id IN (SELECT id FROM public.kennels WHERE owner_id = auth.uid()));
CREATE POLICY "kennel_posts_admin_all" ON public.kennel_posts FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS kennel_posts_set_updated_at ON public.kennel_posts;
CREATE TRIGGER kennel_posts_set_updated_at BEFORE UPDATE ON public.kennel_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. kennel_post_categories
CREATE TABLE IF NOT EXISTS public.kennel_post_categories (
  kennel_id uuid NOT NULL REFERENCES public.kennels(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kennel_id, slug)
);

ALTER TABLE public.kennel_post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kennel_post_cats_read_public" ON public.kennel_post_categories FOR SELECT USING (true);
CREATE POLICY "kennel_post_cats_write_owner" ON public.kennel_post_categories FOR ALL
  USING (kennel_id IN (SELECT id FROM public.kennels WHERE owner_id = auth.uid()))
  WITH CHECK (kennel_id IN (SELECT id FROM public.kennels WHERE owner_id = auth.uid()));

SELECT 'Web builder Pawdoq port OK';
