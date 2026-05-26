-- ═══════════════════════════════════════════════════════════════════════════
-- Revert: kennels.enabled_sections (descartado)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- La 20260621_kennel_enabled_sections.sql introdujo enabled_sections para
-- modelar "secciones toggleables inline" en el perfil. Tras revisión con el
-- usuario el approach correcto es OTRO: el perfil básico es una landing
-- única (sin toggles inline), y la web Kennel Pro será multi-página real
-- (no secciones de scroll). Para esa segunda iteración usaremos otra
-- columna (enabled_pages) con semántica de páginas, no de secciones.
--
-- Borramos la columna para no arrastrar deuda. La 20260621 deja de tener
-- efecto en runtime ya — esto es solo limpieza de schema.

ALTER TABLE public.kennels
  DROP COLUMN IF EXISTS enabled_sections;
