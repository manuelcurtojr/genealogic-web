-- ═══════════════════════════════════════════════════════════════════════════
-- Auto-suscripción: solicitantes → newsletter_subscribers
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cuando alguien envía un formulario de reserva (puppy_reservations.INSERT)
-- con email, se le añade automáticamente a newsletter_subscribers de ese
-- kennel.
--
-- Reglas:
--   - ON CONFLICT (kennel_id, email) DO NOTHING → respeta:
--       * suscriptores existentes activos (no reescribe metadata)
--       * suscriptores que se dieron de baja (is_active=false): NO los
--         re-suscribe, su decisión se respeta
--   - source = 'reservation' (origen para analytics futuras)
--   - Si applicant_email es NULL, no-op
--
-- Backfill al final: cubre todas las reservas históricas existentes que aún
-- no tienen suscriptor asociado.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Función trigger
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_subscribe_reservation_applicant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.applicant_email IS NULL OR trim(NEW.applicant_email) = '' THEN
    RETURN NEW;
  END IF;
  IF NEW.kennel_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO newsletter_subscribers (
    kennel_id, email, full_name, source, is_active, subscribed_at
  )
  VALUES (
    NEW.kennel_id,
    lower(trim(NEW.applicant_email)),
    nullif(trim(coalesce(NEW.applicant_name, '')), ''),
    'reservation',
    true,
    coalesce(NEW.created_at, now())
  )
  ON CONFLICT (kennel_id, email) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservations_auto_subscribe ON puppy_reservations;
CREATE TRIGGER reservations_auto_subscribe
  AFTER INSERT ON puppy_reservations
  FOR EACH ROW EXECUTE FUNCTION public.auto_subscribe_reservation_applicant();

COMMENT ON FUNCTION public.auto_subscribe_reservation_applicant IS
  'AFTER INSERT puppy_reservations: añade applicant_email a newsletter_subscribers del kennel con source=reservation. Respeta bajas previas via ON CONFLICT DO NOTHING.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Backfill: reservas históricas que aún no están suscritas
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO newsletter_subscribers (
  kennel_id, email, full_name, source, is_active, subscribed_at
)
SELECT
  r.kennel_id,
  lower(trim(r.applicant_email)) AS email,
  nullif(trim(coalesce(r.applicant_name, '')), '') AS full_name,
  'reservation' AS source,
  true AS is_active,
  coalesce(r.created_at, now()) AS subscribed_at
FROM puppy_reservations r
WHERE r.applicant_email IS NOT NULL
  AND trim(r.applicant_email) <> ''
  AND r.kennel_id IS NOT NULL
ON CONFLICT (kennel_id, email) DO NOTHING;
