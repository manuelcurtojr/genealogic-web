-- ─────────────────────────────────────────────────────────────────────────
-- Rango de monta: la cubrición puede abarcar varios días
-- ─────────────────────────────────────────────────────────────────────────
-- Aclaración de la criadora (El Nieto): el parto se calcula desde la MONTA,
-- no desde el inicio del celo (son fechas distintas), y normalmente se cubre
-- a la perra varios días. Guardamos:
--   · mating_date      = primer día de monta (ya existía)
--   · mating_end_date  = último día de monta (NUEVO, opcional)
-- El parto previsto pasa a ser una ventana: [mating_date+63 .. mating_end_date+63].

ALTER TABLE heat_cycles
  ADD COLUMN IF NOT EXISTS mating_end_date date;

COMMENT ON COLUMN heat_cycles.mating_end_date IS
  'Último día de monta/cubrición si hubo varios. NULL = un solo día (mating_date). El parto previsto se calcula como ventana mating_date+63 .. mating_end_date+63.';
