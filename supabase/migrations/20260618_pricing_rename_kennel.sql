-- ═══════════════════════════════════════════════════════════════════════════
-- Rebranding de planes Pro/Premium → Kennel/Kennel Pro
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cambia el constraint de profiles.plan para aceptar los nuevos valores.
-- Por compatibilidad, MANTIENE 'pro' y 'premium' como valores válidos en
-- la DB (legacy) pero el código mapea cualquier `pro|kennel` → "Kennel"
-- y cualquier `premium|kennel_pro` → "Kennel Pro" en la UI.
--
-- Backfill: el único user con plan='pro' actualmente (Irema, founder)
-- se mueve a 'kennel_pro' (era founder con todas las features Pro).

-- 1) Reemplazar el constraint check (incluye los nuevos + mantiene viejos)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan = ANY (ARRAY[
    'free'::text,
    'kennel'::text,
    'kennel_pro'::text,
    -- Legacy (mantenidos por compat con suscripciones antiguas si las hubiera)
    'starter'::text,
    'pro'::text,
    'premium'::text
  ]));

-- 2) Backfill: Irema (manuel@genealogic.io owner del kennel founder) pasa
-- de 'pro' a 'kennel_pro'. Cualquier otro user en 'pro' (no debería
-- haber, hoy solo Irema) → 'kennel'. Premium → kennel_pro.
UPDATE public.profiles
  SET plan = 'kennel_pro'
  WHERE plan = 'premium';

UPDATE public.profiles
  SET plan = 'kennel_pro'
  WHERE plan = 'pro' AND plan_is_founder = true;

UPDATE public.profiles
  SET plan = 'kennel'
  WHERE plan = 'pro' AND (plan_is_founder IS NULL OR plan_is_founder = false);

-- Sanity check: cuántos quedaron en cada nuevo plan
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT plan, COUNT(*) AS n FROM public.profiles GROUP BY plan LOOP
    RAISE NOTICE '  plan=% count=%', r.plan, r.n;
  END LOOP;
END $$;
