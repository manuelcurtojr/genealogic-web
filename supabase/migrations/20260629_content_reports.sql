-- ═══════════════════════════════════════════════════════════════════════════
-- Notice-and-Action: content_reports
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Sistema de reportes de contenido para cumplir con:
--   · Art. 16-17 LSSI-CE (Ley 34/2002): procedimiento de retirada de
--     contenidos ilícitos al recibir conocimiento efectivo (notice-and-action).
--   · Art. 14 DSA (Reglamento (UE) 2022/2065): mecanismos de notificación
--     y actuación para prestadores de servicios de alojamiento.
--   · Art. 17 LPI (Real Decreto Legislativo 1/1996): retirada de obras
--     protegidas por copyright sin autorización del titular.
--   · Art. 17 RGPD: derecho de supresión sobre datos personales.
--
-- Permite reportes anónimos (importante: titulares de derechos no
-- necesariamente son usuarios de la plataforma) y de usuarios logueados.
-- Solo admins pueden ver el contenido completo de los reportes.
--
-- Idempotente. Re-aplicable.

-- ───────────────────────────────────────────────────────────────────────────
-- Tabla content_reports
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Quién reporta
  reporter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email text,            -- requerido si no hay user_id
  reporter_name text,
  reporter_ip text,               -- para correlación / antifraude
  reporter_user_agent text,

  -- Qué se reporta
  target_type text NOT NULL CHECK (target_type IN (
    'dog', 'photo', 'kennel', 'user', 'comment', 'message', 'litter', 'other'
  )),
  target_id text NOT NULL,        -- uuid del recurso o identificador
  target_url text,                -- url canónica para que el admin la abra

  -- Motivo (categorías del DSA + RGPD + LSSI)
  reason text NOT NULL CHECK (reason IN (
    'copyright',          -- infracción derechos autor (foto, texto)
    'personal_data',      -- RGPD art. 17 — datos personales sin consentimiento
    'inaccurate',         -- información factualmente incorrecta sobre perro
    'inappropriate',      -- contenido ofensivo, ilegal, discriminatorio
    'impersonation',      -- alguien suplantando criador / perfil
    'animal_welfare',     -- contenido relacionado con maltrato animal
    'duplicate',          -- perro duplicado en la BBDD
    'other'
  )),
  description text NOT NULL,      -- texto libre con detalles

  -- Reclamación de derechos (DMCA-style, opcional)
  is_rights_holder boolean NOT NULL DEFAULT false,
  rights_holder_declaration boolean NOT NULL DEFAULT false, -- declaración jurada
  contact_info text,              -- email/teléfono del titular o representante

  -- Estado y resolución
  status text NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'reviewing', 'resolved_removed', 'resolved_kept', 'rejected', 'duplicate_report'
  )),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes text,
  resolution_action text,         -- "removed", "anonymized", "kept", "transferred", etc.

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Al menos uno: usuario logueado O email de contacto
  CONSTRAINT content_reports_has_contact CHECK (
    reporter_user_id IS NOT NULL OR reporter_email IS NOT NULL
  )
);

-- Índices para queries de admin
CREATE INDEX IF NOT EXISTS content_reports_status_idx
  ON public.content_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS content_reports_target_idx
  ON public.content_reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS content_reports_reason_idx
  ON public.content_reports (reason, status);
CREATE INDEX IF NOT EXISTS content_reports_reporter_idx
  ON public.content_reports (reporter_user_id)
  WHERE reporter_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS content_reports_open_idx
  ON public.content_reports (created_at DESC)
  WHERE status IN ('open', 'reviewing');

-- ───────────────────────────────────────────────────────────────────────────
-- RLS — solo admins ven todo; usuarios ven SUS reportes; INSERT abierto
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- INSERT: cualquiera puede crear un reporte (incluso anónimos vía endpoint).
-- El endpoint /api/reports valida payload + rate-limita por IP.
DROP POLICY IF EXISTS "anyone_can_report" ON public.content_reports;
CREATE POLICY "anyone_can_report"
  ON public.content_reports
  FOR INSERT
  WITH CHECK (true);

-- SELECT: usuario puede ver SUS propios reportes; admin ve todo.
DROP POLICY IF EXISTS "user_sees_own_reports" ON public.content_reports;
CREATE POLICY "user_sees_own_reports"
  ON public.content_reports
  FOR SELECT
  USING (
    reporter_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE: solo admin para resolver / cambiar estado.
DROP POLICY IF EXISTS "admin_can_resolve_reports" ON public.content_reports;
CREATE POLICY "admin_can_resolve_reports"
  ON public.content_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: solo admin (y debe ser excepcional; mejor cambiar status).
DROP POLICY IF EXISTS "admin_can_delete_reports" ON public.content_reports;
CREATE POLICY "admin_can_delete_reports"
  ON public.content_reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- Vista pública para el reportante: ver SU reporte por id (anónimo o no)
-- ───────────────────────────────────────────────────────────────────────────
-- Permite a un titular de derechos que envió un reporte sin login consultarlo
-- vía url firmada (id + email) — el endpoint /api/reports/[id] validará el
-- match email para anónimos.

COMMENT ON TABLE public.content_reports IS
  'Reportes de contenido (notice-and-action). Cumple LSSI art. 16-17, DSA art. 14, LPI art. 17, RGPD art. 17.';
