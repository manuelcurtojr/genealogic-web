-- ─────────────────────────────────────────────────────────────────────────
-- FASE 4 — Upscale de fotos con IA (Real-ESRGAN vía Replicate)
-- ─────────────────────────────────────────────────────────────────────────
-- Modelo de cuota:
--   · Kennel Pro / Enterprise (plan kennel | kennel_pro) → ILIMITADO
--   · Owner / Kennel Free (plan free)                    → 5 gratis (lifetime)
--
-- Contamos los upscales consumidos en un contador simple en profiles. El
-- enforcement real vive en el endpoint /api/dogs/[id]/upscale (server), que
-- comprueba el plan y este contador antes de llamar a Replicate.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS photo_upscales_used integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN profiles.photo_upscales_used IS
  'Nº de upscales de foto con IA consumidos. Solo limita a planes free (5 gratis); Pro/Enterprise es ilimitado y no incrementa.';

-- Marca por foto: si una foto ya fue mejorada con IA (para UI: ocultar el
-- botón / mostrar chip "Mejorada"). storage_path_original guarda la ruta de
-- la versión previa por si hay que revertir.
ALTER TABLE dog_photos
  ADD COLUMN IF NOT EXISTS upscaled_at timestamptz;
ALTER TABLE dog_photos
  ADD COLUMN IF NOT EXISTS storage_path_original text;

COMMENT ON COLUMN dog_photos.upscaled_at IS 'Fecha en que la foto se mejoró con IA (Real-ESRGAN). NULL = original.';
COMMENT ON COLUMN dog_photos.storage_path_original IS 'Ruta en storage de la versión previa al upscale (para revertir si hiciera falta).';
