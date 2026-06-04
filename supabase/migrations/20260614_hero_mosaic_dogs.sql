-- ═══════════════════════════════════════════════════════════════════════════
-- get_hero_mosaic_dogs() — 1 perro aleatorio por raza para el mosaico del hero
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Garantiza variedad visual: cada llamada devuelve N perros (default 12),
-- cada uno de una raza distinta, elegidos aleatoriamente dentro de su raza
-- y el conjunto de razas también aleatorio.
--
-- Sin esto, ORDER BY created_at DESC en page.tsx daba todos perros de la
-- raza del último import masivo (en el primer test: 300 galgos seguidos).

CREATE OR REPLACE FUNCTION public.get_hero_mosaic_dogs(p_limit int DEFAULT 12)
RETURNS TABLE (
  id uuid,
  thumbnail_url text,
  breed_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- 1) Por cada raza con perros públicos+foto, elegimos 1 perro al azar
  -- 2) Luego mezclamos las razas y tomamos p_limit
  WITH one_per_breed AS (
    SELECT DISTINCT ON (d.breed_id)
      d.id,
      d.thumbnail_url,
      b.name AS breed_name,
      d.breed_id
    FROM public.dogs d
    JOIN public.breeds b ON b.id = d.breed_id
    WHERE d.thumbnail_url IS NOT NULL
      AND d.is_public = true
      AND d.breed_id IS NOT NULL
      -- Actualizado 2026-06-04: SOLO fotos subidas a nuestro Storage (fotos
      -- reales de usuarios), no scrapes externos (grabados, watermarks, baja
      -- calidad). El hero queda con fotos de perros de alta calidad.
      AND d.thumbnail_url LIKE '%/storage/v1/%'
      AND d.deceased_at IS NULL
    ORDER BY d.breed_id, random()
  )
  SELECT id, thumbnail_url, breed_name
  FROM one_per_breed
  ORDER BY random()
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_hero_mosaic_dogs(int) TO anon, authenticated;

COMMENT ON FUNCTION public.get_hero_mosaic_dogs(int) IS
  'Devuelve N perros aleatorios garantizando 1 por raza distinta. Usado en el mosaico del hero de la home.';
