-- ═══════════════════════════════════════════════════════════════════════════
-- Profiles · onboarding_intent
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Distingue qué quiere hacer el usuario al registrarse:
--   - 'breeder' : crear/gestionar un criadero (rama típica B2B)
--   - 'owner'   : registrar SUS perros (sin afijo formal), conectar con
--                 criaderos para reservas/papeles, usar pedigrees
--   - NULL      : todavía sin decidir → pantalla "Paso 0" en /dashboard
--
-- Se rellena vía:
--   1) signup intent (?intent=breeder|buyer en /register) si el visitor
--      vino desde /pricing o un CTA específico
--   2) selector explícito en el dashboard si no decidió antes
--
-- IMPORTANTE: este campo es ORTOGONAL a `role` (owner|breeder|admin) y
-- a `plan` (free|starter|pro|premium):
--   - `role` lo gestiona la DB con triggers (auto-promote a 'breeder'
--     cuando crea kennel)
--   - `plan` es comercial (free/pro/premium)
--   - `onboarding_intent` es la INTENCIÓN del user, NO su estado real.
--     Sirve para enseñarle el flujo correcto. Es estable: no cambia
--     aunque el user no haya creado kennel todavía.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_intent text
  CHECK (onboarding_intent IN ('breeder', 'owner'));

COMMENT ON COLUMN public.profiles.onboarding_intent IS
  'Qué quiere hacer el user: breeder (gestionar criadero) | owner (registrar sus perros, recibir reservas). NULL = todavía no eligió.';

-- Backfill: si ya tiene kennel → es breeder (independientemente de qué dijo)
UPDATE public.profiles p
SET onboarding_intent = 'breeder'
WHERE onboarding_intent IS NULL
  AND EXISTS (SELECT 1 FROM kennels k WHERE k.owner_id = p.id);

-- Backfill: si ya tiene reservas como cliente o perros recibidos → es owner
UPDATE public.profiles p
SET onboarding_intent = 'owner'
WHERE onboarding_intent IS NULL
  AND (
    EXISTS (SELECT 1 FROM puppy_reservations pr WHERE pr.client_user_id = p.id)
    OR EXISTS (
      SELECT 1 FROM dogs d
      WHERE d.owner_id = p.id
        AND d.delivered_from_reservation_id IS NOT NULL
    )
  );

-- El resto (usuarios sin kennel ni reservas) se quedan en NULL — verán
-- la pantalla de "Paso 0" la próxima vez que entren al dashboard.
