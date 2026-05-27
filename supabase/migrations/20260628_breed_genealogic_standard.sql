-- Estándar canónico de Genealogic + diferencias entre clubes.
-- Reinterpretación estructurada de las fuentes oficiales (FCI, RSCE, AKC,
-- KC, ENCI) en 12 secciones fijas, con disclaimer en frontend.

ALTER TABLE breeds
  ADD COLUMN IF NOT EXISTS genealogic_standard JSONB,
  ADD COLUMN IF NOT EXISTS club_differences JSONB;

COMMENT ON COLUMN breeds.genealogic_standard IS
  'Estándar canónico de Genealogic — 12 secciones fijas. Estructura: {sections: [{key, title, content}]}';

COMMENT ON COLUMN breeds.club_differences IS
  'Diferencias entre clubes. Estructura: {differences: [{topic, items: [{entity, position}]}]}';
