-- ─────────────────────────────────────────────────────────────────────────
-- Home discovery RPCs — datos para la nueva home
-- ─────────────────────────────────────────────────────────────────────────
-- Dos funciones que la home consume para:
--   1. Mosaico de razas representadas con un sample thumbnail por raza
--   2. Criaderos destacados con su perro estrella (más foto) y dog count

-- ── 1. get_home_top_breeds ──────────────────────────────────────────────
-- Top N razas por número de perros públicos, con UN thumbnail aleatorio
-- de muestra para mostrar la raza visualmente en el home.
CREATE OR REPLACE FUNCTION get_home_top_breeds(p_limit int DEFAULT 12)
RETURNS TABLE (
  id uuid,
  name text,
  dog_count bigint,
  sample_thumbnail text
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  -- Saco top 30 razas por count + miramos cuáles tienen thumbnail, luego
  -- priorizo las que tienen foto (los mosaicos vacíos quedan feos). Si
  -- aún quedan slots, completo con razas sin foto en orden de count.
  WITH ranked AS (
    SELECT b.id, b.name, COUNT(d.id) AS dog_count
    FROM breeds b
    LEFT JOIN dogs d ON d.breed_id = b.id AND d.is_public = true
    GROUP BY b.id, b.name
    HAVING COUNT(d.id) > 0
    ORDER BY COUNT(d.id) DESC
    LIMIT 30
  ),
  with_thumb AS (
    SELECT
      r.id,
      r.name,
      r.dog_count,
      (
        SELECT d.thumbnail_url
        FROM dogs d
        WHERE d.breed_id = r.id
          AND d.is_public = true
          AND d.thumbnail_url IS NOT NULL
        ORDER BY d.created_at DESC
        LIMIT 1
      ) AS sample_thumbnail
    FROM ranked r
  )
  SELECT *
  FROM with_thumb
  ORDER BY (sample_thumbnail IS NULL) ASC, dog_count DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_home_top_breeds(int) TO anon, authenticated;

-- ── 2. get_home_top_kennels ─────────────────────────────────────────────
-- Top criaderos por nº de perros públicos, con su perro más fotogénico
-- (el más reciente con foto) para ilustrar la card.
CREATE OR REPLACE FUNCTION get_home_top_kennels(p_limit int DEFAULT 6)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  city text,
  country text,
  dog_count bigint,
  hero_dog_thumbnail text,
  hero_dog_name text
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH top_kennels AS (
    SELECT k.id, k.name, k.slug, k.logo_url, k.city, k.country,
           COUNT(d.id) AS dog_count
    FROM kennels k
    LEFT JOIN dogs d ON d.kennel_id = k.id AND d.is_public = true
    WHERE k.logo_url IS NOT NULL
    GROUP BY k.id, k.name, k.slug, k.logo_url, k.city, k.country
    ORDER BY COUNT(d.id) DESC
    LIMIT p_limit
  )
  SELECT
    tk.id, tk.name, tk.slug, tk.logo_url, tk.city, tk.country, tk.dog_count,
    (
      SELECT d.thumbnail_url
      FROM dogs d
      WHERE d.kennel_id = tk.id
        AND d.is_public = true
        AND d.thumbnail_url IS NOT NULL
      ORDER BY d.created_at DESC
      LIMIT 1
    ) AS hero_dog_thumbnail,
    (
      SELECT d.name
      FROM dogs d
      WHERE d.kennel_id = tk.id
        AND d.is_public = true
        AND d.thumbnail_url IS NOT NULL
      ORDER BY d.created_at DESC
      LIMIT 1
    ) AS hero_dog_name
  FROM top_kennels tk
  ORDER BY tk.dog_count DESC;
$$;

GRANT EXECUTE ON FUNCTION get_home_top_kennels(int) TO anon, authenticated;
