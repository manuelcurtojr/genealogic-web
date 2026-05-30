-- ═══════════════════════════════════════════════════════════════════════════
-- kennel_breed_hero — el criador elige qué perro suyo es la imagen
-- "estrella" de cada raza que cría en la web Pro.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Usado en:
--   /kennels/[slug]/razas              (listado: card por raza)
--   /kennels/[slug]/razas/[breedSlug]  (ficha: hero grande)
--
-- Si NO hay registro para (kennel_id, breed_id), el sistema cae a su lógica
-- automática: primero busca un reproductor con foto, luego cualquier perro
-- del kennel de esa raza, y al final usa la foto genérica de la raza.
--
-- Con registro: respeta la elección del criador. Eso permite a Irema, por
-- ejemplo, fijar "Goya de Irema Curtó" como cara del Presa Canario aunque
-- haya 18 reproductores con foto.

CREATE TABLE IF NOT EXISTS kennel_breed_hero (
  kennel_id  uuid NOT NULL REFERENCES kennels(id) ON DELETE CASCADE,
  breed_id   uuid NOT NULL REFERENCES breeds(id)  ON DELETE CASCADE,
  -- El perro elegido para representar la raza en la web del kennel.
  -- Debe ser del propio kennel y de esa raza (no validamos por FK porque
  -- dogs.kennel_id puede cambiar; lo validamos en la capa de aplicación).
  dog_id     uuid NOT NULL REFERENCES dogs(id)    ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kennel_id, breed_id)
);

-- Index para lookups inversos (¿qué razas tiene marcadas un perro?)
CREATE INDEX IF NOT EXISTS kennel_breed_hero_dog_idx ON kennel_breed_hero (dog_id);

COMMENT ON TABLE kennel_breed_hero IS
  'Foto hero que el criador eligió para cada raza que cría en su web Pro. Sin registro, fallback automático.';
