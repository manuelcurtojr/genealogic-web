-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint 2 — Performance indexes en dogs (y aledañas)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- La tabla `dogs` tiene 230k+ filas pero el único índice no-parcial sobre
-- una FK es `dogs_pkey`. Cada query por kennel_id/owner_id/breed_id hace
-- sequential scan. Esto se nota especialmente en:
--   · /kennels/[slug] (filtra por kennel_id, una vez ya cacheado pero
--     fresh queries siguen siendo lentas)
--   · /mis-perros (filtra por owner_id del cliente final)
--   · pedigree tree y dog form panel (recorre father_id/mother_id)
--   · /search y RPCs (filtran por breed_id + is_public)
--   · trigger transfer_dog_on_reservation_delivered (WHERE id, ya OK por pk)
--
-- Idempotente. CREATE INDEX IF NOT EXISTS.

-- Indices más críticos primero (orden de impacto):
CREATE INDEX IF NOT EXISTS dogs_kennel_id_idx
  ON public.dogs (kennel_id)
  WHERE kennel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS dogs_owner_id_idx
  ON public.dogs (owner_id)
  WHERE owner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS dogs_breed_id_idx
  ON public.dogs (breed_id)
  WHERE breed_id IS NOT NULL;

-- Pedigree traversal: father_id / mother_id usados en pedigree-tree y
-- offspring queries. Parcial (la mayoría de dogs tienen padres).
CREATE INDEX IF NOT EXISTS dogs_father_id_idx
  ON public.dogs (father_id)
  WHERE father_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS dogs_mother_id_idx
  ON public.dogs (mother_id)
  WHERE mother_id IS NOT NULL;

-- Listados públicos: combinación frecuente para search/discovery.
CREATE INDEX IF NOT EXISTS dogs_is_public_thumbnail_idx
  ON public.dogs (is_public, thumbnail_url)
  WHERE is_public = true AND thumbnail_url IS NOT NULL;

-- Indices que ayudan a otras tablas relacionadas:

-- dog_photos.dog_id es FK pero sin índice (lo usa el sort 3-tier y
-- cualquier listado de fotos por perro).
CREATE INDEX IF NOT EXISTS dog_photos_dog_id_idx
  ON public.dog_photos (dog_id);

-- puppy_reservations queries por kennel + status (pipeline)
CREATE INDEX IF NOT EXISTS puppy_reservations_kennel_status_idx
  ON public.puppy_reservations (kennel_id, status);

-- client_user_id para /mis-reservas (cliente ve sus reservas)
CREATE INDEX IF NOT EXISTS puppy_reservations_client_user_idx
  ON public.puppy_reservations (client_user_id)
  WHERE client_user_id IS NOT NULL;

-- litters.kennel_id / owner_id usados en home y pipeline
CREATE INDEX IF NOT EXISTS litters_kennel_id_idx
  ON public.litters (kennel_id)
  WHERE kennel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS litters_owner_id_idx
  ON public.litters (owner_id)
  WHERE owner_id IS NOT NULL;

-- kennel_photos por kennel_id (galería + facilities listings)
CREATE INDEX IF NOT EXISTS kennel_photos_kennel_kind_idx
  ON public.kennel_photos (kennel_id, kind);

-- (kennel_breeds no existe en este schema — las razas viven en
--  kennels.breed_ids como array de UUIDs. Sin índice apropiado para
--  array search; aceptable porque el array es típicamente <5 elementos.)
