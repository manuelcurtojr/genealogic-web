-- Permite que un visitante anónimo (lead) cree una "solicitud" desde el
-- perfil público del criadero. Antes, puppy_reservations solo soportaba
-- registros creados por el criador (CRM interno). Ahora también captura
-- leads entrantes via formulario público.

ALTER TABLE puppy_reservations
  ADD COLUMN IF NOT EXISTS applicant_name text,
  ADD COLUMN IF NOT EXISTS applicant_email text,
  ADD COLUMN IF NOT EXISTS applicant_phone text,
  ADD COLUMN IF NOT EXISTS applicant_message text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'public_form', 'emailbot', 'api'));

CREATE INDEX IF NOT EXISTS puppy_reservations_source_idx ON puppy_reservations(source);
CREATE INDEX IF NOT EXISTS puppy_reservations_kennel_status_idx ON puppy_reservations(kennel_id, status);

-- NO se añade policy de INSERT público — las solicitudes vienen via
-- API route con service_role para poder validar/rate-limit/captcha en
-- el futuro. La policy de INSERT actual sigue requiriendo auth.
