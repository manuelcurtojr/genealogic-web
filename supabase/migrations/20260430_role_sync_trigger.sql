-- Auto-sync profiles.role with kennel ownership
-- 30 abr 2026
--
-- Rules:
--   • New user            → 'owner' (default)
--   • Creates first kennel → trigger promotes to 'breeder'
--   • Deletes last kennel  → trigger demotes back to 'owner'
--   • 'admin' role is never touched by triggers (manual only)

-- Function: promote owner → breeder when they create a kennel
CREATE OR REPLACE FUNCTION sync_role_on_kennel_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only promote if currently 'owner' (don't downgrade admins, don't re-set existing breeders)
  UPDATE profiles
  SET role = 'breeder'
  WHERE id = NEW.owner_id
    AND role = 'owner';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: demote breeder → owner when they delete their last kennel
CREATE OR REPLACE FUNCTION sync_role_on_kennel_delete()
RETURNS TRIGGER AS $$
DECLARE
  remaining_kennels int;
BEGIN
  IF OLD.owner_id IS NULL THEN
    RETURN OLD;
  END IF;

  SELECT count(*) INTO remaining_kennels
  FROM kennels
  WHERE owner_id = OLD.owner_id;

  IF remaining_kennels = 0 THEN
    UPDATE profiles
    SET role = 'owner'
    WHERE id = OLD.owner_id
      AND role = 'breeder';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: handle ownership transfer between users
CREATE OR REPLACE FUNCTION sync_role_on_kennel_update()
RETURNS TRIGGER AS $$
DECLARE
  remaining_kennels int;
BEGIN
  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    -- Promote new owner if needed
    IF NEW.owner_id IS NOT NULL THEN
      UPDATE profiles
      SET role = 'breeder'
      WHERE id = NEW.owner_id
        AND role = 'owner';
    END IF;

    -- Demote old owner if it was their last kennel
    IF OLD.owner_id IS NOT NULL THEN
      SELECT count(*) INTO remaining_kennels
      FROM kennels
      WHERE owner_id = OLD.owner_id;

      IF remaining_kennels = 0 THEN
        UPDATE profiles
        SET role = 'owner'
        WHERE id = OLD.owner_id
          AND role = 'breeder';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wire up triggers
DROP TRIGGER IF EXISTS trg_sync_role_on_kennel_insert ON kennels;
CREATE TRIGGER trg_sync_role_on_kennel_insert
  AFTER INSERT ON kennels
  FOR EACH ROW EXECUTE FUNCTION sync_role_on_kennel_insert();

DROP TRIGGER IF EXISTS trg_sync_role_on_kennel_delete ON kennels;
CREATE TRIGGER trg_sync_role_on_kennel_delete
  AFTER DELETE ON kennels
  FOR EACH ROW EXECUTE FUNCTION sync_role_on_kennel_delete();

DROP TRIGGER IF EXISTS trg_sync_role_on_kennel_update ON kennels;
CREATE TRIGGER trg_sync_role_on_kennel_update
  AFTER UPDATE OF owner_id ON kennels
  FOR EACH ROW EXECUTE FUNCTION sync_role_on_kennel_update();

-- One-time consistency fix: align any existing rows whose role doesn't match reality
-- (in case any drift happened between previous migration and now)
UPDATE profiles
SET role = 'breeder'
WHERE role = 'owner'
  AND id IN (SELECT DISTINCT owner_id FROM kennels WHERE owner_id IS NOT NULL);

UPDATE profiles
SET role = 'owner'
WHERE role = 'breeder'
  AND id NOT IN (SELECT DISTINCT owner_id FROM kennels WHERE owner_id IS NOT NULL);
