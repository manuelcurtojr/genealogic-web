-- ─────────────────────────────────────────────────────────────────────────
-- FASE 5 — Vincular cada cachorro a su camada (litter_id en dogs)
-- ─────────────────────────────────────────────────────────────────────────
-- Hasta ahora, al crear un cachorro desde una camada solo se copiaban los
-- padres y el afijo (breeder_id), pero el perro NO quedaba enlazado a la
-- camada concreta. Resultado: cachorros de camadas distintas (mismos padres,
-- distinta fecha) se mezclaban. Con litter_id quedan diferenciados.

ALTER TABLE dogs
  ADD COLUMN IF NOT EXISTS litter_id uuid REFERENCES litters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dogs_litter_id
  ON dogs (litter_id) WHERE litter_id IS NOT NULL;

COMMENT ON COLUMN dogs.litter_id IS
  'Camada de la que proviene el cachorro (NULL si no se creó desde una camada). Permite diferenciar cachorros de camadas distintas con los mismos padres.';
