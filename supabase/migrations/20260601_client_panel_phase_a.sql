-- ═══════════════════════════════════════════════════════════════════════════
-- Panel del Propietario (cliente) — Fase A
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Introduce el rol "propietario" sin romper el modelo existente:
--
--  · auth.users sigue siendo único — un user puede ser SIMULTÁNEAMENTE
--    criador (kennels.owner_id = me) y propietario (puppy_reservations.
--    client_user_id = me OR dogs.owner_id = me).
--
--  · puppy_reservations.owner_id (legacy) sigue apuntando a la tabla
--    `owners` (CRM del criador, sin cuenta). NO se toca.
--
--  · NUEVO `puppy_reservations.client_user_id` apunta a auth.users cuando
--    el cliente sí tiene cuenta. Empieza NULL, se rellena cuando el cliente
--    crea cuenta con el mismo email (trigger backfill) o reserva ya logueado.
--
--  · NUEVO `owners.user_id` vincula el contacto del CRM con su cuenta real
--    auth.users cuando exista. El CRM funciona igual si user_id es NULL.
--
-- Idempotente (IF NOT EXISTS en todo).

-- ─── 1. Vincular reserva con cuenta del cliente ──────────────────────────
ALTER TABLE puppy_reservations
  ADD COLUMN IF NOT EXISTS client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS puppy_reservations_client_user_idx
  ON puppy_reservations(client_user_id);

COMMENT ON COLUMN puppy_reservations.client_user_id IS
  'Cuenta auth.users del cliente cuando existe. NULL = el cliente reservó vía formulario público y aún no se ha registrado. Se rellena automáticamente cuando el cliente crea cuenta con el mismo email que applicant_email (trigger backfill_client_user_id_on_signup).';

-- ─── 2. Vincular owner del CRM con cuenta del cliente ────────────────────
ALTER TABLE owners
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS owners_user_id_idx ON owners(user_id);

COMMENT ON COLUMN owners.user_id IS
  'Cuenta auth.users del cliente del CRM cuando existe. NULL = el cliente del kennel sigue sin cuenta. No bloquea funcionalidad CRM. Se rellena con el trigger backfill al crear cuenta.';

-- ─── 3. Marca el perro como "entregado de una reserva" ───────────────────
--    Cuando una puppy_reservations pasa a `delivered`, el perro se transfiere
--    al cliente (dogs.owner_id = client_user_id). Esta columna preserva la
--    trazabilidad de qué reserva originó la transferencia. Útil para histórico.
ALTER TABLE dogs
  ADD COLUMN IF NOT EXISTS delivered_from_reservation_id uuid
    REFERENCES puppy_reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS dogs_delivered_from_reservation_idx
  ON dogs(delivered_from_reservation_id);

-- ─── 4. Trigger: backfill al crear cuenta nueva ──────────────────────────
--    Cuando un user nuevo se registra, vinculamos automáticamente:
--    - todas las puppy_reservations con applicant_email = NEW.email
--    - todos los owners con email = NEW.email
--    El cliente entra a /mis-reservas y ya tiene su histórico visible.

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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_link_records ON auth.users;
CREATE TRIGGER on_auth_user_created_link_records
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_user_to_existing_records();

COMMENT ON FUNCTION public.link_user_to_existing_records IS
  'Trigger automático al crear cuenta nueva: vincula puppy_reservations y owners cuyo email coincida con el del user. Esto permite que un cliente que reservó hace meses entre por primera vez y vea su histórico.';

-- ─── 5. RLS adicional: el cliente ve SUS reservas ────────────────────────
--    Las políticas existentes solo dan acceso al criador (kennel owner).
--    Añadimos política que da SELECT también al client_user_id.

DROP POLICY IF EXISTS "reservations_select_client" ON puppy_reservations;
CREATE POLICY "reservations_select_client" ON puppy_reservations FOR SELECT
  USING (client_user_id = auth.uid());

-- (No damos INSERT/UPDATE/DELETE al cliente — la reserva la maneja el criador.
--  Cuando habilitemos firmas/pagos en Fase C, añadiremos políticas específicas
--  para esos campos puntuales.)

-- ─── 6. RLS para owners: el cliente lee SU ficha del CRM ─────────────────
--    Útil para mostrar en el panel del propietario qué datos tiene el criador
--    de él (compliance GDPR — "qué datos guardan sobre mí").

DROP POLICY IF EXISTS "owners_select_self" ON owners;
CREATE POLICY "owners_select_self" ON owners FOR SELECT
  USING (user_id = auth.uid());

-- ─── 7. RLS para dogs: el cliente ve SUS perros (los que le entregaron) ──
--    dogs.owner_id ya puede ser un auth.users.id (existía pero usado solo
--    para criadores). Añadimos política explícita para SELECT del cliente
--    cuando NO es el kennel owner.

DROP POLICY IF EXISTS "dogs_select_owner" ON dogs;
CREATE POLICY "dogs_select_owner" ON dogs FOR SELECT
  USING (owner_id = auth.uid());

-- ─── 8. Backfill inicial para cuentas ya existentes ─────────────────────
--    Para cualquier auth.users que YA exista y tenga email matcheando con
--    applicant_email de reservas o email de owners, vincular ahora.

UPDATE puppy_reservations pr
  SET client_user_id = u.id
  FROM auth.users u
  WHERE pr.client_user_id IS NULL
    AND pr.applicant_email IS NOT NULL
    AND lower(pr.applicant_email) = lower(u.email);

UPDATE owners o
  SET user_id = u.id
  FROM auth.users u
  WHERE o.user_id IS NULL
    AND o.email IS NOT NULL
    AND lower(o.email) = lower(u.email);

-- ═══════════════════════════════════════════════════════════════════════════
-- Verificación
-- ═══════════════════════════════════════════════════════════════════════════
-- Tras aplicar:
--   SELECT COUNT(*) FROM puppy_reservations WHERE client_user_id IS NOT NULL;
--   SELECT COUNT(*) FROM owners WHERE user_id IS NOT NULL;
-- Deberían reflejar las cuentas que ya tenían reservas/CRM con su email.
