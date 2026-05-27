-- Slug column for /razas/[slug] public URLs.
-- URL-friendly identifier derived from name (ascii, lowercase, hyphens).

ALTER TABLE breeds ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_breeds_slug ON breeds(slug);

-- Populate slug for existing rows (idempotent — only sets if NULL).
UPDATE breeds SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRANSLATE(name, 'áéíóúñÁÉÍÓÚÑÜüç', 'aeiounAEIOUNUuc'),
      '[^a-zA-Z0-9]+', '-', 'g'
    ),
    '(^-|-$)', '', 'g'
  )
)
WHERE slug IS NULL;

COMMENT ON COLUMN breeds.slug IS 'URL-friendly identifier for /razas/[slug] public pages.';
