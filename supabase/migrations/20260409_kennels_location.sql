-- Add country and city columns to kennels table for location filtering
ALTER TABLE kennels ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE kennels ADD COLUMN IF NOT EXISTS city TEXT;

-- Index for country filtering
CREATE INDEX IF NOT EXISTS idx_kennels_country ON kennels(country);
