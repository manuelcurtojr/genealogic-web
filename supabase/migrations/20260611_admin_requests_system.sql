-- ═══════════════════════════════════════════════════════════════════════════
-- Admin Requests System · Soporte + Reclamaciones (claims)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Unifica en una sola bandeja del admin TODO tipo de petición que requiera
-- intervención humana:
--
--   1) SUPPORT          — ticket genérico de soporte (vino del chatbot
--                          al pedir "hablar con un humano", o del form
--                          /soporte directamente)
--   2) CLAIM_DOG        — un usuario reclama ser dueño de un perro
--                          importado (owner_id IS NULL)
--   3) CLAIM_KENNEL     — un usuario reclama ser dueño de un criadero
--                          importado (owner_id IS NULL)
--
-- La aprobación de un claim transfiere ownership atómicamente y notifica.
-- El usuario solicitante y el admin pueden intercambiar mensajes con
-- adjuntos en la subtabla `admin_request_messages`.
--
-- Evidencias (certificados, pedigrees) se suben al bucket privado
-- `claim-evidence` con path `{user_id}/{request_id}/{filename}`.

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla principal
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo de petición
  type text NOT NULL CHECK (type IN ('support', 'claim_dog', 'claim_kennel')),

  -- Workflow
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'awaiting_user', 'approved', 'rejected', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Solicitante (puede ser anon → user_id NULL, pero email/nombre obligatorio)
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_email text NOT NULL,
  requester_name text,

  -- Target del claim (NULL si type=support)
  target_kennel_id uuid REFERENCES public.kennels(id) ON DELETE CASCADE,
  target_dog_id uuid REFERENCES public.dogs(id) ON DELETE CASCADE,

  -- Contenido
  subject text NOT NULL,
  message text NOT NULL,

  -- Array de evidencias: [{ path: string, filename: string, size: number,
  --                         mime: string, uploaded_at: timestamptz, label?: string }]
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Contexto / source
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'chatbot', 'kennel_page', 'dog_page', 'soporte_form', 'api')),
  source_url text,
  source_metadata jsonb DEFAULT '{}'::jsonb,

  -- Admin asignado + resolución
  assigned_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text, -- privado, solo admins
  resolution_note text, -- visible para el user al cerrar

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints de coherencia
  CONSTRAINT claim_must_have_target CHECK (
    (type = 'support' AND target_kennel_id IS NULL AND target_dog_id IS NULL)
    OR (type = 'claim_dog' AND target_dog_id IS NOT NULL AND target_kennel_id IS NULL)
    OR (type = 'claim_kennel' AND target_kennel_id IS NOT NULL AND target_dog_id IS NULL)
  )
);

COMMENT ON TABLE public.admin_requests IS
  'Bandeja unificada del admin: tickets de soporte + reclamaciones de ownership de perros/criaderos importados.';

CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON public.admin_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_type ON public.admin_requests(type);
CREATE INDEX IF NOT EXISTS idx_admin_requests_priority ON public.admin_requests(priority);
CREATE INDEX IF NOT EXISTS idx_admin_requests_requester ON public.admin_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_requests_assigned ON public.admin_requests(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_requests_target_dog ON public.admin_requests(target_dog_id)
  WHERE target_dog_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_requests_target_kennel ON public.admin_requests(target_kennel_id)
  WHERE target_kennel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_requests_created ON public.admin_requests(created_at DESC);

-- Solo un claim PENDIENTE por (target, user) — evita spam
CREATE UNIQUE INDEX IF NOT EXISTS uniq_claim_pending_per_user_dog
  ON public.admin_requests(target_dog_id, requester_user_id)
  WHERE type = 'claim_dog' AND status IN ('pending', 'reviewing', 'awaiting_user');

CREATE UNIQUE INDEX IF NOT EXISTS uniq_claim_pending_per_user_kennel
  ON public.admin_requests(target_kennel_id, requester_user_id)
  WHERE type = 'claim_kennel' AND status IN ('pending', 'reviewing', 'awaiting_user');

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.admin_requests_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_admin_requests_touch ON public.admin_requests;
CREATE TRIGGER trg_admin_requests_touch
  BEFORE UPDATE ON public.admin_requests
  FOR EACH ROW EXECUTE FUNCTION public.admin_requests_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Mensajes (conversación admin ↔ user)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_request_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.admin_requests(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_is_admin boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arm_request ON public.admin_request_messages(request_id, created_at);

COMMENT ON TABLE public.admin_request_messages IS
  'Thread de mensajes entre el admin y el solicitante sobre una admin_request.';

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_request_messages ENABLE ROW LEVEL SECURITY;

-- Helper para chequear admin (asume profiles.role)
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin'
  )
$$;

-- Users leen SUS requests; admins leen todos
DROP POLICY IF EXISTS admin_requests_select ON public.admin_requests;
CREATE POLICY admin_requests_select ON public.admin_requests
  FOR SELECT TO authenticated
  USING (
    requester_user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- Users autenticados pueden CREAR sus propias requests (server action valida más)
DROP POLICY IF EXISTS admin_requests_insert ON public.admin_requests;
CREATE POLICY admin_requests_insert ON public.admin_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_user_id = auth.uid()
  );

-- Users pueden actualizar SOLO para cancelar la suya pendiente
DROP POLICY IF EXISTS admin_requests_user_cancel ON public.admin_requests;
CREATE POLICY admin_requests_user_cancel ON public.admin_requests
  FOR UPDATE TO authenticated
  USING (requester_user_id = auth.uid() AND status IN ('pending', 'reviewing', 'awaiting_user'))
  WITH CHECK (requester_user_id = auth.uid());

-- Admins pueden actualizar cualquier cosa
DROP POLICY IF EXISTS admin_requests_admin_all ON public.admin_requests;
CREATE POLICY admin_requests_admin_all ON public.admin_requests
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ─── messages ───
DROP POLICY IF EXISTS arm_select ON public.admin_request_messages;
CREATE POLICY arm_select ON public.admin_request_messages
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.admin_requests r
      WHERE r.id = admin_request_messages.request_id
        AND r.requester_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS arm_insert ON public.admin_request_messages;
CREATE POLICY arm_insert ON public.admin_request_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Admin puede escribir a cualquier hilo
    (public.is_admin(auth.uid()) AND author_is_admin = true)
    -- User puede escribir a sus propios hilos (no como admin)
    OR (
      author_is_admin = false
      AND author_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.admin_requests r
        WHERE r.id = admin_request_messages.request_id
          AND r.requester_user_id = auth.uid()
          AND r.status IN ('pending', 'reviewing', 'awaiting_user')
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage bucket para evidencias
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'claim-evidence',
  'claim-evidence',
  false, -- PRIVADO
  10 * 1024 * 1024, -- 10MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
-- Path: {auth.uid()}/{request_id}/{filename}  → primer segmento = userId
DROP POLICY IF EXISTS "claim_evidence_upload_own" ON storage.objects;
CREATE POLICY "claim_evidence_upload_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'claim-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "claim_evidence_read_own" ON storage.objects;
CREATE POLICY "claim_evidence_read_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'claim-evidence'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "claim_evidence_delete_own" ON storage.objects;
CREATE POLICY "claim_evidence_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'claim-evidence'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin(auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Función atómica de aprobación de claim → transfiere ownership
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.approve_claim_request(
  p_request_id uuid,
  p_resolution_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  -- Solo admin puede ejecutar
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized: only admin can approve claims';
  END IF;

  SELECT * INTO r FROM public.admin_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'request not found';
  END IF;

  IF r.status NOT IN ('pending', 'reviewing', 'awaiting_user') THEN
    RAISE EXCEPTION 'request already resolved (status=%)', r.status;
  END IF;

  IF r.requester_user_id IS NULL THEN
    RAISE EXCEPTION 'cannot approve claim without authenticated requester';
  END IF;

  -- Aplicar la transferencia según el tipo
  IF r.type = 'claim_kennel' THEN
    UPDATE public.kennels
      SET owner_id = r.requester_user_id
      WHERE id = r.target_kennel_id;

    -- Auto: set onboarding_intent a 'breeder' si era NULL
    UPDATE public.profiles
      SET onboarding_intent = 'breeder'
      WHERE id = r.requester_user_id
        AND onboarding_intent IS NULL;

  ELSIF r.type = 'claim_dog' THEN
    UPDATE public.dogs
      SET owner_id = r.requester_user_id
      WHERE id = r.target_dog_id;

    UPDATE public.profiles
      SET onboarding_intent = 'owner'
      WHERE id = r.requester_user_id
        AND onboarding_intent IS NULL;

  ELSE
    RAISE EXCEPTION 'request type % is not a claim', r.type;
  END IF;

  -- Marcar resuelta
  UPDATE public.admin_requests
    SET status = 'approved',
        resolved_at = now(),
        resolved_by_admin_id = auth.uid(),
        resolution_note = COALESCE(p_resolution_note, resolution_note)
    WHERE id = p_request_id;
END $$;

COMMENT ON FUNCTION public.approve_claim_request(uuid, text) IS
  'Aprueba un claim y transfiere ownership atómicamente. Solo admins.';
