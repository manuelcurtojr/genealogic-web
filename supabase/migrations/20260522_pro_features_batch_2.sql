-- ============================================================================
-- Pro features batch 2 — 22 may 2026 (tercera migration del día)
--
-- Tablas y columnas para:
-- - Emailbot real con hilos persistidos
-- - Web builder (kennel_pages)
-- - Stripe billing (campos en profiles + plan_subscriptions + plan_invoices)
-- - Custom domain (kennels.custom_domain + verification status)
-- ============================================================================

-- ─── 1. Emailbot config + threads + messages ────────────────────────────────
CREATE TABLE IF NOT EXISTS emailbot_config (
  kennel_id uuid PRIMARY KEY REFERENCES kennels(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  inbound_address text,                    -- p.ej. iremacurto-bot@inbound.genealogic.io
  reply_from_name text,                    -- "Irema Curtó"
  reply_from_email text,                   -- "no-reply@iremacurto.com" o el dominio del kennel
  signature text,                          -- firma opcional al final
  fallback_after_n_replies integer DEFAULT 3,  -- después de N replies, derivar a humano
  working_hours jsonb,                     -- { "tz": "Europe/Madrid", "from": "09:00", "to": "21:00" }
  last_inbound_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE emailbot_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ebconfig_select_owner" ON emailbot_config FOR SELECT
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "ebconfig_insert_owner" ON emailbot_config FOR INSERT
  WITH CHECK (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "ebconfig_update_owner" ON emailbot_config FOR UPDATE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "ebconfig_admin_all" ON emailbot_config FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS emailbot_config_set_updated_at ON emailbot_config;
CREATE TRIGGER emailbot_config_set_updated_at BEFORE UPDATE ON emailbot_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS emailbot_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES kennels(id) ON DELETE CASCADE,
  contact_email text NOT NULL,
  contact_name text,
  owner_id uuid REFERENCES owners(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES puppy_reservations(id) ON DELETE SET NULL,
  subject text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','derived_to_human','closed')),
  bot_replies_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ebthreads_kennel_idx ON emailbot_threads(kennel_id);
CREATE INDEX IF NOT EXISTS ebthreads_contact_email_idx ON emailbot_threads(kennel_id, contact_email);
CREATE INDEX IF NOT EXISTS ebthreads_last_msg_idx ON emailbot_threads(last_message_at DESC);

ALTER TABLE emailbot_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ebthreads_select_owner" ON emailbot_threads FOR SELECT
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "ebthreads_update_owner" ON emailbot_threads FOR UPDATE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "ebthreads_admin_all" ON emailbot_threads FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS emailbot_threads_set_updated_at ON emailbot_threads;
CREATE TRIGGER emailbot_threads_set_updated_at BEFORE UPDATE ON emailbot_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS emailbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES emailbot_threads(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  from_email text NOT NULL,
  to_email text NOT NULL,
  subject text,
  body_text text,
  body_html text,
  is_from_bot boolean NOT NULL DEFAULT false,
  was_flagged boolean NOT NULL DEFAULT false,
  flagged_reason text,
  external_message_id text,                -- id del provider (Resend, etc.)
  tokens_used integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ebmsgs_thread_idx ON emailbot_messages(thread_id, created_at);

ALTER TABLE emailbot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ebmsgs_select_via_thread" ON emailbot_messages FOR SELECT
  USING (thread_id IN (
    SELECT id FROM emailbot_threads
    WHERE kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid())
  ));
CREATE POLICY "ebmsgs_admin_all" ON emailbot_messages FOR ALL USING (public.is_admin());

-- ─── 2. Web builder (kennel_pages) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kennel_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES kennels(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  page_type text NOT NULL DEFAULT 'custom'
    CHECK (page_type IN ('home','about','dogs','litters','contact','faq','blog','custom')),
  cover_image_url text,
  content_md text,                         -- markdown editable por el criador
  meta_description text,
  is_published boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  show_in_nav boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kennel_id, slug)
);

CREATE INDEX IF NOT EXISTS kennel_pages_kennel_idx ON kennel_pages(kennel_id);
CREATE INDEX IF NOT EXISTS kennel_pages_published_idx ON kennel_pages(kennel_id, is_published);

ALTER TABLE kennel_pages ENABLE ROW LEVEL SECURITY;
-- Public select para páginas publicadas (renderer público)
CREATE POLICY "kennel_pages_public_published" ON kennel_pages FOR SELECT
  USING (is_published = true);
CREATE POLICY "kennel_pages_select_owner" ON kennel_pages FOR SELECT
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "kennel_pages_insert_owner" ON kennel_pages FOR INSERT
  WITH CHECK (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "kennel_pages_update_owner" ON kennel_pages FOR UPDATE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "kennel_pages_delete_owner" ON kennel_pages FOR DELETE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "kennel_pages_admin_all" ON kennel_pages FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS kennel_pages_set_updated_at ON kennel_pages;
CREATE TRIGGER kennel_pages_set_updated_at BEFORE UPDATE ON kennel_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 3. Custom domain en kennels ────────────────────────────────────────────
ALTER TABLE kennels
  ADD COLUMN IF NOT EXISTS custom_domain text UNIQUE,
  ADD COLUMN IF NOT EXISTS custom_domain_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_domain_added_at timestamptz;

CREATE INDEX IF NOT EXISTS kennels_custom_domain_idx ON kennels(custom_domain)
  WHERE custom_domain IS NOT NULL;

-- ─── 4. Stripe billing en profiles + plan_subscriptions + plan_invoices ─────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_status text,
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS billing_name text,
  ADD COLUMN IF NOT EXISTS billing_tax_id text,
  ADD COLUMN IF NOT EXISTS billing_country text,
  ADD COLUMN IF NOT EXISTS billing_address text,
  ADD COLUMN IF NOT EXISTS billing_city text,
  ADD COLUMN IF NOT EXISTS billing_postal_code text;

CREATE TABLE IF NOT EXISTS plan_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_invoice_id text UNIQUE,
  stripe_payment_intent_id text,
  number text,                             -- número factura legible
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'paid'
    CHECK (status IN ('draft','open','paid','uncollectible','void','refunded')),
  description text,
  hosted_invoice_url text,
  pdf_url text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plan_invoices_user_idx ON plan_invoices(user_id, created_at DESC);

ALTER TABLE plan_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_invoices_select_owner" ON plan_invoices FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "plan_invoices_admin_all" ON plan_invoices FOR ALL USING (public.is_admin());

SELECT 'Pro features batch 2 OK (emailbot, web builder, custom_domain, stripe billing)';
