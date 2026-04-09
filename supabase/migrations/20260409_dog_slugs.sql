-- Add slug column to dogs for human-readable URLs
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_dogs_slug ON dogs(slug);

-- Backfill: generate slugs from existing dog names
-- Converts name to lowercase, removes accents, replaces spaces with hyphens
UPDATE dogs SET slug =
  regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(translate(name,
          'áàâãäåéèêëíìîïóòôõöúùûüýÿñçÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÝŸÑÇ',
          'aaaaaaeeeeiiiioooooouuuuyyncAAAAAAEEEEIIIIOOOOOUUUUYYNC'
        )),
        '[^a-z0-9\s-]', '', 'g'  -- remove special chars
      ),
      '\s+', '-', 'g'  -- spaces to hyphens
    ),
    '-+', '-', 'g'  -- collapse multiple hyphens
  )
WHERE slug IS NULL;

-- Handle duplicates by appending a suffix
DO $$
DECLARE
  r RECORD;
  counter INT;
  new_slug TEXT;
BEGIN
  FOR r IN
    SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
    FROM dogs
    WHERE slug IN (SELECT slug FROM dogs GROUP BY slug HAVING COUNT(*) > 1)
  LOOP
    IF r.rn > 1 THEN
      counter := r.rn;
      new_slug := r.slug || '-' || counter;
      -- Make sure the new slug is also unique
      WHILE EXISTS (SELECT 1 FROM dogs WHERE slug = new_slug AND id != r.id) LOOP
        counter := counter + 1;
        new_slug := r.slug || '-' || counter;
      END LOOP;
      UPDATE dogs SET slug = new_slug WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- Also add slug to kennels
ALTER TABLE kennels ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_kennels_slug ON kennels(slug);

UPDATE kennels SET slug =
  regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(translate(name,
          'áàâãäåéèêëíìîïóòôõöúùûüýÿñçÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÝŸÑÇ',
          'aaaaaaeeeeiiiioooooouuuuyyncAAAAAAEEEEIIIIOOOOOUUUUYYNC'
        )),
        '[^a-z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
WHERE slug IS NULL;
