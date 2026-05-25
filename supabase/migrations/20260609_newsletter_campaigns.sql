-- ═══════════════════════════════════════════════════════════════════════════
-- Newsletter — campañas + envíos individuales
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Puerta a la lista existente `newsletter_subscribers`. Añadimos:
--  1. unsubscribe_token único (para enlace público de baja sin auth)
--  2. newsletter_campaigns (un row por campaña, con editor + audience + stats)
--  3. newsletter_sends (un row por destinatario, idempotente con UNIQUE)
--
-- Adaptado del modelo Pawdoq (tenant→kennel, owners→newsletter_subscribers).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Token de baja en newsletter_subscribers
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token text;

-- Rellena tokens para los suscriptores existentes
UPDATE public.newsletter_subscribers
SET unsubscribe_token = encode(gen_random_bytes(24), 'hex')
WHERE unsubscribe_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_newsletter_subscribers_unsubscribe_token
  ON public.newsletter_subscribers (unsubscribe_token)
  WHERE unsubscribe_token IS NOT NULL;

-- Trigger para auto-generar token en nuevos suscriptores
CREATE OR REPLACE FUNCTION public.newsletter_subscribers_ensure_token()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.unsubscribe_token IS NULL THEN
    NEW.unsubscribe_token := encode(gen_random_bytes(24), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS newsletter_subscribers_ensure_token_trigger ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_ensure_token_trigger
  BEFORE INSERT ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.newsletter_subscribers_ensure_token();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. newsletter_campaigns
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES public.kennels(id) ON DELETE CASCADE,

  -- Editor
  title text NOT NULL,                  -- título interno
  subject text NOT NULL,                -- asunto del email
  preheader text,                       -- preview text (Gmail / Apple Mail)
  body_markdown text NOT NULL DEFAULT '',
  cta_label text,
  cta_url text,
  hero_image_url text,
  reply_to text,                        -- override del reply-to (default = email del kennel)

  -- Audiencia
  audience_type text NOT NULL DEFAULT 'all'
    CHECK (audience_type IN ('all','customers','leads','delivered','custom')),
  audience_filter jsonb,                -- futuro: segmentos custom (tag, raza, etc.)

  -- Workflow
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','sending','sent','failed','cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,

  -- Stats (agregados — se mantienen en send + webhook futuro Resend)
  recipients_total integer NOT NULL DEFAULT 0,
  delivered_count integer NOT NULL DEFAULT 0,
  opened_count integer NOT NULL DEFAULT 0,
  clicked_count integer NOT NULL DEFAULT 0,
  bounced_count integer NOT NULL DEFAULT 0,
  unsubscribed_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_kennel
  ON public.newsletter_campaigns (kennel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status
  ON public.newsletter_campaigns (kennel_id, status);

DROP TRIGGER IF EXISTS newsletter_campaigns_set_updated_at ON public.newsletter_campaigns;
CREATE TRIGGER newsletter_campaigns_set_updated_at
  BEFORE UPDATE ON public.newsletter_campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. newsletter_sends (uno por destinatario)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES public.newsletter_subscribers(id) ON DELETE SET NULL,
  email text NOT NULL,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','delivered','opened','clicked','bounced','complained','unsubscribed','failed')),

  resend_id text,  -- ID devuelto por Resend (para webhook lookup)

  first_open_at timestamptz,
  last_open_at timestamptz,
  open_count integer NOT NULL DEFAULT 0,
  first_click_at timestamptz,
  last_click_at timestamptz,
  click_count integer NOT NULL DEFAULT 0,
  bounced_at timestamptz,
  bounce_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (campaign_id, subscriber_id)
);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_campaign
  ON public.newsletter_sends (campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_resend
  ON public.newsletter_sends (resend_id) WHERE resend_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS — solo el owner del kennel ve sus campañas y envíos
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS newsletter_campaigns_all_owner ON public.newsletter_campaigns;
CREATE POLICY newsletter_campaigns_all_owner ON public.newsletter_campaigns
  FOR ALL TO authenticated
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()))
  WITH CHECK (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS newsletter_sends_select_owner ON public.newsletter_sends;
CREATE POLICY newsletter_sends_select_owner ON public.newsletter_sends
  FOR SELECT TO authenticated
  USING (campaign_id IN (
    SELECT id FROM newsletter_campaigns
    WHERE kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid())
  ));

COMMENT ON TABLE public.newsletter_campaigns IS
  'Campañas de newsletter por kennel. Editor + audiencia + workflow + stats.';
COMMENT ON TABLE public.newsletter_sends IS
  'Envíos individuales (uno por destinatario por campaña). Idempotente vía UNIQUE.';
