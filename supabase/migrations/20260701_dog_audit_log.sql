-- ─────────────────────────────────────────────────────────────────────────
-- dog_audit_log — histórico de cambios por perro
-- ─────────────────────────────────────────────────────────────────────────
-- Motivación: tanto criador como propietario pueden modificar un perro,
-- así que hay que saber QUIÉN hizo QUÉ y CUÁNDO. Sirve para:
--   · Confianza entre criador y cliente (transparencia post-venta)
--   · Resolución de disputas ("¿quién subió esa foto?")
--   · Cumplimiento RGPD (derecho de acceso / rectificación trazables)
--   · Producto: tab "Histórico" en la ficha de edición
--
-- Triggers cubren: dogs (INSERT/UPDATE), dog_photos (INSERT/DELETE),
-- vet_records (INSERT), awards (INSERT). El actor sale de auth.uid()
-- en cada request, por lo que NUNCA se debe llamar desde service-role
-- sin antes hacer un INSERT manual con el actor correcto.

CREATE TABLE IF NOT EXISTS dog_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Snapshot del nombre del actor en el momento del evento, por si el
  -- usuario borra su cuenta o cambia display_name después. Para auditoría
  -- queremos saber qué se VEÍA cuando pasó.
  actor_name text,
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice principal: ficha de un perro carga su histórico ordenado por fecha
CREATE INDEX IF NOT EXISTS idx_dog_audit_log_dog_id_created_at
  ON dog_audit_log (dog_id, created_at DESC);

-- Para "perfil de actividad" del usuario en /admin
CREATE INDEX IF NOT EXISTS idx_dog_audit_log_actor
  ON dog_audit_log (actor_user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE dog_audit_log ENABLE ROW LEVEL SECURITY;

-- Lectura: owner_id O breeder_id del perro, O super admin
DROP POLICY IF EXISTS "dog_audit_log_select" ON dog_audit_log;
CREATE POLICY "dog_audit_log_select" ON dog_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dogs d
      WHERE d.id = dog_audit_log.dog_id
        AND (d.owner_id = auth.uid() OR d.breeder_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Inserción: bloqueada para clientes. Solo via triggers SECURITY DEFINER
-- o RPC dedicado log_dog_action() también SECURITY DEFINER.
DROP POLICY IF EXISTS "dog_audit_log_no_direct_insert" ON dog_audit_log;
CREATE POLICY "dog_audit_log_no_direct_insert" ON dog_audit_log
  FOR INSERT WITH CHECK (false);

-- ─────────────────────────────────────────────────────────────────────────
-- Helper interno: resolver actor_name desde profiles
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _dog_audit_actor_name(p_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(display_name, email, 'Usuario eliminado')
  FROM profiles WHERE id = p_user_id;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Trigger principal: dogs INSERT / UPDATE
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_log_dog_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_name text := _dog_audit_actor_name(v_actor);
  v_changes jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO dog_audit_log (dog_id, actor_user_id, actor_name, action, payload)
    VALUES (NEW.id, v_actor, v_actor_name, 'created', jsonb_build_object(
      'name', NEW.name, 'sex', NEW.sex, 'breed_id', NEW.breed_id
    ));
    RETURN NEW;
  END IF;

  -- Transferencia de propiedad: evento dedicado (es el más sensible)
  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    INSERT INTO dog_audit_log (dog_id, actor_user_id, actor_name, action, payload)
    VALUES (NEW.id, v_actor, v_actor_name, 'transferred', jsonb_build_object(
      'from_owner', OLD.owner_id, 'to_owner', NEW.owner_id
    ));
  END IF;

  -- Cambios de campos editables — uno por campo para que el render del
  -- timeline sea legible ("Cambió el peso de 12.5 a 13.2 kg")
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('from', OLD.name, 'to', NEW.name));
  END IF;
  IF OLD.weight IS DISTINCT FROM NEW.weight THEN
    v_changes := v_changes || jsonb_build_object('weight', jsonb_build_object('from', OLD.weight, 'to', NEW.weight));
  END IF;
  IF OLD.height IS DISTINCT FROM NEW.height THEN
    v_changes := v_changes || jsonb_build_object('height', jsonb_build_object('from', OLD.height, 'to', NEW.height));
  END IF;
  IF OLD.is_public IS DISTINCT FROM NEW.is_public THEN
    v_changes := v_changes || jsonb_build_object('is_public', jsonb_build_object('from', OLD.is_public, 'to', NEW.is_public));
  END IF;
  IF OLD.registration IS DISTINCT FROM NEW.registration THEN
    v_changes := v_changes || jsonb_build_object('registration', jsonb_build_object('from', OLD.registration, 'to', NEW.registration));
  END IF;
  IF OLD.microchip IS DISTINCT FROM NEW.microchip THEN
    v_changes := v_changes || jsonb_build_object('microchip', jsonb_build_object('from', OLD.microchip, 'to', NEW.microchip));
  END IF;
  IF OLD.color_id IS DISTINCT FROM NEW.color_id THEN
    v_changes := v_changes || jsonb_build_object('color_id', jsonb_build_object('from', OLD.color_id, 'to', NEW.color_id));
  END IF;
  IF OLD.birth_date IS DISTINCT FROM NEW.birth_date THEN
    v_changes := v_changes || jsonb_build_object('birth_date', jsonb_build_object('from', OLD.birth_date, 'to', NEW.birth_date));
  END IF;
  IF OLD.father_id IS DISTINCT FROM NEW.father_id THEN
    v_changes := v_changes || jsonb_build_object('father_id', jsonb_build_object('from', OLD.father_id, 'to', NEW.father_id));
  END IF;
  IF OLD.mother_id IS DISTINCT FROM NEW.mother_id THEN
    v_changes := v_changes || jsonb_build_object('mother_id', jsonb_build_object('from', OLD.mother_id, 'to', NEW.mother_id));
  END IF;
  IF OLD.thumbnail_url IS DISTINCT FROM NEW.thumbnail_url THEN
    v_changes := v_changes || jsonb_build_object('thumbnail_url', jsonb_build_object('from', OLD.thumbnail_url, 'to', NEW.thumbnail_url));
  END IF;
  IF OLD.is_for_sale IS DISTINCT FROM NEW.is_for_sale THEN
    v_changes := v_changes || jsonb_build_object('is_for_sale', jsonb_build_object('from', OLD.is_for_sale, 'to', NEW.is_for_sale));
  END IF;
  IF OLD.sale_price IS DISTINCT FROM NEW.sale_price THEN
    v_changes := v_changes || jsonb_build_object('sale_price', jsonb_build_object('from', OLD.sale_price, 'to', NEW.sale_price));
  END IF;

  IF v_changes != '{}'::jsonb THEN
    INSERT INTO dog_audit_log (dog_id, actor_user_id, actor_name, action, payload)
    VALUES (NEW.id, v_actor, v_actor_name, 'updated', v_changes);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_dog_change ON dogs;
CREATE TRIGGER trg_log_dog_change
AFTER INSERT OR UPDATE ON dogs
FOR EACH ROW EXECUTE FUNCTION trg_log_dog_change();

-- ─────────────────────────────────────────────────────────────────────────
-- Trigger: dog_photos INSERT / DELETE
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_log_dog_photo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_name text := _dog_audit_actor_name(v_actor);
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO dog_audit_log (dog_id, actor_user_id, actor_name, action, payload)
    VALUES (NEW.dog_id, v_actor, v_actor_name, 'photo_added', jsonb_build_object('url', NEW.url));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO dog_audit_log (dog_id, actor_user_id, actor_name, action, payload)
    VALUES (OLD.dog_id, v_actor, v_actor_name, 'photo_removed', jsonb_build_object('url', OLD.url));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_dog_photo ON dog_photos;
CREATE TRIGGER trg_log_dog_photo
AFTER INSERT OR DELETE ON dog_photos
FOR EACH ROW EXECUTE FUNCTION trg_log_dog_photo();

-- ─────────────────────────────────────────────────────────────────────────
-- Trigger: vet_records INSERT
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_log_vet_record()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_name text := _dog_audit_actor_name(v_actor);
BEGIN
  INSERT INTO dog_audit_log (dog_id, actor_user_id, actor_name, action, payload)
  VALUES (NEW.dog_id, v_actor, v_actor_name, 'vet_record_added', jsonb_build_object(
    'record_type', NEW.record_type, 'name', NEW.name, 'date', NEW.date
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_vet_record ON vet_records;
CREATE TRIGGER trg_log_vet_record
AFTER INSERT ON vet_records
FOR EACH ROW EXECUTE FUNCTION trg_log_vet_record();

-- ─────────────────────────────────────────────────────────────────────────
-- Trigger: awards INSERT
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_log_award()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_name text := _dog_audit_actor_name(v_actor);
BEGIN
  INSERT INTO dog_audit_log (dog_id, actor_user_id, actor_name, action, payload)
  VALUES (NEW.dog_id, v_actor, v_actor_name, 'award_added', jsonb_build_object(
    'award_type', NEW.award_type, 'event_name', NEW.event_name, 'date', NEW.date
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_award ON awards;
CREATE TRIGGER trg_log_award
AFTER INSERT ON awards
FOR EACH ROW EXECUTE FUNCTION trg_log_award();

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: log_dog_action — para eventos custom desde server actions
-- ─────────────────────────────────────────────────────────────────────────
-- Casos donde los triggers no llegan: importaciones masivas con service-role,
-- eventos compuestos ("se generó un pedigree PDF"), o cuando queremos
-- payload más rico que el diff automático.
CREATE OR REPLACE FUNCTION log_dog_action(
  p_dog_id uuid,
  p_action text,
  p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'log_dog_action requires authenticated user';
  END IF;
  INSERT INTO dog_audit_log (dog_id, actor_user_id, actor_name, action, payload)
  VALUES (p_dog_id, v_actor, _dog_audit_actor_name(v_actor), p_action, p_payload)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_dog_action(uuid, text, jsonb) TO authenticated;
