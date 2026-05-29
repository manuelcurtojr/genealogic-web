-- ─────────────────────────────────────────────────────────────────────────
-- Días de monta exactos (lista) en vez de solo primera/última
-- ─────────────────────────────────────────────────────────────────────────
-- La criadora quiere apuntar TODOS los días en que se cubrió a la perra
-- (suelen ser varios: día 0, +2, +4...). Guardamos la lista completa y
-- mantenemos mating_date (mínimo) y mating_end_date (máximo) sincronizados
-- para que el cálculo de la ventana de parto (mating_date+63 .. end+63) y
-- todo lo que ya lee esos campos siga funcionando sin cambios.

ALTER TABLE heat_cycles
  ADD COLUMN IF NOT EXISTS mating_dates date[];

COMMENT ON COLUMN heat_cycles.mating_dates IS
  'Lista de días exactos de monta/cubrición. mating_date = min(mating_dates), mating_end_date = max(mating_dates) se mantienen sincronizados (los pone la app al guardar).';

-- Backfill: celos ya montados → inicializa el array con las fechas que había.
UPDATE heat_cycles
SET mating_dates = (
  CASE
    WHEN mating_end_date IS NOT NULL AND mating_end_date <> mating_date
      THEN ARRAY[mating_date, mating_end_date]
    ELSE ARRAY[mating_date]
  END
)
WHERE was_mated = true AND mating_date IS NOT NULL AND mating_dates IS NULL;
