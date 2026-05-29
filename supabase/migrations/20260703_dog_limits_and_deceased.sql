-- ─────────────────────────────────────────────────────────────────────────
-- FASE 0 — Límite de perros por plan + estado Fallecido (In Memoriam)
-- ─────────────────────────────────────────────────────────────────────────
-- Contexto: hasta ahora canCreateDog() devolvía true siempre y plan_limits
-- estaba borrada → los 4 planes eran idénticos en producto. Esto implementa
-- el límite REAL en la BBDD (a prueba de bypass del cliente) + el estado
-- "fallecido" que el límite necesita para no contar perros muertos.
--
-- Reglas del límite (un perro CUENTA si):
--   · owner_id = el usuario (es suyo), Y
--   · NO está en venta (is_for_sale = false), Y
--   · NO está fallecido (deceased_at IS NULL), Y
--   · tiene > 90 días o birth_date desconocida (lactantes no cuentan)
--
-- Topes por plan:
--   · plan 'kennel' o 'kennel_pro' (Pro / Enterprise) → ILIMITADO
--   · tiene kennel + plan free  (Kennel Free) → 5
--   · sin kennel + plan free    (Owner)        → 3

-- ── 1. Estado fallecido ──────────────────────────────────────────────────
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS deceased_at date;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS deceased_locked boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN dogs.deceased_at IS 'Fecha de fallecimiento. NULL = vivo. Marcado irreversible desde UI (se revierte solo por soporte).';
COMMENT ON COLUMN dogs.deceased_locked IS 'Si true, el campo deceased_at no se puede revertir desde la UI del usuario.';

-- ── 2. Helper: límite de perros de un owner ──────────────────────────────
CREATE OR REPLACE FUNCTION dog_limit_for_owner(p_owner_id uuid)
RETURNS integer
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_plan text;
  v_has_kennel boolean;
BEGIN
  SELECT plan INTO v_plan FROM profiles WHERE id = p_owner_id;

  -- Planes de pago (kennel = Kennel Pro, kennel_pro = Kennel Enterprise) →
  -- ilimitado. Legacy pro/premium/starter también.
  IF v_plan IN ('kennel', 'kennel_pro', 'pro', 'premium', 'starter') THEN
    RETURN 2147483647;  -- "ilimitado" práctico
  END IF;

  -- Free: 5 si tiene kennel (Kennel Free), 3 si no (Owner).
  SELECT EXISTS (SELECT 1 FROM kennels WHERE owner_id = p_owner_id) INTO v_has_kennel;
  RETURN CASE WHEN v_has_kennel THEN 5 ELSE 3 END;
END;
$$;

-- ── 3. Helper: nº de perros que CUENTAN para el límite ───────────────────
CREATE OR REPLACE FUNCTION countable_dogs_for_owner(p_owner_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)::int
  FROM dogs
  WHERE owner_id = p_owner_id
    AND deceased_at IS NULL
    AND COALESCE(is_for_sale, false) = false
    AND (birth_date IS NULL OR birth_date <= current_date - INTERVAL '90 days');
$$;

-- ── 4. Trigger BEFORE INSERT: bloquear si se supera el límite ────────────
CREATE OR REPLACE FUNCTION enforce_dog_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_limit int;
  v_count int;
BEGIN
  IF NEW.owner_id IS NULL THEN RETURN NEW; END IF;

  -- El perro nuevo solo cuenta contra el límite si él mismo sería countable.
  -- (un cachorro en venta o sin fecha reciente no debería bloquear).
  IF NEW.deceased_at IS NOT NULL OR COALESCE(NEW.is_for_sale, false) = true THEN
    RETURN NEW;
  END IF;

  v_limit := dog_limit_for_owner(NEW.owner_id);
  IF v_limit >= 2147483647 THEN RETURN NEW; END IF;  -- ilimitado

  v_count := countable_dogs_for_owner(NEW.owner_id);
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'DOG_LIMIT_REACHED: límite de % perros alcanzado para este plan', v_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_dog_limit ON dogs;
CREATE TRIGGER trg_enforce_dog_limit
  BEFORE INSERT ON dogs
  FOR EACH ROW EXECUTE FUNCTION enforce_dog_limit();

-- ── 5. Bloqueo: no crear camada con padre/madre fallecido ────────────────
CREATE OR REPLACE FUNCTION block_litter_with_deceased_parent()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_dead text;
BEGIN
  SELECT name INTO v_dead FROM dogs
  WHERE id IN (NEW.father_id, NEW.mother_id) AND deceased_at IS NOT NULL
  LIMIT 1;
  IF v_dead IS NOT NULL THEN
    RAISE EXCEPTION 'DECEASED_PARENT: no se puede crear una camada con un progenitor fallecido (%)', v_dead
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_litter_deceased ON litters;
CREATE TRIGGER trg_block_litter_deceased
  BEFORE INSERT ON litters
  FOR EACH ROW EXECUTE FUNCTION block_litter_with_deceased_parent();

-- ── 6. Auto-marcar perros con > 20 años como fallecidos ──────────────────
-- Lo llamará un cron diario (vercel.json). Idempotente.
CREATE OR REPLACE FUNCTION auto_mark_elderly_deceased()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count int;
BEGIN
  WITH updated AS (
    UPDATE dogs
    SET deceased_at = (birth_date + INTERVAL '20 years')::date,
        deceased_locked = true
    WHERE birth_date IS NOT NULL
      AND birth_date < current_date - INTERVAL '20 years'
      AND deceased_at IS NULL
    RETURNING id
  )
  SELECT COUNT(*)::int INTO v_count FROM updated;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION auto_mark_elderly_deceased() TO service_role;
GRANT EXECUTE ON FUNCTION dog_limit_for_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION countable_dogs_for_owner(uuid) TO authenticated, service_role;
