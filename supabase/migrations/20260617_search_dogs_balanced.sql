-- ═══════════════════════════════════════════════════════════════════════════
-- search_dogs_balanced — listado de perros públicos con variedad de razas
-- ═══════════════════════════════════════════════════════════════════════════
--
-- /search sin filtros mostraba solo Galgo Italiano (los más recientes con
-- foto pertenecen al último import masivo). Esta función reordena con
-- ROW_NUMBER() PARTITION BY breed_id para INTERLEAR razas:
--
--   - Primero el perro más reciente de cada raza
--   - Luego el segundo más reciente de cada raza
--   - Etc.
--
-- Resultado: las primeras páginas muestran muchas razas distintas.
-- Paginación estable (mismo orden entre llamadas).
--
-- Solo aplica cuando NO hay filtros (q, breed, sex, for_sale). Si hay
-- filtros la query directa con ORDER BY created_at sirve perfectamente.

CREATE OR REPLACE FUNCTION public.search_dogs_balanced(
  p_with_photo boolean DEFAULT true,
  p_offset int DEFAULT 0,
  p_limit int DEFAULT 24
)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  sex text,
  thumbnail_url text,
  birth_date date,
  sale_price numeric,
  sale_currency text,
  sale_location text,
  is_for_sale boolean,
  breed_id uuid,
  breed_name text,
  kennel_id uuid,
  kennel_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      d.id, d.slug, d.name, d.sex, d.thumbnail_url, d.birth_date,
      d.sale_price, d.sale_currency, d.sale_location, d.is_for_sale,
      d.breed_id, b.name AS breed_name,
      d.kennel_id, k.name AS kennel_name,
      ROW_NUMBER() OVER (
        PARTITION BY d.breed_id
        ORDER BY d.created_at DESC
      ) AS rank_in_breed,
      d.created_at
    FROM public.dogs d
    LEFT JOIN public.breeds b ON b.id = d.breed_id
    LEFT JOIN public.kennels k ON k.id = d.kennel_id
    WHERE d.is_public = true
      AND CASE
        WHEN p_with_photo THEN d.thumbnail_url IS NOT NULL
        ELSE d.thumbnail_url IS NULL
      END
  )
  SELECT
    id, slug, name, sex, thumbnail_url, birth_date,
    sale_price, sale_currency, sale_location, is_for_sale,
    breed_id, breed_name, kennel_id, kennel_name
  FROM ranked
  ORDER BY rank_in_breed ASC, created_at DESC, id ASC
  OFFSET p_offset
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_dogs_balanced(boolean, int, int) TO anon, authenticated;

COMMENT ON FUNCTION public.search_dogs_balanced(boolean, int, int) IS
  'Búsqueda pública de perros interleaveada por raza (1 perro por raza, luego 2, etc.) para garantizar variedad cuando no hay filtros.';
