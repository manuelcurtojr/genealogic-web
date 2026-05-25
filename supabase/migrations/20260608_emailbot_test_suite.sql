-- ═══════════════════════════════════════════════════════════════════════════
-- Emailbot test suite — 3 tablas para el simulador de 16 perfiles
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cada run lanza una conversación simulada por cada perfil activo del kennel
-- (default: 16). Un Claude hace de "cliente ficticio" siguiendo una persona +
-- objetivo. El bot real (con la biblioteca del kennel) responde. Al final,
-- un evaluator LLM puntúa cada conversación con outcome esperado vs real,
-- bugs detectados y score 0-10.
--
-- Coste aproximado por run completo: ~1-2 USD (16 conversaciones × 6 turnos
-- × modelo elegido). Visible en /cuenta/facturación. Se logueará en
-- ai_usage_logs con scope='emailbot_test_suite' para tracking pero NO
-- cuenta hacia la cuota de respuestas reales del bot.
--
-- Inspirado en Pawdoq tenant-breeder (mismo modelo conceptual, adaptado a
-- kennel_id + cliente unificado multi-provider de Genealogic).

-- 1. Perfiles de cliente simulado ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.emailbot_test_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES public.kennels(id) ON DELETE CASCADE,

  name text NOT NULL,
  persona_description text NOT NULL,
  goal text NOT NULL,
  opening_message text NOT NULL,
  expected_outcome text NOT NULL,
  category text,
  initial_scenario jsonb NOT NULL DEFAULT '{}'::jsonb,

  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (kennel_id, name),
  CONSTRAINT emailbot_test_profiles_outcome_check CHECK (
    expected_outcome IN (
      'deposit_link_sent',  -- bot envía link de pago (closing)
      'escalated',          -- escala a humano (correcto)
      'waitlist_added',     -- queda en waitlist (consulta sin compra inmediata)
      'no_purchase',        -- conversación termina sin compra ni escalado
      'blocked'             -- bot rechazó intento dañino/inyección
    )
  ),
  CONSTRAINT emailbot_test_profiles_category_check CHECK (
    category IS NULL OR category IN ('happy_path','objection','edge_case','security')
  )
);
CREATE INDEX IF NOT EXISTS emailbot_test_profiles_kennel_idx
  ON public.emailbot_test_profiles (kennel_id, is_active);

-- 2. Runs (cada ejecución completa de la suite) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.emailbot_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES public.kennels(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,

  total_conversations int NOT NULL DEFAULT 0,
  passed int NOT NULL DEFAULT 0,
  failed int NOT NULL DEFAULT 0,
  total_cost_cents int NOT NULL DEFAULT 0,
  total_tokens_input int NOT NULL DEFAULT 0,
  total_tokens_output int NOT NULL DEFAULT 0,

  -- Modelo elegido para esta corrida (snapshot del kennels.bot_model al lanzarlo)
  bot_model text,

  notes text,
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT emailbot_test_runs_status_check CHECK (
    status IN ('running','completed','failed')
  )
);
CREATE INDEX IF NOT EXISTS emailbot_test_runs_kennel_idx
  ON public.emailbot_test_runs (kennel_id, started_at DESC);

-- 3. Conversaciones (una por perfil dentro de un run) ────────────────────
CREATE TABLE IF NOT EXISTS public.emailbot_test_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES public.kennels(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES public.emailbot_test_runs(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.emailbot_test_profiles(id) ON DELETE SET NULL,
  profile_name text NOT NULL,

  -- transcript: [{ role: 'client'|'bot'|'system', content, tokens_in?, tokens_out? }]
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,

  outcome text,
  expected_outcome text,
  passed boolean,
  score int,

  evaluator_analysis text,
  bugs_detected jsonb NOT NULL DEFAULT '[]'::jsonb,

  total_turns int NOT NULL DEFAULT 0,
  cost_cents int NOT NULL DEFAULT 0,
  tokens_input int NOT NULL DEFAULT 0,
  tokens_output int NOT NULL DEFAULT 0,

  error text,

  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,

  CONSTRAINT emailbot_test_conversations_score_check CHECK (
    score IS NULL OR (score >= 0 AND score <= 10)
  )
);
CREATE INDEX IF NOT EXISTS emailbot_test_conversations_run_idx
  ON public.emailbot_test_conversations (run_id, created_at);
CREATE INDEX IF NOT EXISTS emailbot_test_conversations_kennel_idx
  ON public.emailbot_test_conversations (kennel_id, created_at DESC);

-- 4. RLS — solo el owner del kennel ve sus tests ──────────────────────────
ALTER TABLE public.emailbot_test_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emailbot_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emailbot_test_conversations ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['emailbot_test_profiles','emailbot_test_runs','emailbot_test_conversations'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %s_select_owner ON public.%s;', t, t);
    EXECUTE format(
      'CREATE POLICY %s_select_owner ON public.%s FOR SELECT TO authenticated USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS %s_all_owner ON public.%s;', t, t);
    EXECUTE format(
      'CREATE POLICY %s_all_owner ON public.%s FOR ALL TO authenticated USING (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid())) WITH CHECK (kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid()));',
      t, t
    );
  END LOOP;
END $$;

-- 5. Trigger updated_at en profiles ────────────────────────────────────────
DROP TRIGGER IF EXISTS emailbot_test_profiles_updated_at ON public.emailbot_test_profiles;
CREATE TRIGGER emailbot_test_profiles_updated_at
  BEFORE UPDATE ON public.emailbot_test_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE public.emailbot_test_profiles IS
  'Biblioteca de perfiles de cliente ficticio para el test suite del emailbot. Default: 16 perfiles sembrados al primer acceso del kennel.';
COMMENT ON TABLE public.emailbot_test_runs IS
  'Ejecuciones completas del test suite. Agrupa N conversaciones (una por perfil activo).';
COMMENT ON TABLE public.emailbot_test_conversations IS
  'Conversaciones simuladas con scoring del LLM evaluador. Una por (run, profile).';
