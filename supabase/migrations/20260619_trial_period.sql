-- ═══════════════════════════════════════════════════════════════════════════
-- Trial de 15 días en suscripciones Kennel / Kennel Pro
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Patrón SaaS B2B clásico: el usuario introduce tarjeta al hacer checkout
-- (Stripe `payment_method_collection=always`), Stripe activa la suscripción
-- con `trial_period_days=15` y a los 15 días intenta cobrar. Si falla,
-- entra en `past_due` → `unpaid` → `canceled` (Smart Retries de Stripe) y
-- el webhook nos baja el plan a 'free'.
--
-- Para gestionar el estado en UI necesitamos saber cuándo termina el trial,
-- así que añadimos `trial_ends_at` y `trial_started_at` en profiles.
-- Stripe nos lo manda en cada `customer.subscription.*` como `sub.trial_end`
-- (epoch en segundos). El webhook lo persiste aquí.
--
-- `stripe_subscription_status` ya existe y va a recibir 'trialing' además
-- de 'active' / 'past_due' / 'canceled' / 'unpaid'. La columna es `text`
-- libre, así que no hace falta CHECK.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at    timestamptz;

COMMENT ON COLUMN public.profiles.trial_started_at IS
  'Inicio del trial de 15 días (= momento de checkout cuando se eligió un plan de pago con trial).';
COMMENT ON COLUMN public.profiles.trial_ends_at IS
  'Fin del trial = sub.trial_end de Stripe. Si NOW() < trial_ends_at, el user está en trial. Pasada esa fecha, Stripe cobra y el status pasa de trialing → active (o past_due si falla).';

-- Índice ligero para queries de "trials a punto de expirar" (cron / dashboard ops)
CREATE INDEX IF NOT EXISTS profiles_trial_ends_at_idx
  ON public.profiles (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;
