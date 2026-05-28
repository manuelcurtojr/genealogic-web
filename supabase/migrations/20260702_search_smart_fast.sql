-- ─────────────────────────────────────────────────────────────────────────
-- Search smart RPCs — fast path con operador <% (índice GIN trgm)
-- ─────────────────────────────────────────────────────────────────────────
-- Problema previo: las versiones anteriores filtraban con
--   WHERE search_text ILIKE '%q%' OR word_similarity(q, search_text) > 0.4
-- Postgres no usa el índice GIN trgm cuando hay un OR con función, así
-- que hacía Seq Scan completo de la tabla `dogs` (250k+ filas, ~730ms).
--
-- Fix: usar el operador `<%` (word_similarity con `pg_trgm.word_similarity_threshold`)
-- que SÍ es indexable por GIN trgm. Resultado esperado: <50ms para
-- cualquier query, sobre 250k dogs.
--
-- Además: priorizamos resultados con foto (thumbnail_url IS NOT NULL en
-- dogs, logo_url IS NOT NULL en kennels) para que el dropdown no quede
-- lleno de tarjetas con icono de placeholder.

-- ── 1. search_dogs_smart ────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.search_dogs_smart(text, integer);
CREATE OR REPLACE FUNCTION public.search_dogs_smart(q text, lim integer DEFAULT 8)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  sex text,
  thumbnail_url text,
  breed_name text,
  score real
)
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  -- q_norm: query normalizada (sin acentos, minúsculas) igual que search_text.
  -- Usamos `<%` como predicado: indexable y rápido.
  WITH q_norm AS (SELECT public.normalize_search_text(q) AS v)
  SELECT
    d.id, d.slug, d.name, d.sex, d.thumbnail_url, b.name AS breed_name,
    word_similarity((SELECT v FROM q_norm), d.search_text) AS score
  FROM public.dogs d
  LEFT JOIN public.breeds b ON b.id = d.breed_id
  WHERE (SELECT v FROM q_norm) <% d.search_text
    AND d.is_public = true
  -- Orden: 1) perros con foto primero, 2) score similarity, 3) nombre.
  ORDER BY
    (d.thumbnail_url IS NULL) ASC,
    word_similarity((SELECT v FROM q_norm), d.search_text) DESC,
    d.name ASC
  LIMIT lim;
$$;

GRANT EXECUTE ON FUNCTION public.search_dogs_smart(text, integer) TO anon, authenticated;

-- ── 2. search_kennels_smart ─────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.search_kennels_smart(text, integer);
CREATE OR REPLACE FUNCTION public.search_kennels_smart(q text, lim integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  logo_url text,
  city text,
  country text,
  score real
)
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  WITH q_norm AS (SELECT public.normalize_search_text(q) AS v)
  SELECT
    k.id, k.slug, k.name, k.logo_url, k.city, k.country,
    word_similarity((SELECT v FROM q_norm), k.search_text) AS score
  FROM public.kennels k
  WHERE (SELECT v FROM q_norm) <% k.search_text
  ORDER BY
    (k.logo_url IS NULL) ASC,
    word_similarity((SELECT v FROM q_norm), k.search_text) DESC,
    k.name ASC
  LIMIT lim;
$$;

GRANT EXECUTE ON FUNCTION public.search_kennels_smart(text, integer) TO anon, authenticated;

-- ── 3. search_breeds_smart ──────────────────────────────────────────────
-- Devuelve también `slug` (para link a /razas/{slug}) y un thumbnail de
-- muestra (1 perro público de la raza con foto, el más reciente). Esto
-- evita que las razas salgan sin imagen en el dropdown.
DROP FUNCTION IF EXISTS public.search_breeds_smart(text, integer);
CREATE OR REPLACE FUNCTION public.search_breeds_smart(q text, lim integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  sample_thumbnail text,
  dog_count bigint,
  score real
)
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  WITH q_norm AS (SELECT public.normalize_search_text(q) AS v),
  matches AS (
    SELECT
      br.id, br.slug, br.name,
      word_similarity((SELECT v FROM q_norm), br.search_text) AS score
    FROM public.breeds br
    WHERE (SELECT v FROM q_norm) <% br.search_text
    ORDER BY word_similarity((SELECT v FROM q_norm), br.search_text) DESC, br.name ASC
    LIMIT lim
  )
  SELECT
    m.id, m.slug, m.name,
    (
      SELECT d.thumbnail_url
      FROM public.dogs d
      WHERE d.breed_id = m.id AND d.is_public = true AND d.thumbnail_url IS NOT NULL
      ORDER BY d.created_at DESC
      LIMIT 1
    ) AS sample_thumbnail,
    (
      SELECT COUNT(*) FROM public.dogs d WHERE d.breed_id = m.id AND d.is_public = true
    ) AS dog_count,
    m.score
  FROM matches m
  ORDER BY m.score DESC, m.name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.search_breeds_smart(text, integer) TO anon, authenticated;
