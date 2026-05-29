-- ─────────────────────────────────────────────────────────────────────────
-- Flujo reproductivo completo: monta → gestación → parto
-- ─────────────────────────────────────────────────────────────────────────
-- Problema raíz (reportado por El Nieto / Malta): marcar "hubo cruce"
-- (was_mated) era un flag muerto — no guardaba fecha de monta ni disparaba
-- estado de gestación. Resultado: una perra montada salía "En reposo".
--
-- Solución: el celo guarda la FECHA de monta y un estado de preñez. El estado
-- "Gestante" se deriva de aquí (no hace falta crear una camada prematura;
-- la camada se crea al nacer, con el flujo de camadas existente).
--
--   pregnancy_status:
--     'none'      → no hubo cruce (default)
--     'suspected' → hubo monta, pendiente de confirmar preñez (~día 28)
--     'confirmed' → preñez confirmada → estado "Gestante" hasta parto (+63d)
--     'failed'    → confirmado que NO quedó preñada → vuelve a reposo

ALTER TABLE heat_cycles
  ADD COLUMN IF NOT EXISTS mating_date date;
ALTER TABLE heat_cycles
  ADD COLUMN IF NOT EXISTS pregnancy_status text NOT NULL DEFAULT 'none';

-- CHECK como constraint nombrada e idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'heat_cycles_pregnancy_status_chk'
  ) THEN
    ALTER TABLE heat_cycles
      ADD CONSTRAINT heat_cycles_pregnancy_status_chk
      CHECK (pregnancy_status IN ('none','suspected','confirmed','failed'));
  END IF;
END $$;

COMMENT ON COLUMN heat_cycles.mating_date IS 'Fecha de la monta/cubrición durante este celo. Base para calcular confirmación de preñez (+28d) y parto previsto (+63d).';
COMMENT ON COLUMN heat_cycles.pregnancy_status IS 'none | suspected (montada, sin confirmar) | confirmed (gestante) | failed (no preñada).';

-- Backfill: celos existentes con cruce marcado → "montada, pendiente de
-- confirmar", usando el inicio del celo como fecha de monta aproximada.
-- Esto hace que Malta (y cualquier perra ya montada) deje de salir "En reposo".
UPDATE heat_cycles
SET pregnancy_status = 'suspected',
    mating_date = COALESCE(mating_date, start_date)
WHERE was_mated = true AND pregnancy_status = 'none';

CREATE INDEX IF NOT EXISTS heat_cycles_pregnancy_idx
  ON heat_cycles (pregnancy_status) WHERE pregnancy_status IN ('suspected','confirmed');
