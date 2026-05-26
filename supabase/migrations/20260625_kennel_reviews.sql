-- ═══════════════════════════════════════════════════════════════════════════
-- kennel_reviews — reseñas de clientes que se muestran en la home Pro
-- ═══════════════════════════════════════════════════════════════════════════
--
-- El criador las gestiona desde /kennel/contenido/resenas. Cada reseña
-- tiene autor (nombre + opcional foto), texto, rating opcional (1-5),
-- fecha y un flag is_visible para que el criador pueda ocultar sin borrar.

CREATE TABLE IF NOT EXISTS public.kennel_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id   uuid NOT NULL REFERENCES public.kennels(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar_url text,
  body        text NOT NULL,
  rating      integer CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  is_visible  boolean NOT NULL DEFAULT true,
  position    integer,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kennel_reviews_kennel_visible_idx
  ON public.kennel_reviews (kennel_id, is_visible, position NULLS LAST, created_at DESC);

ALTER TABLE public.kennel_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kennel_reviews_select_public" ON public.kennel_reviews;
CREATE POLICY "kennel_reviews_select_public"
  ON public.kennel_reviews
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "kennel_reviews_owner_all" ON public.kennel_reviews;
CREATE POLICY "kennel_reviews_owner_all"
  ON public.kennel_reviews
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.kennels k WHERE k.id = kennel_reviews.kennel_id AND k.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.kennels k WHERE k.id = kennel_reviews.kennel_id AND k.owner_id = auth.uid())
  );

-- Seed Irema con 2-3 reseñas de ejemplo para que su home Pro no esté vacía
INSERT INTO public.kennel_reviews (kennel_id, author_name, body, rating, position)
SELECT
  '9675883f-f47e-4c51-bd5d-7fc2c6242963'::uuid, t.author_name, t.body, t.rating, t.position
FROM (VALUES
  ('Familia García (Madrid)', 'Trajimos a Tara con 8 semanas y desde el primer día se notó la calidad del criadero. Equilibrada, sana, con un carácter increíble. Manuel e Irema acompañan después de la venta como nadie.', 5, 10),
  ('Carlos M. (Barcelona)',   'Llevábamos años buscando un Presa Canario de verdad y no encontrábamos ninguno que cumpliera el estándar antiguo. En Irema Curtó encontramos exactamente lo que buscábamos. Cinco décadas no se improvisan.', 5, 20),
  ('Lucía R. (Tenerife)',     'Las instalaciones, el seguimiento, la transparencia con la genealogía. Todo a otro nivel. Repetiré sin dudarlo cuando llegue el momento del segundo.', 5, 30)
) AS t(author_name, body, rating, position)
WHERE NOT EXISTS (
  SELECT 1 FROM public.kennel_reviews
  WHERE kennel_id = '9675883f-f47e-4c51-bd5d-7fc2c6242963'::uuid
);
