-- ============================================================================
-- Pro features batch 1: knowledge_entries + newsletter_subscribers + page_views
-- 22 may 2026 (segunda migration del día)
--
-- - knowledge_entries: biblioteca de conocimiento que alimenta al Emailbot
-- - newsletter_subscribers: lista de email del criador para campañas
-- - page_views: tracking ligero de visitas para Estadísticas
-- ============================================================================

-- ─── 1. knowledge_entries (Biblioteca) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES kennels(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('general','precio','salud','reserva','entrega','filosofia','faq','condiciones')),
  title text NOT NULL,
  content text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_entries_kennel_id_idx ON knowledge_entries(kennel_id);
CREATE INDEX IF NOT EXISTS knowledge_entries_category_idx ON knowledge_entries(category);

ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_select_kennel_owner" ON knowledge_entries FOR SELECT
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "knowledge_insert_kennel_owner" ON knowledge_entries FOR INSERT
  WITH CHECK (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "knowledge_update_kennel_owner" ON knowledge_entries FOR UPDATE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "knowledge_delete_kennel_owner" ON knowledge_entries FOR DELETE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "knowledge_admin_all" ON knowledge_entries FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS knowledge_set_updated_at ON knowledge_entries;
CREATE TRIGGER knowledge_set_updated_at
  BEFORE UPDATE ON knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 2. newsletter_subscribers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES kennels(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','import','web_form','reservation','contract')),
  tags text[] DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  unsubscribe_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kennel_id, email)
);

CREATE INDEX IF NOT EXISTS newsletter_subs_kennel_id_idx ON newsletter_subscribers(kennel_id);
CREATE INDEX IF NOT EXISTS newsletter_subs_active_idx ON newsletter_subscribers(kennel_id, is_active);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_select_kennel_owner" ON newsletter_subscribers FOR SELECT
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "newsletter_insert_kennel_owner" ON newsletter_subscribers FOR INSERT
  WITH CHECK (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "newsletter_update_kennel_owner" ON newsletter_subscribers FOR UPDATE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "newsletter_delete_kennel_owner" ON newsletter_subscribers FOR DELETE
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "newsletter_admin_all" ON newsletter_subscribers FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS newsletter_set_updated_at ON newsletter_subscribers;
CREATE TRIGGER newsletter_set_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 3. page_views (tracking ligero anónimo) ────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid REFERENCES kennels(id) ON DELETE CASCADE,
  dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL,
  path text NOT NULL,
  visitor_hash text,   -- sha256(ip + user-agent + dia) — anonimo, GDPR-friendly
  referrer text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_views_kennel_id_idx ON page_views(kennel_id);
CREATE INDEX IF NOT EXISTS page_views_dog_id_idx ON page_views(dog_id);
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views(created_at DESC);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Solo el dueño del kennel ve sus stats. Inserción se hace desde el servidor
-- con service_role (no se necesita policy de insert para anon).
CREATE POLICY "page_views_select_kennel_owner" ON page_views FOR SELECT
  USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));
CREATE POLICY "page_views_admin_all" ON page_views FOR ALL USING (public.is_admin());

SELECT 'Pro features batch 1 OK (knowledge_entries, newsletter_subscribers, page_views)';
