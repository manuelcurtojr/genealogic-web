-- AI upscaling support for dog thumbnails.
-- Adds backup column + timestamp for AI-restoration metadata.

ALTER TABLE dogs
  ADD COLUMN IF NOT EXISTS original_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_upscaled_at TIMESTAMPTZ;

COMMENT ON COLUMN dogs.original_thumbnail_url IS
  'Backup of original thumbnail before AI upscaling. NULL if never upscaled.';
COMMENT ON COLUMN dogs.thumbnail_upscaled_at IS
  'Timestamp when thumbnail_url was replaced by an AI-upscaled version.';

-- Helper for UI: any non-NULL means it was AI-restored
CREATE INDEX IF NOT EXISTS idx_dogs_ai_upscaled
  ON dogs (thumbnail_upscaled_at) WHERE thumbnail_upscaled_at IS NOT NULL;
