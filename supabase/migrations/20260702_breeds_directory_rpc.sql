-- ═══════════════════════════════════════════════════════════════════════════
-- get_breeds_directory — TODAS las razas con dog_count real (sin truncar)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Reemplaza el patrón anterior en /razas/page.tsx que hacía:
--   dogs.select('breed_id').in('breed_id', ids).limit(1_000_000)
-- y se quedaba truncado a 1000 filas (PostgREST max_rows hard limit) —
-- por eso la página mostraba "1000 perros registrados" en vez de 270k+.
--
-- Esta función:
--   • Agrega los counts en SQL puro (un solo round-trip, no truncamiento)
--   • Devuelve sample_thumbnail por raza para el grid
--   • Marca si la raza tiene estándar Genealogic o solo fuentes oficiales
--   • Sólo perros is_public = true (consistente con el resto del sitio)

CREATE OR REPLACE FUNCTION get_breeds_directory()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  synonyms text[],
  image_url text,
  fci_number text,
  origin text,
  dog_count bigint,
  has_genealogic_standard boolean,
  has_sources boolean,
  sample_thumbnail text
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH counts AS (
    SELECT
      b.id,
      COUNT(d.id) FILTER (WHERE d.is_public = true) AS dog_count,
      (
        SELECT d2.thumbnail_url
        FROM dogs d2
        WHERE d2.breed_id = b.id
          AND d2.is_public = true
          AND d2.thumbnail_url IS NOT NULL
        ORDER BY d2.created_at DESC
        LIMIT 1
      ) AS sample_thumbnail
    FROM breeds b
    LEFT JOIN dogs d ON d.breed_id = b.id
    WHERE b.slug IS NOT NULL
    GROUP BY b.id
  )
  SELECT
    b.id,
    b.name,
    b.slug,
    b.synonyms,
    b.image_url,
    (b.standard_data->>'fci_number')::text AS fci_number,
    (b.standard_data->>'origin')::text AS origin,
    c.dog_count,
    (b.genealogic_standard IS NOT NULL
      AND jsonb_array_length(COALESCE(b.genealogic_standard->'sections', '[]'::jsonb)) > 0
    ) AS has_genealogic_standard,
    (b.standard_data IS NOT NULL
      AND jsonb_array_length(COALESCE(b.standard_data->'standards', '[]'::jsonb)) > 0
    ) AS has_sources,
    c.sample_thumbnail
  FROM breeds b
  JOIN counts c ON c.id = b.id
  WHERE b.slug IS NOT NULL
  ORDER BY c.dog_count DESC, b.name ASC;
$$;

GRANT EXECUTE ON FUNCTION get_breeds_directory() TO anon, authenticated;

COMMENT ON FUNCTION get_breeds_directory IS
  'Devuelve todas las razas con dog_count real agregado en SQL (no truncado a 1000 como hacía PostgREST). Usado por /razas. Ordenado por dog_count desc.';
