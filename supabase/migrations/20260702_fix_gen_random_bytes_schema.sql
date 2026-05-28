-- Fix: newsletter_subscribers_ensure_token() llamaba a gen_random_bytes()
-- sin prefijo de schema. pgcrypto vive en `extensions` (no en `public`),
-- por lo que el trigger fallaba con
--   ERROR 42883: function gen_random_bytes(integer) does not exist
-- Esto BLOQUEABA todo INSERT en puppy_reservations (porque
-- auto_subscribe_reservation_applicant() llamaba a este trigger).
-- Resultado: ningún kennel recibía leads de su formulario público
-- desde que se desplazó pgcrypto al schema extensions.

CREATE OR REPLACE FUNCTION public.newsletter_subscribers_ensure_token()
RETURNS trigger LANGUAGE plpgsql AS $func$
BEGIN
  IF NEW.unsubscribe_token IS NULL THEN
    NEW.unsubscribe_token := encode(extensions.gen_random_bytes(24), 'hex');
  END IF;
  RETURN NEW;
END;
$func$;
