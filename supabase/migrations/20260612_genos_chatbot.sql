-- ═══════════════════════════════════════════════════════════════════════════
-- Genos · Chatbot asistente de Genealogic
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Persistencia de conversaciones del chatbot embebido "Genos".
-- Cada user puede tener N conversaciones (típicamente 1 activa abierta).
-- Cuando el user pide "hablar con un humano", se crea una admin_request
-- de tipo 'support' con source='chatbot' y el transcript en source_metadata.

CREATE TABLE IF NOT EXISTS public.genos_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text, -- generado del primer mensaje
  context_url text, -- la URL desde la que abrió el chat
  escalated_to_request_id uuid REFERENCES public.admin_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_genos_conv_user ON public.genos_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.genos_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.genos_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tokens_in int,
  tokens_out int,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_genos_msg_conv ON public.genos_messages(conversation_id, created_at);

-- ─── RLS ───
ALTER TABLE public.genos_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genos_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS genos_conv_owner_all ON public.genos_conversations;
CREATE POLICY genos_conv_owner_all ON public.genos_conversations
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS genos_msg_owner_select ON public.genos_messages;
CREATE POLICY genos_msg_owner_select ON public.genos_messages
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.genos_conversations c
      WHERE c.id = genos_messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS genos_msg_owner_insert ON public.genos_messages;
CREATE POLICY genos_msg_owner_insert ON public.genos_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.genos_conversations c
      WHERE c.id = genos_messages.conversation_id
        AND (c.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- Trigger updated_at en conversations cuando llega nuevo mensaje
CREATE OR REPLACE FUNCTION public.genos_touch_conv_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.genos_conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_genos_msg_touch ON public.genos_messages;
CREATE TRIGGER trg_genos_msg_touch
  AFTER INSERT ON public.genos_messages
  FOR EACH ROW EXECUTE FUNCTION public.genos_touch_conv_updated_at();
