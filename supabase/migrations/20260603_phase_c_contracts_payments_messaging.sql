-- ═══════════════════════════════════════════════════════════════════════════
-- Panel del Propietario — Fase C: contratos + pagos + mensajería + papeles
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Bloques:
--  1. kennels.stripe_account_id / stripe_account_status  (Stripe Connect)
--  2. reservation_contracts  (rich text + firma cliente/criador)
--  3. reservation_payments   (N pagos por reserva, Stripe Connect o manual)
--  4. reservation_messages   (chat bidireccional + import histórico email)
--  5. dog_documents          (papeles del perro: cartilla, vacunas, contrato firmado)
--  6. Extender link_user_to_existing_records: al crear cuenta, también
--     transferir dogs de reservas ya entregadas (que se quedaron sin transfer
--     porque el client_user_id era NULL en el momento del delivery).
--
-- Idempotente. Compatible con campos legacy:
--   puppy_reservations.reservation_contract_url / purchase_contract_url
--   puppy_reservations.contract_signed_at / reservation_signed_at
--   puppy_reservations.deposit_paid_at / paid_in_full_at
-- Se preservan; la fuente de verdad nueva vive en las tablas dedicadas.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. STRIPE CONNECT EN KENNELS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE kennels
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_account_status text NOT NULL DEFAULT 'none'
    CHECK (stripe_account_status IN ('none','onboarding','active','restricted'));

COMMENT ON COLUMN kennels.stripe_account_id IS
  'Stripe Connected Account ID (acct_xxx). NULL = criador no conectó Stripe todavía.';
COMMENT ON COLUMN kennels.stripe_account_status IS
  'Estado del onboarding: none|onboarding|active|restricted. Se actualiza vía webhook account.updated.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. reservation_contracts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservation_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL UNIQUE REFERENCES puppy_reservations(id) ON DELETE CASCADE,
  kennel_id uuid NOT NULL REFERENCES kennels(id) ON DELETE CASCADE,

  -- Contenido editable
  title text NOT NULL DEFAULT 'Contrato de compraventa',
  body_html text NOT NULL DEFAULT '',
  body_json jsonb,                -- TipTap JSON nativo, para edición posterior

  -- Workflow
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','signed_partial','signed_full','cancelled')),
  sent_at timestamptz,

  -- Firma del criador
  signed_at_breeder timestamptz,
  signature_breeder_name text,
  signature_breeder_ip inet,

  -- Firma del cliente
  signed_at_client timestamptz,
  signature_client_name text,
  signature_client_ip inet,

  -- Snapshot inmutable post-firma (PDF generado al firmar)
  pdf_url text,
  pdf_generated_at timestamptz,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservation_contracts_reservation ON reservation_contracts(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_contracts_kennel ON reservation_contracts(kennel_id);
CREATE INDEX IF NOT EXISTS idx_reservation_contracts_status ON reservation_contracts(status);

DROP TRIGGER IF EXISTS reservation_contracts_set_updated_at ON reservation_contracts;
CREATE TRIGGER reservation_contracts_set_updated_at
  BEFORE UPDATE ON reservation_contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE reservation_contracts ENABLE ROW LEVEL SECURITY;

-- Cliente: lee su propio contrato
DROP POLICY IF EXISTS contracts_select_client ON reservation_contracts;
CREATE POLICY contracts_select_client ON reservation_contracts
  FOR SELECT TO authenticated
  USING (
    reservation_id IN (
      SELECT id FROM puppy_reservations WHERE client_user_id = auth.uid()
    )
  );

-- Criador: CRUD completo sobre contratos de sus kennels
DROP POLICY IF EXISTS contracts_all_breeder ON reservation_contracts;
CREATE POLICY contracts_all_breeder ON reservation_contracts
  FOR ALL TO authenticated
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()))
  WITH CHECK (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));

COMMENT ON TABLE reservation_contracts IS
  'Contrato 1:1 con puppy_reservations. body_html es snapshot renderizable; body_json es TipTap nativo para edición. PDF se genera al firmar (snapshot inmutable).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. reservation_payments
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservation_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES puppy_reservations(id) ON DELETE CASCADE,
  kennel_id uuid NOT NULL REFERENCES kennels(id) ON DELETE CASCADE,

  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'EUR',
  type text NOT NULL DEFAULT 'milestone'
    CHECK (type IN ('deposit','milestone','final','custom')),
  description text,
  due_date date,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','requested','paid','refunded','cancelled')),
  paid_at timestamptz,
  paid_via text CHECK (paid_via IN ('stripe','bank_transfer','cash','other')),

  -- Stripe Connect
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_application_fee_cents integer,  -- fee de Genealogic (0 por ahora; futuro)

  -- Auditoría
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  marked_paid_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservation_payments_reservation ON reservation_payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_kennel ON reservation_payments(kennel_id);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_status ON reservation_payments(status);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_stripe_pi ON reservation_payments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

DROP TRIGGER IF EXISTS reservation_payments_set_updated_at ON reservation_payments;
CREATE TRIGGER reservation_payments_set_updated_at
  BEFORE UPDATE ON reservation_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE reservation_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select_client ON reservation_payments;
CREATE POLICY payments_select_client ON reservation_payments
  FOR SELECT TO authenticated
  USING (
    reservation_id IN (
      SELECT id FROM puppy_reservations WHERE client_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS payments_all_breeder ON reservation_payments;
CREATE POLICY payments_all_breeder ON reservation_payments
  FOR ALL TO authenticated
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()))
  WITH CHECK (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));

COMMENT ON TABLE reservation_payments IS
  'N pagos por reserva. Stripe Connect (criador cobra directo) o manual (transferencia/efectivo). El criador puede crear sin Stripe y marcar como paid manualmente.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. reservation_messages
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES puppy_reservations(id) ON DELETE CASCADE,
  kennel_id uuid NOT NULL REFERENCES kennels(id) ON DELETE CASCADE,

  sender_role text NOT NULL CHECK (sender_role IN ('client','breeder','system','bot')),
  sender_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text,           -- snapshot para histórico email pre-cuenta
  sender_email text,

  body text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{url, filename, size, mime_type}]
  origin text NOT NULL DEFAULT 'panel'
    CHECK (origin IN ('panel','email','system','bot')),

  -- Tracking lectura por cada lado
  read_at_client timestamptz,
  read_at_breeder timestamptz,

  -- Para mensajes importados desde emailbot: referencia al thread original
  source_email_message_id text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservation_messages_reservation ON reservation_messages(reservation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reservation_messages_kennel ON reservation_messages(kennel_id);
CREATE INDEX IF NOT EXISTS idx_reservation_messages_sender ON reservation_messages(sender_user_id) WHERE sender_user_id IS NOT NULL;

ALTER TABLE reservation_messages ENABLE ROW LEVEL SECURITY;

-- Cliente: lee + escribe en sus reservas
DROP POLICY IF EXISTS messages_select_client ON reservation_messages;
CREATE POLICY messages_select_client ON reservation_messages
  FOR SELECT TO authenticated
  USING (
    reservation_id IN (
      SELECT id FROM puppy_reservations WHERE client_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_insert_client ON reservation_messages;
CREATE POLICY messages_insert_client ON reservation_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_role = 'client'
    AND sender_user_id = auth.uid()
    AND reservation_id IN (
      SELECT id FROM puppy_reservations WHERE client_user_id = auth.uid()
    )
  );

-- Criador: lee + escribe en sus kennels
DROP POLICY IF EXISTS messages_all_breeder ON reservation_messages;
CREATE POLICY messages_all_breeder ON reservation_messages
  FOR ALL TO authenticated
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()))
  WITH CHECK (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));

-- Marcar como leído: cualquiera de los dos puede UPDATE solo de SU campo read_at
-- (usamos server actions con service role para no complicar RLS aquí)

COMMENT ON TABLE reservation_messages IS
  'Chat bidireccional entre cliente y criador para una reserva. Importa también emails históricos (sender_user_id NULL + sender_email = email original).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. dog_documents
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dog_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  kennel_id uuid REFERENCES kennels(id) ON DELETE SET NULL,
    -- nullable para perros sin kennel (transferidos a cliente, kennel ya no relevante)
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  type text NOT NULL DEFAULT 'other'
    CHECK (type IN ('contract','vaccine_card','health_card','pedigree','registration','genetic_test','other')),
  title text NOT NULL,
  description text,

  url text NOT NULL,           -- Supabase Storage signed URL o public URL
  storage_path text,           -- path en bucket para resignar / borrar
  file_size_bytes bigint,
  mime_type text,

  issued_at date,              -- fecha del documento físico (vacuna del X, contrato del Y)

  -- Visibilidad
  visible_to_owner boolean NOT NULL DEFAULT true,
    -- el criador puede subir uno privado (notas internas, copia interna) y no compartirlo

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dog_documents_dog ON dog_documents(dog_id);
CREATE INDEX IF NOT EXISTS idx_dog_documents_kennel ON dog_documents(kennel_id) WHERE kennel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dog_documents_type ON dog_documents(type);

DROP TRIGGER IF EXISTS dog_documents_set_updated_at ON dog_documents;
CREATE TRIGGER dog_documents_set_updated_at
  BEFORE UPDATE ON dog_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE dog_documents ENABLE ROW LEVEL SECURITY;

-- Cliente: lee documentos de SUS perros, solo los marcados visible_to_owner
DROP POLICY IF EXISTS dog_documents_select_owner ON dog_documents;
CREATE POLICY dog_documents_select_owner ON dog_documents
  FOR SELECT TO authenticated
  USING (
    visible_to_owner = true
    AND dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid())
  );

-- Criador: CRUD sobre documentos de perros de sus kennels
DROP POLICY IF EXISTS dog_documents_all_breeder ON dog_documents;
CREATE POLICY dog_documents_all_breeder ON dog_documents
  FOR ALL TO authenticated
  USING (
    dog_id IN (
      SELECT d.id FROM dogs d
      WHERE d.kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid())
         OR d.breeder_id = auth.uid()
    )
  )
  WITH CHECK (
    dog_id IN (
      SELECT d.id FROM dogs d
      WHERE d.kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid())
         OR d.breeder_id = auth.uid()
    )
  );

COMMENT ON TABLE dog_documents IS
  'Papeles asociados a un perro: contrato firmado, cartilla sanitaria, cartilla vacunas, test genético, etc. Visibilidad controlable (criador puede tener doc privado).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Extender backfill: al crear cuenta, transferir dogs de reservas ya delivered
-- ─────────────────────────────────────────────────────────────────────────────
-- Caso: criador marcó reserva como delivered ANTES de que el cliente creara cuenta.
-- En Fase B, el trigger transfer_dog_on_reservation_delivered solo movió ownership
-- SI había client_user_id. Si no, el dog se quedó con owner_id del kennel (o NULL).
-- Ahora al crear cuenta:
--   1. Trigger original linka las reservas por email (rellena client_user_id)
--   2. Para cada reserva delivered con dog_id que se acaba de linkar Y el dog
--      todavía no tiene delivered_from_reservation_id apuntando a ella, transfer.

CREATE OR REPLACE FUNCTION public.link_user_to_existing_records()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
BEGIN
  v_email := lower(coalesce(NEW.email, ''));
  IF v_email = '' THEN
    RETURN NEW;
  END IF;

  -- Vincular reservas pendientes por email
  UPDATE puppy_reservations
    SET client_user_id = NEW.id
    WHERE client_user_id IS NULL
      AND lower(applicant_email) = v_email;

  -- Vincular contactos CRM por email
  UPDATE owners
    SET user_id = NEW.id
    WHERE user_id IS NULL
      AND lower(email) = v_email;

  -- Backfill perros entregados antes de que existiera la cuenta:
  -- para cada reserva delivered del nuevo user que tiene dog_id, transferir el perro.
  UPDATE dogs d
    SET owner_id = NEW.id,
        delivered_from_reservation_id = pr.id
  FROM puppy_reservations pr
  WHERE pr.client_user_id = NEW.id
    AND pr.status = 'delivered'
    AND pr.dog_id IS NOT NULL
    AND pr.dog_id = d.id
    AND d.delivered_from_reservation_id IS NULL;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.link_user_to_existing_records IS
  'AFTER INSERT auth.users: backfill reservas, CRM y perros entregados por email matching. Hace que un cliente que reservó/recibió perro antes de crear cuenta vea todo automáticamente.';

-- ═══════════════════════════════════════════════════════════════════════════
-- Fin Fase C — schema
-- ═══════════════════════════════════════════════════════════════════════════
