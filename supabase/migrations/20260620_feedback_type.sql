-- ═══════════════════════════════════════════════════════════════════════════
-- admin_requests: añadir tipo 'feedback' + source 'feedback_widget'
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Habilita el widget "¿Algo ha salido mal?" embebido en zonas críticas de la
-- web (importer, formularios de perro, camadas, transferencias, reservas).
--
-- Reusamos la tabla admin_requests para que feedback + soporte + claims
-- vivan en el mismo inbox del super admin. Diferenciamos por:
--   - type='feedback'                       → categoría visual
--   - source='feedback_widget'              → origen
--   - source_metadata.scope                 → 'importer' / 'dog_form' / 'litter_form' / 'transfer' / 'reservation' / etc.
--   - source_metadata.viewport / user_agent → debug data
--   - source_metadata.ai_conversation       → si el user habló con la IA antes (mensajes)
--
-- También extendemos:
--   - claim_must_have_target → 'feedback' se trata como 'support' (sin target obligatorio)
--   - source CHECK → admite 'feedback_widget'

-- 1) Drop and recreate type CHECK
ALTER TABLE public.admin_requests
  DROP CONSTRAINT IF EXISTS admin_requests_type_check;
ALTER TABLE public.admin_requests
  ADD CONSTRAINT admin_requests_type_check
  CHECK (type = ANY (ARRAY['support'::text, 'claim_dog'::text, 'claim_kennel'::text, 'feedback'::text]));

-- 2) Drop and recreate source CHECK
ALTER TABLE public.admin_requests
  DROP CONSTRAINT IF EXISTS admin_requests_source_check;
ALTER TABLE public.admin_requests
  ADD CONSTRAINT admin_requests_source_check
  CHECK (source = ANY (ARRAY[
    'manual'::text,
    'chatbot'::text,
    'kennel_page'::text,
    'dog_page'::text,
    'soporte_form'::text,
    'api'::text,
    'feedback_widget'::text
  ]));

-- 3) claim_must_have_target → feedback no necesita target (como support)
ALTER TABLE public.admin_requests
  DROP CONSTRAINT IF EXISTS claim_must_have_target;
ALTER TABLE public.admin_requests
  ADD CONSTRAINT claim_must_have_target CHECK (
    (
      type IN ('support', 'feedback')
      AND target_kennel_id IS NULL
      AND target_dog_id IS NULL
    )
    OR (type = 'claim_dog'  AND target_dog_id    IS NOT NULL AND target_kennel_id IS NULL)
    OR (type = 'claim_kennel' AND target_kennel_id IS NOT NULL AND target_dog_id    IS NULL)
  );

-- 4) Índice parcial para que el admin filtre rápido los feedback pendientes
CREATE INDEX IF NOT EXISTS admin_requests_feedback_pending_idx
  ON public.admin_requests (created_at DESC)
  WHERE type = 'feedback' AND status = 'pending';
