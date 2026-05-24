-- ═══════════════════════════════════════════════════════════════════════════
-- Slugs de perros — backfill histórico + auto-generación
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cobertura actual (snapshot 2026-05-25): 991/1366 perros con slug, 375 NULL.
-- Esos NULL hacen que sus URLs públicas sean UUIDs ilegibles. Este script:
--
--  1. Función `slugify(text)` — normaliza nombres a slugs URL-safe
--     (sin acentos, lowercase, separador '-', sin espacios consecutivos)
--  2. Función `unique_dog_slug(base, exclude_id)` — añade sufijo numérico
--     si choca con otro perro existente (-2, -3, ...)
--  3. Backfill: UPDATE de todos los dogs con slug NULL/vacío
--  4. Trigger BEFORE INSERT/UPDATE — si llega slug NULL/vacío, lo genera
--     desde `name` automáticamente
--
-- Resultado: TODO perro nuevo nace con slug. Ningún cambio en kennels (ya
-- tienen todos slug).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. slugify(text) — normalización URL-safe
-- ─────────────────────────────────────────────────────────────────────────────
-- Estrategia: lower → unaccent (necesita extensión, fallback manual) →
-- reemplazar no-alfanuméricos por '-' → colapsar '-' consecutivos → trim '-'

CREATE OR REPLACE FUNCTION public.slugify(p_input text)
RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
  s text;
BEGIN
  IF p_input IS NULL OR p_input = '' THEN RETURN ''; END IF;
  s := lower(trim(p_input));
  -- Normalización manual de acentos (evita depender de unaccent)
  s := translate(
    s,
    'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
    'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
  );
  -- Quitar comillas y caracteres especiales comunes
  s := regexp_replace(s, '[''"`´¨]', '', 'g');
  -- Reemplazar todo lo no alfanumérico por '-'
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  -- Colapsar '-' consecutivos
  s := regexp_replace(s, '-+', '-', 'g');
  -- Trim '-' del inicio/final
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  -- Limitar a 80 chars (margen para sufijo)
  IF length(s) > 80 THEN s := substring(s from 1 for 80); END IF;
  RETURN s;
END;
$$;

COMMENT ON FUNCTION public.slugify IS
  'Convierte texto a slug URL-safe: minúsculas, sin acentos, separador "-". Idempotente.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. unique_dog_slug(base, exclude_id) — añade sufijo si colisiona
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.unique_dog_slug(p_base text, p_exclude_id uuid DEFAULT NULL)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_candidate text := p_base;
  v_n int := 2;
BEGIN
  IF p_base IS NULL OR p_base = '' THEN
    -- Fallback: prefijo + 8 chars de uuid v4 nuevo
    RETURN 'perro-' || substring(gen_random_uuid()::text, 1, 8);
  END IF;
  WHILE EXISTS (
    SELECT 1 FROM dogs
    WHERE slug = v_candidate
      AND (p_exclude_id IS NULL OR id <> p_exclude_id)
  ) LOOP
    v_candidate := p_base || '-' || v_n;
    v_n := v_n + 1;
  END LOOP;
  RETURN v_candidate;
END;
$$;

COMMENT ON FUNCTION public.unique_dog_slug IS
  'Devuelve un slug único añadiendo -2, -3... si el base ya existe. Si exclude_id pasa, ignora ese dog (para updates).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. BACKFILL: rellenar todos los slug NULL/vacíos
-- ─────────────────────────────────────────────────────────────────────────────
-- Se hace en bucle para que cada generación use la unique_dog_slug() y vea
-- los slugs recién insertados en la misma transacción.

DO $$
DECLARE
  r RECORD;
  v_base text;
  v_final text;
BEGIN
  FOR r IN
    SELECT id, name FROM dogs
    WHERE slug IS NULL OR slug = ''
    ORDER BY created_at NULLS LAST
  LOOP
    v_base := public.slugify(coalesce(r.name, ''));
    v_final := public.unique_dog_slug(v_base, r.id);
    UPDATE dogs SET slug = v_final WHERE id = r.id;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGER auto-generate slug en INSERT/UPDATE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.dogs_ensure_slug()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_base text;
BEGIN
  -- Solo generar si slug llega NULL o vacío
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    v_base := public.slugify(coalesce(NEW.name, ''));
    NEW.slug := public.unique_dog_slug(v_base, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dogs_ensure_slug_trigger ON dogs;
CREATE TRIGGER dogs_ensure_slug_trigger
  BEFORE INSERT OR UPDATE OF slug ON dogs
  FOR EACH ROW EXECUTE FUNCTION public.dogs_ensure_slug();

COMMENT ON FUNCTION public.dogs_ensure_slug IS
  'BEFORE INSERT/UPDATE on dogs: si slug viene NULL o vacío, lo genera desde name automáticamente con uniqueness.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Índice único parcial sobre slug (si no existe ya)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS dogs_slug_unique_idx
  ON dogs(slug)
  WHERE slug IS NOT NULL AND slug <> '';
