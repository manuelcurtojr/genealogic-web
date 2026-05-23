-- Sistema de temas para webs custom de criadores.
--
-- Cada kennel elige un tema base (classic, bmw-m, etc.) que define una paleta
-- completa de tokens CSS. Opcionalmente puede sobreescribir colores específicos
-- desde la pestaña "General" del editor.
--
-- Los temas viven en código (src/lib/kennel/themes.ts), no en DB. La DB solo
-- guarda el ID elegido y los overrides puntuales.
--
-- theme_overrides estructura JSON:
-- {
--   "primary": "#E22718",      -- color primario (CTAs, acentos)
--   "accent":  "#0066B1",      -- color secundario (badges, líneas)
--   "canvas":  "#000000",      -- fondo principal
--   "ink":     "#ffffff"       -- texto principal
-- }
-- Cualquier clave omitida cae al valor del tema base.

ALTER TABLE kennels
  ADD COLUMN IF NOT EXISTS theme_id text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS theme_overrides jsonb;

COMMENT ON COLUMN kennels.theme_id IS
  'ID del tema visual aplicado a la web custom (/c/[slug]). Default: classic. Ver src/lib/kennel/themes.ts.';

COMMENT ON COLUMN kennels.theme_overrides IS
  'Overrides de colores sobre el tema base. JSON con keys primary/accent/canvas/ink. NULL = usar tema sin cambios.';

-- Índice mínimo para queries por tema (analytics futuro: qué tema usa más gente)
CREATE INDEX IF NOT EXISTS kennels_theme_id_idx ON kennels(theme_id);
