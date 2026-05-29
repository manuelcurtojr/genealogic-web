-- ─────────────────────────────────────────────────────────────────────────
-- Vídeos en la galería del perro (dog_photos pasa a ser "media" unificada)
-- ─────────────────────────────────────────────────────────────────────────
-- Reutilizamos dog_photos para que los vídeos vivan en el MISMO slider,
-- ordenables junto a las fotos. Para un vídeo:
--   · media_type        = 'video'
--   · url               = PORTADA (imagen que se ve en el slider con el ▶)
--   · video_provider    = 'upload' | 'youtube' | 'vimeo'
--   · video_url         = fuente (URL del storage si es subido, o enlace YT/Vimeo)
--   · video_storage_path= ruta del archivo de vídeo subido (para borrarlo)
--   · storage_path      = ruta de la portada subida (para borrarla)

ALTER TABLE dog_photos ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'photo';
ALTER TABLE dog_photos ADD COLUMN IF NOT EXISTS video_provider text;
ALTER TABLE dog_photos ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE dog_photos ADD COLUMN IF NOT EXISTS video_storage_path text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dog_photos_media_type_chk') THEN
    ALTER TABLE dog_photos ADD CONSTRAINT dog_photos_media_type_chk CHECK (media_type IN ('photo','video'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dog_photos_video_provider_chk') THEN
    ALTER TABLE dog_photos ADD CONSTRAINT dog_photos_video_provider_chk
      CHECK (video_provider IS NULL OR video_provider IN ('upload','youtube','vimeo'));
  END IF;
END $$;

COMMENT ON COLUMN dog_photos.media_type IS 'photo | video. En video, url = portada y video_url = fuente.';
COMMENT ON COLUMN dog_photos.video_provider IS 'upload | youtube | vimeo (solo si media_type=video).';
COMMENT ON COLUMN dog_photos.video_url IS 'Fuente del vídeo: URL del storage (upload) o enlace YouTube/Vimeo.';
COMMENT ON COLUMN dog_photos.video_storage_path IS 'Ruta en storage del archivo de vídeo subido (para borrarlo).';
