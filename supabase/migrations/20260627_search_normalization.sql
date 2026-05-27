-- ═══════════════════════════════════════════════════════════════════════════
-- Búsqueda global tolerante a apóstrofes, acentos y mayúsculas
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Problema reportado: buscar "Sirio de Largenteria" no encuentra
-- "Sirio de l'Argenteria" porque el ILIKE literal no ignora el apóstrofe.
-- Misma cosa con acentos ("perez" ≠ "Pérez") y mayúsculas (parcialmente
-- ya cubierto por ILIKE pero queremos consistencia).
--
-- Solución: columna generada `search_text` con la versión normalizada del
-- nombre (lower + unaccent + sin caracteres no-alfanuméricos), e índice
-- GIN trigram para que ILIKE sobre 230k+ filas siga siendo rápido.
--
-- Aplica a dogs, kennels y breeds — las 3 tablas que consulta el header.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── dogs ──────────────────────────────────────────────────────────────────
-- search_text = lower(unaccent(name)) sin caracteres no alfanuméricos
-- (apóstrofes, comas, guiones, paréntesis…). Espacios SE MANTIENEN.
--
-- IMMUTABLE wrapper sobre unaccent porque unaccent('public.unaccent', x) por
-- defecto es STABLE — las columnas GENERATED requieren funciones IMMUTABLE.
CREATE OR REPLACE FUNCTION public.normalize_search_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT regexp_replace(
    lower(unaccent('public.unaccent', input)),
    '[^a-z0-9 ]+',
    ' ',
    'g'
  )
$$;

ALTER TABLE public.dogs
  ADD COLUMN IF NOT EXISTS search_text text
  GENERATED ALWAYS AS (public.normalize_search_text(name)) STORED;

CREATE INDEX IF NOT EXISTS dogs_search_text_trgm_idx
  ON public.dogs USING gin (search_text gin_trgm_ops);

-- ─── kennels ───────────────────────────────────────────────────────────────
ALTER TABLE public.kennels
  ADD COLUMN IF NOT EXISTS search_text text
  GENERATED ALWAYS AS (public.normalize_search_text(name)) STORED;

CREATE INDEX IF NOT EXISTS kennels_search_text_trgm_idx
  ON public.kennels USING gin (search_text gin_trgm_ops);

-- ─── breeds ────────────────────────────────────────────────────────────────
ALTER TABLE public.breeds
  ADD COLUMN IF NOT EXISTS search_text text
  GENERATED ALWAYS AS (public.normalize_search_text(name)) STORED;

CREATE INDEX IF NOT EXISTS breeds_search_text_trgm_idx
  ON public.breeds USING gin (search_text gin_trgm_ops);

-- ─── verificación rápida ──────────────────────────────────────────────────
-- (sale en logs del db query si pasa)
DO $$
DECLARE
  sample text;
BEGIN
  SELECT search_text INTO sample FROM public.dogs WHERE name = 'Sirio de l''Argenteria' LIMIT 1;
  IF sample IS NULL THEN
    RAISE NOTICE 'search_text de Sirio aún no poblada (la columna se rellena async)';
  ELSE
    RAISE NOTICE 'search_text ejemplo: % → %', 'Sirio de l''Argenteria', sample;
  END IF;
END $$;
