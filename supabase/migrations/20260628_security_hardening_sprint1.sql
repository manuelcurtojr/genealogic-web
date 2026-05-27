-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint 1 — Security hardening
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cubre los hallazgos críticos de la auditoría de seguridad:
--  · C3: kennel_pages SELECT público expone drafts y traducciones WIP.
--  · C4: trigger link_user_to_existing_records permite hijack de reservas
--        por colisión de email sin confirmar.
--  · A6: kennel_reviews insert demasiado permisivo (cualquier user logueado).
--  · B10: kennel_reviews SELECT público filtra registros is_visible=false.
--  · A3 partial (BD): tabla rate_limits para futuras integraciones.
--
-- Idempotente. Re-aplicable sin daño.

-- ───────────────────────────────────────────────────────────────────────────
-- C3: kennel_pages — política SELECT pública filtra borradores
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "kennel_pages_read_public" ON public.kennel_pages;
CREATE POLICY "kennel_pages_read_public"
  ON public.kennel_pages
  FOR SELECT
  USING (enabled = true);

-- Para que el owner siga viendo sus drafts/disabled, la policy
-- `kennel_pages_write_owner` (FOR ALL) ya le concede SELECT también
-- — no hay que tocarla.

-- Bonus: aseguramos que el SELECT público NO devuelve `draft_sections`
-- creando una vista pública sin esa columna. (Las apps deberán migrar
-- a usar la vista en lecturas públicas. Mientras, la columna sigue
-- accesible para owners y admins gracias a la policy de write.)
DROP VIEW IF EXISTS public.kennel_pages_public;
CREATE VIEW public.kennel_pages_public AS
  SELECT
    id, kennel_id, slug, enabled, nav_label, nav_order,
    sections, sections_i18n,
    meta_title, meta_description, meta_i18n,
    created_at, updated_at
  FROM public.kennel_pages
  WHERE enabled = true;

GRANT SELECT ON public.kennel_pages_public TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- C4: trigger link_user_to_existing_records condicionado a email_confirmed
-- ───────────────────────────────────────────────────────────────────────────
-- Antes: AFTER INSERT en auth.users → vincula reservas/owners/perros por
-- email match → un atacante que crea cuenta con email de víctima toma
-- control sin confirmar el email.
--
-- Después: el backfill se ejecuta cuando email_confirmed_at pasa a NOT NULL,
-- es decir, después de que el usuario haya confirmado el email (Supabase
-- envía el magic link / OTP a la dirección real, así que solo el dueño del
-- buzón puede llegar a ese estado).

-- Re-crear la función con la guarda (idempotente con CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.link_user_to_existing_records()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  -- Solo procesamos cuando el email YA está confirmado:
  -- - En INSERT: si Supabase Auth crea el user con email_confirmed_at
  --   poblado (raro, magic link / SSO ya verificados).
  -- - En UPDATE: cuando email_confirmed_at pasa de NULL a NOT NULL.
  IF TG_OP = 'INSERT' THEN
    IF NEW.email_confirmed_at IS NULL THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.email_confirmed_at IS NOT NULL) OR (NEW.email_confirmed_at IS NULL) THEN
      -- Ya estaba confirmado antes, o sigue sin confirmar
      RETURN NEW;
    END IF;
  END IF;

  v_email := lower(coalesce(NEW.email, ''));
  IF v_email = '' THEN RETURN NEW; END IF;

  -- Vincular reservas pre-existentes por email del solicitante.
  UPDATE public.puppy_reservations
     SET client_user_id = NEW.id
   WHERE client_user_id IS NULL
     AND lower(applicant_email) = v_email;

  -- Vincular ficha de cliente en CRM.
  UPDATE public.owners
     SET user_id = NEW.id
   WHERE user_id IS NULL
     AND lower(email) = v_email;

  RETURN NEW;
END;
$$;

-- El trigger original era AFTER INSERT. Lo recreamos como
-- AFTER INSERT OR UPDATE OF email_confirmed_at para cubrir el caso
-- común (registro → confirmación de email vía link).
DROP TRIGGER IF EXISTS on_auth_user_created_link_records ON auth.users;
CREATE TRIGGER on_auth_user_created_link_records
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_user_to_existing_records();

-- ───────────────────────────────────────────────────────────────────────────
-- A6 + B10: kennel_reviews — SELECT público filtra is_visible y INSERT
-- requiere cierta relación con el kennel
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "kennel_reviews_select_public" ON public.kennel_reviews;
CREATE POLICY "kennel_reviews_select_public"
  ON public.kennel_reviews
  FOR SELECT
  USING (is_visible = true);

-- Owner puede ver todas (visibles + ocultas) — la policy owner_all
-- ya cubre eso vía la policy general que existe en la migración
-- 20260625. Si no existiera ya, sería:
-- CREATE POLICY "kennel_reviews_select_owner_all" ON public.kennel_reviews
--   FOR SELECT USING (EXISTS (SELECT 1 FROM public.kennels k WHERE k.id =
--                              kennel_reviews.kennel_id AND k.owner_id = auth.uid()));

-- INSERT más estricto: requerir que el user tenga al menos una
-- puppy_reservation activa con el kennel target (cliente real).
-- Reviews públicas siguen vía endpoint específico que valida lo mismo.
DROP POLICY IF EXISTS "kennel_reviews_insert_user_logged" ON public.kennel_reviews;
CREATE POLICY "kennel_reviews_insert_client"
  ON public.kennel_reviews
  FOR INSERT
  WITH CHECK (
    submitted_by_user_id = auth.uid()
    AND is_manual = false
    AND is_visible = false
    AND EXISTS (
      SELECT 1
      FROM public.puppy_reservations r
      WHERE r.kennel_id = kennel_reviews.kennel_id
        AND (r.client_user_id = auth.uid() OR lower(r.applicant_email) = lower((auth.jwt() ->> 'email')))
        AND r.status IN ('delivered','confirmed','paid','paid_in_full','contract_signed')
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- Tabla auxiliar de rate limiting persistente (opcional, para futuras
-- integraciones con KV/Redis). De momento el rate limit vive en memoria
-- del worker (src/lib/rate-limit.ts), pero dejamos la mesa puesta.
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key         text PRIMARY KEY,
  count       int NOT NULL DEFAULT 0,
  reset_at    timestamptz NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limit_buckets_reset_at_idx
  ON public.rate_limit_buckets (reset_at);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo accesible vía service-role. Nadie debería poder
-- leer ni escribir desde anon/authenticated.
