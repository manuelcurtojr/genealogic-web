-- ─────────────────────────────────────────────────────────────────────────
-- FASE 6 — Comparativa COI vs media de la raza
-- ─────────────────────────────────────────────────────────────────────────
-- Cachea la media de COI por raza (calculada sobre una muestra de perros con
-- ambos padres). Se recalcula de forma perezosa desde el endpoint
-- /api/breeds/[id]/coi-average cuando el valor falta o caduca (>7 días).
--
-- No calculamos el COI en SQL (el algoritmo de Wright vive en TS); aquí solo
-- guardamos el resultado agregado para no recomputarlo en cada visita.

CREATE TABLE IF NOT EXISTS breed_coi_stats (
  breed_id     uuid PRIMARY KEY REFERENCES breeds(id) ON DELETE CASCADE,
  avg_coi      numeric(6,2) NOT NULL DEFAULT 0,
  sample_size  integer NOT NULL DEFAULT 0,
  computed_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE breed_coi_stats IS
  'Media de COI por raza (muestra). Cache poblada de forma perezosa por /api/breeds/[id]/coi-average. avg_coi en % (0-100).';

-- Lectura pública (es un dato agregado, no sensible). Escritura solo service_role.
ALTER TABLE breed_coi_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "breed_coi_stats_read" ON breed_coi_stats;
CREATE POLICY "breed_coi_stats_read" ON breed_coi_stats
  FOR SELECT USING (true);
