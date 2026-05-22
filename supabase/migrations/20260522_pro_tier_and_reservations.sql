-- ============================================================================
-- Pro tier infrastructure + reservations pipeline + owners (clientes)
-- 22 may 2026
--
-- Añade el concepto de "plan" al perfil (free | starter | pro | premium) y las
-- dos tablas clave del tier Pro: owners (clientes del criador) y
-- puppy_reservations (pipeline de reservas tipo Kanban).
--
-- Al final, marca al usuario propietario del kennel "Irema Curtó" como Pro
-- Founder para usar como usuario 0 de test.
-- ============================================================================

-- ─── 1. Plan en profiles ────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','starter','pro','premium')),
  ADD COLUMN IF NOT EXISTS plan_is_founder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_plan_idx ON profiles(plan);

-- ─── 2. Tabla owners (clientes del criador) ────────────────────────────────
CREATE TABLE IF NOT EXISTS owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES kennels(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  country text,
  id_doc_type text,
  id_doc_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS owners_kennel_id_idx ON owners(kennel_id);
CREATE INDEX IF NOT EXISTS owners_email_idx ON owners(email);

ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_select_kennel_owner" ON owners FOR SELECT
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "owners_insert_kennel_owner" ON owners FOR INSERT
  WITH CHECK (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "owners_update_kennel_owner" ON owners FOR UPDATE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "owners_delete_kennel_owner" ON owners FOR DELETE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));

-- Admin override (reusa helper is_admin() existente)
CREATE POLICY "owners_admin_all" ON owners FOR ALL USING (public.is_admin());

-- ─── 3. Tabla puppy_reservations (pipeline) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS puppy_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES kennels(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES owners(id) ON DELETE SET NULL,
  litter_id uuid REFERENCES litters(id) ON DELETE SET NULL,
  dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'interested'
    CHECK (status IN ('interested','waitlisted','deposit_paid','assigned','contract_signed','paid_in_full','delivered','cancelled')),
  preference_sex text CHECK (preference_sex IN ('male','female','any')),
  preference_color text,
  preference_notes text,
  deposit_amount_cents integer,
  total_price_cents integer,
  currency text NOT NULL DEFAULT 'EUR',
  deposit_paid_at timestamptz,
  contract_signed_at timestamptz,
  delivered_at timestamptz,
  position_in_queue integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS puppy_reservations_kennel_id_idx ON puppy_reservations(kennel_id);
CREATE INDEX IF NOT EXISTS puppy_reservations_status_idx ON puppy_reservations(status);
CREATE INDEX IF NOT EXISTS puppy_reservations_owner_id_idx ON puppy_reservations(owner_id);
CREATE INDEX IF NOT EXISTS puppy_reservations_litter_id_idx ON puppy_reservations(litter_id);

ALTER TABLE puppy_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_select_kennel_owner" ON puppy_reservations FOR SELECT
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "reservations_insert_kennel_owner" ON puppy_reservations FOR INSERT
  WITH CHECK (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "reservations_update_kennel_owner" ON puppy_reservations FOR UPDATE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "reservations_delete_kennel_owner" ON puppy_reservations FOR DELETE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));

CREATE POLICY "reservations_admin_all" ON puppy_reservations FOR ALL USING (public.is_admin());

-- ─── 4. Trigger updated_at ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS owners_set_updated_at ON owners;
CREATE TRIGGER owners_set_updated_at
  BEFORE UPDATE ON owners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS reservations_set_updated_at ON puppy_reservations;
CREATE TRIGGER reservations_set_updated_at
  BEFORE UPDATE ON puppy_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 5. Promover a Irema Curtó a Pro Founder ────────────────────────────────
-- Busca el kennel cuyo nombre contenga "Irema" y "Curt" y promueve a su owner.
-- Si no se encuentra, esto no falla — simplemente no hace nada.
UPDATE profiles
SET plan = 'pro',
    plan_is_founder = true,
    plan_started_at = now()
WHERE id IN (
  SELECT owner_id FROM kennels
  WHERE name ILIKE '%irema%curt%'
     OR name ILIKE '%irema curt%'
  LIMIT 1
);

SELECT 'Pro tier + owners + puppy_reservations OK · Irema Curtó marcada como Pro Founder';
