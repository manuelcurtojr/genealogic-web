-- ═══════════════════════════════════════════════════════════════════════════
-- stripe_events — log de eventos webhook procesados (idempotencia)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Stripe puede mandar el mismo evento 2-3 veces (retries por timeout o
-- redespliegue). Sin idempotencia un payment.succeeded podría disparar
-- 2 emails de confirmación, 2 actualizaciones de plan, etc.
--
-- Solución: antes de procesar un evento, intentar INSERT con su id.
-- Si UNIQUE viola, lo ignoramos. Si pasa, procesamos.

CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id text PRIMARY KEY,           -- evt_xxx de Stripe
  type text NOT NULL,                  -- 'customer.subscription.updated' etc
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(type, processed_at DESC);

-- Solo admin lee. Inserts vienen de service-role en webhook (bypass RLS).
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stripe_events_admin_select ON public.stripe_events;
CREATE POLICY stripe_events_admin_select ON public.stripe_events
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
