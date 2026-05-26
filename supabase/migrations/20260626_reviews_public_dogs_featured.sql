-- ═══════════════════════════════════════════════════════════════════════════
-- Reseñas públicas + featured dogs + avatar upload
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 3 bloques:
--   A) kennel_reviews — distinguir manuales (sin badge) de las que dejan
--      usuarios logueados públicamente (badge "Cliente"/"Usuario").
--      Las públicas arrancan en is_visible=false (moderación owner).
--   B) dogs.featured_in_home — el criador marca hasta N perros que aparecen
--      primero en la home Pro (sección "Nuestros perros").
--   C) Endpoint público para newsletter subscribe — no necesita schema
--      nuevo, pero documentamos aquí que el insert debe tener default
--      is_active=true + source='public_signup'.

-- ── A) kennel_reviews extensiones ────────────────────────────────────
ALTER TABLE public.kennel_reviews
  ADD COLUMN IF NOT EXISTS submitted_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_manual boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.kennel_reviews.submitted_by_user_id IS
  'Si la reseña la dejó un usuario logueado, su user_id. Null si la añadió el criador manualmente (de Google, etc).';
COMMENT ON COLUMN public.kennel_reviews.is_manual IS
  'true = la añadió el criador manualmente (sin badge). false = la dejó un user logueado (badge Cliente o Usuario).';

-- Las reseñas legacy (Irema seed) son manuales — default true cubre eso.

-- ── B) dogs.featured_in_home ────────────────────────────────────────
ALTER TABLE public.dogs
  ADD COLUMN IF NOT EXISTS featured_in_home boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.dogs.featured_in_home IS
  'Si true, el criador quiere este perro en la sección destacados de su home pública. Si ningún perro está marcado, se usa orden automático por calidad de fotos.';

CREATE INDEX IF NOT EXISTS dogs_kennel_featured_idx
  ON public.dogs (kennel_id) WHERE featured_in_home = true;

-- ── Sin policies extra: kennel_reviews ya tiene SELECT pública +
-- owner ALL. Las INSERTs públicas las hace una server action (RLS las
-- valida via el owner_id check porque escribimos con createClient del user).
-- Pero el user que escribe NO es el owner — necesita una policy específica
-- para que un user logueado pueda INSERT con submitted_by_user_id=su uid.

DROP POLICY IF EXISTS "kennel_reviews_insert_user_logged" ON public.kennel_reviews;
CREATE POLICY "kennel_reviews_insert_user_logged"
  ON public.kennel_reviews
  FOR INSERT
  WITH CHECK (
    -- Permitimos al user logueado dejar una reseña SIEMPRE QUE sea él
    -- mismo el submitted_by_user_id y que la reseña arranque oculta
    -- (is_visible=false) y no manual (is_manual=false).
    auth.uid() IS NOT NULL
    AND submitted_by_user_id = auth.uid()
    AND is_manual = false
    AND is_visible = false
  );
