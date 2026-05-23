-- Permite al criador decidir qué ven los visitantes que llegan a la URL
-- pública de su criadero: el perfil estándar de Genealogic (catálogo
-- automático) o su web personalizada hecha con el builder.
--
-- Es un incentivo claro para upgrade a Pro: "tu URL lleva directo a
-- tu marca, no al template genérico".

ALTER TABLE kennels
  ADD COLUMN IF NOT EXISTS default_public_view text
    NOT NULL DEFAULT 'standard'
    CHECK (default_public_view IN ('standard', 'custom_web'));

COMMENT ON COLUMN kennels.default_public_view IS
  'Qué ven los visitantes al llegar a /kennels/[slug]: standard = perfil Genealogic, custom_web = redirect a /c/[slug]. Solo aplica si hay web publicada (kennel_pages con slug=home enabled).';
