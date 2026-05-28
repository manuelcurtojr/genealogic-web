-- Imagen representativa por raza (Wikimedia Commons normalmente) para
-- usar en OpenGraph/Twitter cards al compartir /razas/{slug}.

ALTER TABLE breeds
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_attribution TEXT;

COMMENT ON COLUMN breeds.image_url IS 'URL pública de imagen representativa de la raza (Wikimedia Commons normalmente). Usada para OG/Twitter cards.';
COMMENT ON COLUMN breeds.image_attribution IS 'Atribución legal de la imagen (autor + licencia CC).';
