-- ─────────────────────────────────────────────────────────────────────────
-- Backfill: hembras con celos/camadas → reproductoras
-- ─────────────────────────────────────────────────────────────────────────
-- A partir de ahora el calendario reproductivo (/reproduccion) solo muestra
-- hembras marcadas como reproductoras (dogs.is_reproductive = true, el ❤ de
-- Mis Perros). Sin este backfill, las hembras que la criadora YA gestionaba
-- (con celos registrados o camadas) desaparecerían de la vista.
--
-- Criterio: si una hembra tiene al menos un celo o una camada como madre,
-- es reproductora de facto → la marcamos. Solo AÑADE la marca (nunca quita),
-- es idempotente y seguro de re-ejecutar.

UPDATE dogs d
SET is_reproductive = true
WHERE d.sex = 'female'
  AND d.is_reproductive IS NOT TRUE
  AND (
    EXISTS (SELECT 1 FROM heat_cycles hc WHERE hc.dog_id = d.id)
    OR EXISTS (SELECT 1 FROM litters l WHERE l.mother_id = d.id)
  );
