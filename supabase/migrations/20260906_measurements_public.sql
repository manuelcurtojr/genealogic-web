-- Publicar medidas morfológicas en el perfil público del perro.
--
-- Flag por perro (no por tanda): el dueño decide si su ficha morfométrica
-- (dog_measurements, ver 20260726_dog_measurements.sql) se muestra en la
-- pestaña "Medidas" del perfil público. Por defecto PRIVADAS.
--
-- No se toca la RLS de dog_measurements (sigue siendo owner-only): el perfil
-- las lee en el servidor con service-role SOLO cuando measurements_public=true
-- (o el que mira es el dueño). Así un anónimo nunca lee la tabla directamente.

ALTER TABLE dogs
  ADD COLUMN IF NOT EXISTS measurements_public boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN dogs.measurements_public IS
  'Si true, la ficha morfométrica (dog_measurements) se muestra en el perfil público del perro.';
