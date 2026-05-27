-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint A — Super Admin: UTM tracking + user_id en page_views + audit prep
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cubre:
--   · profiles.signup_meta jsonb: utm_source/medium/campaign/term/content +
--     referrer + landing_page + signup_device. Capturado al registro vía
--     /api/track-signup que recibe lo que el middleware persistió en cookie.
--   · page_views.user_id: opcional, para asociar tracking anónimo a usuarios
--     logueados → desbloquea "ver historial de navegación de un user".
--   · admin_audit_log: tabla de eventos admin (impersonate, delete, role
--     change, claim resolve, settings change). RLS solo-admin.
--   · platform_settings.super_admin_email: configurable desde admin UI (en
--     lugar del hardcoded en código).
--
-- Idempotente. Re-aplicable.

-- ───────────────────────────────────────────────────────────────────────────
-- profiles.signup_meta — captura UTM / referrer / device al signup
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Índices funcionales para queries de attribution
CREATE INDEX IF NOT EXISTS profiles_signup_source_idx
  ON public.profiles ((signup_meta->>'utm_source'))
  WHERE signup_meta ? 'utm_source';

CREATE INDEX IF NOT EXISTS profiles_signup_referrer_idx
  ON public.profiles ((signup_meta->>'referrer'))
  WHERE signup_meta ? 'referrer';

COMMENT ON COLUMN public.profiles.signup_meta IS
  'JSON con utm_source, utm_medium, utm_campaign, utm_term, utm_content, referrer, landing_page, signup_device. Capturado al registro.';

-- ───────────────────────────────────────────────────────────────────────────
-- page_views.user_id — asociar tracking anónimo a sesión logueada
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS page_views_user_id_idx
  ON public.page_views (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.page_views.user_id IS
  'Opcional. Si la sesión está logueada, el tracker manda user.id para
  permitir "histórico de navegación de un user" desde el admin.';

-- ───────────────────────────────────────────────────────────────────────────
-- admin_audit_log — registro de acciones del super admin
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,            -- 'impersonate', 'delete_user', 'role_change', 'claim_approve', 'settings_change', ...
  target_table text,                    -- 'profiles', 'admin_requests', 'platform_settings', ...
  target_id   text,                     -- text para soportar UUID y otros
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip          text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_admin_idx
  ON public.admin_audit_log (admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx
  ON public.admin_audit_log (action, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
  ON public.admin_audit_log (target_table, target_id, created_at DESC)
  WHERE target_id IS NOT NULL;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer; nadie puede modificar (los inserts vienen de
-- service-role en server actions).
DROP POLICY IF EXISTS "admin_audit_log_select_admin" ON public.admin_audit_log;
CREATE POLICY "admin_audit_log_select_admin"
  ON public.admin_audit_log
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

COMMENT ON TABLE public.admin_audit_log IS
  'Registro inmutable de acciones del super admin: impersonate, delete,
  role/status change, claim approve/reject, settings change. Crítico
  para due-diligence y forensics.';

-- ───────────────────────────────────────────────────────────────────────────
-- platform_settings: super_admin_email configurable
-- ───────────────────────────────────────────────────────────────────────────
-- Insert idempotente (ON CONFLICT por key)
INSERT INTO public.platform_settings (key, value, updated_at)
VALUES ('super_admin_email', 'gestion@manuelcurto.com', now())
ON CONFLICT (key) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- RPC: admin_user_360 — vista 360 de un user en una sola query
-- ───────────────────────────────────────────────────────────────────────────
-- Devuelve profile + payments + email_log + admin_requests + page_views
-- recientes + genos_conversations en JSON. Para el sprint B (panel).
CREATE OR REPLACE FUNCTION public.admin_user_360(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'profile', (
      SELECT to_jsonb(p) FROM public.profiles p WHERE p.id = p_user_id
    ),
    'kennels', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', k.id, 'name', k.name, 'slug', k.slug, 'created_at', k.created_at
      )) FROM public.kennels k WHERE k.owner_id = p_user_id
    ),
    'recent_emails', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', e.id, 'template', e.template, 'subject', e.subject,
        'status', e.status, 'created_at', e.created_at
      ) ORDER BY e.created_at DESC)
      FROM (
        SELECT * FROM public.email_log
        WHERE user_id = p_user_id
        ORDER BY created_at DESC LIMIT 30
      ) e
    ),
    'recent_requests', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', r.id, 'type', r.type, 'status', r.status, 'subject', r.subject,
        'created_at', r.created_at
      ) ORDER BY r.created_at DESC)
      FROM (
        SELECT * FROM public.admin_requests
        WHERE requester_user_id = p_user_id
        ORDER BY created_at DESC LIMIT 20
      ) r
    ),
    'recent_page_views', (
      SELECT jsonb_agg(jsonb_build_object(
        'path', pv.path, 'country', pv.country, 'device', pv.device,
        'created_at', pv.created_at
      ) ORDER BY pv.created_at DESC)
      FROM (
        SELECT * FROM public.page_views
        WHERE user_id = p_user_id
        ORDER BY created_at DESC LIMIT 50
      ) pv
    ),
    'reservations', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', r.id, 'status', r.status, 'kennel_id', r.kennel_id,
        'created_at', r.created_at
      ) ORDER BY r.created_at DESC)
      FROM (
        SELECT * FROM public.puppy_reservations
        WHERE client_user_id = p_user_id OR owner_id IN (
          SELECT id FROM public.owners WHERE user_id = p_user_id
        )
        ORDER BY created_at DESC LIMIT 20
      ) r
    )
  ) INTO result;

  RETURN result;
END $func$;

GRANT EXECUTE ON FUNCTION public.admin_user_360(uuid) TO authenticated;

COMMENT ON FUNCTION public.admin_user_360 IS
  'Vista 360 de un user para el panel admin: profile, kennels, emails,
  tickets, page_views, reservas. Solo admin (check inline).';
