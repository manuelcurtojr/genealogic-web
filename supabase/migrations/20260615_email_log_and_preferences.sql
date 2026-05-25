-- ═══════════════════════════════════════════════════════════════════════════
-- Email log + preferencias por user
-- ═══════════════════════════════════════════════════════════════════════════
--
-- email_log:
--   Registro de TODOS los emails transaccionales enviados.
--   Sirve para: deduplicar (no mandar 2 veces el mismo welcome), trackear
--   bounces, auditoría y métricas (qué tipo se envía más, qué falla).
--
-- email_preferences:
--   Opt-out por tipo de email. Por defecto todos los emails están ON.
--   El user puede desactivar categorías desde /settings/notificaciones.
--   Los emails 'auth' y 'support_replied' NUNCA se pueden desactivar
--   (son críticos).

CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  template text NOT NULL,        -- p.ej. 'welcome_breeder', 'reservation_new'
  subject text NOT NULL,
  -- Identificador único para dedupe (p.ej. 'welcome:userId', 'msg:messageId').
  -- Si llega un insert con el mismo dedupe_key, no se manda.
  dedupe_key text UNIQUE,
  -- ID del proveedor (Resend message id)
  provider_id text,
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'failed', 'bounced', 'complained', 'skipped')),
  error text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_user ON public.email_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_template ON public.email_log(template, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON public.email_log(status) WHERE status <> 'sent';

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- Solo admin lee email_log. Server-side inserts via service-role bypassan RLS.
DROP POLICY IF EXISTS email_log_admin_select ON public.email_log;
CREATE POLICY email_log_admin_select ON public.email_log
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ─── Preferencias por user ───
CREATE TABLE IF NOT EXISTS public.email_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Categorías opt-outable. Todas TRUE por defecto.
  reservations boolean NOT NULL DEFAULT true,    -- reserva nueva, cambio status
  messages boolean NOT NULL DEFAULT true,        -- nuevo mensaje en hilo
  vet_reminders boolean NOT NULL DEFAULT true,   -- recordatorios vet
  weekly_digest boolean NOT NULL DEFAULT true,   -- resumen semanal
  marketing boolean NOT NULL DEFAULT true,       -- anuncios, features nuevas
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_prefs_own ON public.email_preferences;
CREATE POLICY email_prefs_own ON public.email_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Trigger: al crear un profile, crear sus preferencias por defecto
CREATE OR REPLACE FUNCTION public.create_email_prefs_for_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_create_email_prefs ON public.profiles;
CREATE TRIGGER trg_create_email_prefs
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_email_prefs_for_new_user();

-- Backfill para users existentes
INSERT INTO public.email_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
