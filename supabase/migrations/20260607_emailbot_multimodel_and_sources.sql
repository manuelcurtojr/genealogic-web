-- ═══════════════════════════════════════════════════════════════════════════
-- Emailbot multi-modelo + fuentes de biblioteca + tracking de uso
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 3 cambios:
--
--  1. knowledge_entries: source_type (manual/url/pdf/doc/auto), source_url
--     (web del criador importada), source_filename (PDF/DOC subido), source_meta
--     (jsonb con info del scrape/parse)
--
--  2. kennels.bot_model: id del modelo elegido para el emailbot del kennel.
--     Default 'claude-sonnet-4-5'. Catálogo de modelos vive en código
--     (src/lib/ai/models.ts), no en DB, para poder evolucionarlo sin migration.
--
--  3. ai_usage_logs: cada llamada a una IA (chat, importer, etc.) genera
--     un row con tokens, modelo, coste estimado en USD, scope (qué función
--     lo causó). Base para billing / cuota mensual / paneles de uso.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. knowledge_entries.source_*
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE knowledge_entries
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual','url','pdf','doc','auto')),
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_filename text,
  ADD COLUMN IF NOT EXISTS source_meta jsonb;

COMMENT ON COLUMN knowledge_entries.source_type IS
  'manual=usuario tecleó | url=importado de web | pdf/doc=de archivo subido | auto=generado por bot';
COMMENT ON COLUMN knowledge_entries.source_url IS
  'URL original si source_type=url. Permite re-importar para refrescar.';
COMMENT ON COLUMN knowledge_entries.source_filename IS
  'Nombre del archivo original si source_type=pdf/doc.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. kennels.bot_model
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE kennels
  ADD COLUMN IF NOT EXISTS bot_model text NOT NULL DEFAULT 'claude-sonnet-4-5';

COMMENT ON COLUMN kennels.bot_model IS
  'ID del modelo de IA usado por el emailbot. Validado contra catálogo en lib/ai/models.ts. Cambiable desde /emailbot config.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ai_usage_logs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid REFERENCES kennels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Qué llamada fue
  scope text NOT NULL CHECK (scope IN (
    'emailbot_reply',      -- bot respondiendo a un email
    'emailbot_test',       -- playground del dashboard
    'knowledge_import_url',-- extracción de web
    'knowledge_import_file',-- extracción de PDF/DOC
    'other'
  )),
  -- Modelo + provider
  provider text NOT NULL CHECK (provider IN ('anthropic','openai','google')),
  model text NOT NULL,

  -- Métricas
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  estimated_cost_usd numeric(10, 6) NOT NULL DEFAULT 0,

  -- Trazabilidad opcional (qué entidad disparó la llamada)
  thread_id uuid,                  -- hilo del bot
  knowledge_entry_id uuid,         -- entry creada como output
  request_meta jsonb,              -- prompt size, source url, etc.

  -- Estado
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success','error','timeout')),
  error_message text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_kennel_month
  ON ai_usage_logs(kennel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_scope
  ON ai_usage_logs(scope, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user
  ON ai_usage_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Solo el owner del kennel ve sus propios logs (vital para que el cliente
-- pueda ver su uso del mes y nadie más).
DROP POLICY IF EXISTS ai_usage_logs_select_owner ON ai_usage_logs;
CREATE POLICY ai_usage_logs_select_owner ON ai_usage_logs
  FOR SELECT TO authenticated
  USING (
    kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid())
  );

-- INSERT solo via service-role (los logs los escribe el server, no el cliente)
-- No declaramos policy de INSERT → bloqueado para anon/authenticated; el
-- admin client bypassa RLS.

COMMENT ON TABLE ai_usage_logs IS
  'Tracking de llamadas a IAs (Anthropic/OpenAI/Google). Base para billing por uso, dashboards de coste, y enforcement de cuotas mensuales por plan.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Helper: uso mensual por kennel (para badge "X / 500 respuestas")
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW kennel_bot_usage_current_month AS
SELECT
  k.id AS kennel_id,
  count(*) FILTER (WHERE l.scope = 'emailbot_reply' AND l.status = 'success') AS bot_replies_count,
  coalesce(sum(l.total_tokens) FILTER (WHERE l.status = 'success'), 0) AS tokens_total,
  coalesce(sum(l.estimated_cost_usd) FILTER (WHERE l.status = 'success'), 0) AS cost_usd_total
FROM kennels k
LEFT JOIN ai_usage_logs l
  ON l.kennel_id = k.id
  AND l.created_at >= date_trunc('month', now())
GROUP BY k.id;

COMMENT ON VIEW kennel_bot_usage_current_month IS
  'Agregado mes actual por kennel: respuestas del bot, tokens, coste estimado. Usar en /emailbot y /cuenta/facturacion.';
