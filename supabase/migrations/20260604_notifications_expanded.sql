-- ═══════════════════════════════════════════════════════════════════════════
-- Notificaciones — expansión a todo el ciclo de vida del producto
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Triggers DB que insertan en `notifications` para los eventos clave que
-- antes pasaban silenciosos. El UI de /notifications + el panel lateral
-- los renderiza con su icono según `type`.
--
-- Tipos de notificación añadidos:
--   reservation_new     — nueva solicitud de reserva (criador)
--   reservation_status  — cambio de status (cliente)
--   reservation_dog     — cachorro asignado (cliente)
--   message_new         — mensaje nuevo en hilo (ambos lados según sender)
--   contract_sent       — criador envió contrato (cliente)
--   contract_signed     — alguna parte firmó (lado contrario)
--   payment_new         — nuevo pago creado (cliente)
--   payment_paid        — pago marcado/recibido (criador)
--   document_new        — documento nuevo del perro (owner)
--   litter_new          — nueva camada registrada (criador)
--   dog_received        — perro entregado oficialmente al cliente
--
-- Idempotente: cada función + trigger se recrea con DROP IF EXISTS.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper genérico: insertar notificación con validación básica
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO notifications(user_id, type, title, message, link, is_read, created_at)
    VALUES (p_user_id, p_type, p_title, p_message, p_link, false, now())
    RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RESERVAS — nueva solicitud (criador) + cambio de status (cliente)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_reservation_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_kennel_owner uuid;
  v_kennel_name text;
  v_status_label text;
BEGIN
  -- Owner del kennel para notificarle a él
  SELECT owner_id, name INTO v_kennel_owner, v_kennel_name
    FROM kennels WHERE id = NEW.kennel_id;

  -- INSERT: nueva solicitud → notif al criador
  IF TG_OP = 'INSERT' THEN
    IF v_kennel_owner IS NOT NULL THEN
      PERFORM create_notification(
        v_kennel_owner,
        'reservation_new',
        'Nueva solicitud de reserva',
        coalesce(NEW.applicant_name, NEW.applicant_email, 'Cliente nuevo') ||
          coalesce(' (' || NEW.applicant_email || ')', ''),
        '/reservas/' || NEW.id
      );
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: cambio de status → notif al cliente (si tiene cuenta) + al criador si fue cliente
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_status_label := CASE NEW.status
      WHEN 'interested' THEN 'Solicitud recibida'
      WHEN 'deposit_paid' THEN 'Señal confirmada'
      WHEN 'assigned' THEN 'Cachorro asignado'
      WHEN 'contract_signed' THEN 'Contrato firmado'
      WHEN 'paid_in_full' THEN 'Pago completo recibido'
      WHEN 'delivered' THEN 'Perro entregado'
      WHEN 'cancelled' THEN 'Reserva cancelada'
      WHEN 'lost' THEN 'Reserva archivada'
      ELSE 'Estado actualizado: ' || NEW.status
    END;

    -- Cliente
    IF NEW.client_user_id IS NOT NULL THEN
      PERFORM create_notification(
        NEW.client_user_id,
        CASE WHEN NEW.status = 'delivered' THEN 'dog_received'
             WHEN NEW.status = 'assigned' THEN 'reservation_dog'
             ELSE 'reservation_status' END,
        v_status_label,
        'Tu reserva con ' || coalesce(v_kennel_name, 'el criadero') || ' ha cambiado de estado',
        '/mis-reservas/' || NEW.id
      );
    END IF;

    -- Cuando se asigna un perro (dog_id pasa de NULL a algo), notif extra al cliente
    IF NEW.dog_id IS NOT NULL AND (OLD.dog_id IS NULL OR OLD.dog_id <> NEW.dog_id)
       AND NEW.client_user_id IS NOT NULL THEN
      PERFORM create_notification(
        NEW.client_user_id,
        'reservation_dog',
        'Te han asignado un cachorro 🐶',
        'Ya tienes cachorro específico en tu reserva con ' || coalesce(v_kennel_name, 'el criadero'),
        '/mis-reservas/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservations_notify_insert ON puppy_reservations;
CREATE TRIGGER reservations_notify_insert
  AFTER INSERT ON puppy_reservations
  FOR EACH ROW EXECUTE FUNCTION public.notify_reservation_changes();

DROP TRIGGER IF EXISTS reservations_notify_update ON puppy_reservations;
CREATE TRIGGER reservations_notify_update
  AFTER UPDATE ON puppy_reservations
  FOR EACH ROW EXECUTE FUNCTION public.notify_reservation_changes();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. MENSAJES — notificar al lado opuesto
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_message_received()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reservation puppy_reservations%ROWTYPE;
  v_kennel_owner uuid;
  v_kennel_name text;
  v_target uuid;
  v_link text;
  v_preview text;
BEGIN
  -- Solo notif para mensajes humanos (client/breeder); system y bot no
  IF NEW.sender_role NOT IN ('client', 'breeder') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_reservation FROM puppy_reservations WHERE id = NEW.reservation_id;
  SELECT owner_id, name INTO v_kennel_owner, v_kennel_name
    FROM kennels WHERE id = NEW.kennel_id;

  v_preview := substr(NEW.body, 1, 120);

  IF NEW.sender_role = 'client' THEN
    -- Mensaje del cliente → notif al criador
    v_target := v_kennel_owner;
    v_link := '/reservas/' || NEW.reservation_id;
  ELSE
    -- Mensaje del criador → notif al cliente
    v_target := v_reservation.client_user_id;
    v_link := '/mis-reservas/' || NEW.reservation_id;
  END IF;

  IF v_target IS NOT NULL AND v_target <> coalesce(NEW.sender_user_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    PERFORM create_notification(
      v_target,
      'message_new',
      'Mensaje de ' || coalesce(NEW.sender_name,
        CASE WHEN NEW.sender_role = 'client' THEN v_reservation.applicant_name
             ELSE v_kennel_name END,
        'Genealogic'),
      v_preview,
      v_link
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_notify_on_insert ON reservation_messages;
CREATE TRIGGER messages_notify_on_insert
  AFTER INSERT ON reservation_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_message_received();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CONTRATOS — sent y firmas
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_contract_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reservation puppy_reservations%ROWTYPE;
  v_kennel_owner uuid;
  v_kennel_name text;
BEGIN
  SELECT * INTO v_reservation FROM puppy_reservations WHERE id = NEW.reservation_id;
  SELECT owner_id, name INTO v_kennel_owner, v_kennel_name
    FROM kennels WHERE id = NEW.kennel_id;

  -- Status pasó a 'sent' → notif al cliente
  IF NEW.status = 'sent' AND OLD.status IS DISTINCT FROM 'sent'
     AND v_reservation.client_user_id IS NOT NULL THEN
    PERFORM create_notification(
      v_reservation.client_user_id,
      'contract_sent',
      'Contrato listo para firmar',
      coalesce(v_kennel_name, 'El criadero') || ' ha enviado el contrato. Revísalo y fírmalo.',
      '/mis-reservas/' || NEW.reservation_id || '/contrato'
    );
  END IF;

  -- Criador firmó → notif al cliente
  IF NEW.signed_at_breeder IS NOT NULL AND OLD.signed_at_breeder IS NULL
     AND v_reservation.client_user_id IS NOT NULL THEN
    PERFORM create_notification(
      v_reservation.client_user_id,
      'contract_signed',
      'El criador ha firmado el contrato',
      coalesce(NEW.signature_breeder_name, v_kennel_name, 'El criador') || ' firmó. Falta tu firma.',
      '/mis-reservas/' || NEW.reservation_id || '/contrato'
    );
  END IF;

  -- Cliente firmó → notif al criador
  IF NEW.signed_at_client IS NOT NULL AND OLD.signed_at_client IS NULL
     AND v_kennel_owner IS NOT NULL THEN
    PERFORM create_notification(
      v_kennel_owner,
      'contract_signed',
      'El cliente ha firmado el contrato',
      coalesce(NEW.signature_client_name, v_reservation.applicant_name, 'El cliente') || ' firmó el contrato.',
      '/reservas/' || NEW.reservation_id || '/contrato'
    );
  END IF;

  -- Firmado completo por ambas partes
  IF NEW.status = 'signed_full' AND OLD.status IS DISTINCT FROM 'signed_full' THEN
    IF v_reservation.client_user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_reservation.client_user_id,
        'contract_signed',
        '✓ Contrato completo',
        'El contrato ya está firmado por ambas partes.',
        '/mis-reservas/' || NEW.reservation_id || '/contrato'
      );
    END IF;
    IF v_kennel_owner IS NOT NULL THEN
      PERFORM create_notification(
        v_kennel_owner,
        'contract_signed',
        '✓ Contrato completo',
        'El contrato con ' || coalesce(v_reservation.applicant_name, 'el cliente') || ' está firmado.',
        '/reservas/' || NEW.reservation_id || '/contrato'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contracts_notify_on_update ON reservation_contracts;
CREATE TRIGGER contracts_notify_on_update
  AFTER UPDATE ON reservation_contracts
  FOR EACH ROW EXECUTE FUNCTION public.notify_contract_changes();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PAGOS — nuevo pago (cliente) + pagado (criador)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_payment_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_reservation puppy_reservations%ROWTYPE;
  v_kennel_owner uuid;
  v_kennel_name text;
  v_amount_str text;
BEGIN
  SELECT * INTO v_reservation FROM puppy_reservations WHERE id = NEW.reservation_id;
  SELECT owner_id, name INTO v_kennel_owner, v_kennel_name
    FROM kennels WHERE id = NEW.kennel_id;

  v_amount_str := to_char(NEW.amount_cents / 100.0, 'FM999G999D00') || ' ' || coalesce(NEW.currency, 'EUR');

  -- INSERT: nuevo pago creado → notif al cliente
  IF TG_OP = 'INSERT' AND v_reservation.client_user_id IS NOT NULL THEN
    PERFORM create_notification(
      v_reservation.client_user_id,
      'payment_new',
      'Nuevo pago pendiente: ' || v_amount_str,
      coalesce(NEW.description, 'Pago para tu reserva con ' || coalesce(v_kennel_name, 'el criadero')),
      '/mis-reservas/' || NEW.reservation_id || '/pagos'
    );
  END IF;

  -- UPDATE: cambio a paid → notif al criador
  IF TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid'
     AND v_kennel_owner IS NOT NULL THEN
    PERFORM create_notification(
      v_kennel_owner,
      'payment_paid',
      'Pago recibido: ' || v_amount_str,
      coalesce(v_reservation.applicant_name, 'El cliente') || ' completó el pago' ||
        coalesce(' vía ' || NEW.paid_via, '') || '.',
      '/reservas/' || NEW.reservation_id || '/pagos'
    );
    -- También notif al cliente confirmando
    IF v_reservation.client_user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_reservation.client_user_id,
        'payment_paid',
        '✓ Pago confirmado: ' || v_amount_str,
        'Tu pago ha sido registrado.',
        '/mis-reservas/' || NEW.reservation_id || '/pagos'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_notify_insert ON reservation_payments;
CREATE TRIGGER payments_notify_insert
  AFTER INSERT ON reservation_payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_changes();

DROP TRIGGER IF EXISTS payments_notify_update ON reservation_payments;
CREATE TRIGGER payments_notify_update
  AFTER UPDATE ON reservation_payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_changes();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. DOG DOCUMENTS — notif al owner si visible_to_owner=true
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_dog_document_new()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_dog_owner uuid;
  v_dog_name text;
BEGIN
  IF NEW.visible_to_owner IS NOT TRUE THEN RETURN NEW; END IF;

  SELECT owner_id, name INTO v_dog_owner, v_dog_name FROM dogs WHERE id = NEW.dog_id;

  -- No notificar al uploader sobre su propio upload
  IF v_dog_owner IS NULL OR v_dog_owner = NEW.uploaded_by THEN RETURN NEW; END IF;

  PERFORM create_notification(
    v_dog_owner,
    'document_new',
    'Nuevo documento: ' || NEW.title,
    'Documento añadido a ' || coalesce(v_dog_name, 'tu perro'),
    '/mis-perros/' || NEW.dog_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dog_documents_notify ON dog_documents;
CREATE TRIGGER dog_documents_notify
  AFTER INSERT ON dog_documents
  FOR EACH ROW EXECUTE FUNCTION public.notify_dog_document_new();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CAMADAS — notif al criador cuando se crea (auto-confirm)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_litter_new()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_kennel_owner uuid;
BEGIN
  SELECT owner_id INTO v_kennel_owner FROM kennels WHERE id = NEW.kennel_id;
  IF v_kennel_owner IS NULL THEN RETURN NEW; END IF;

  PERFORM create_notification(
    v_kennel_owner,
    'litter_new',
    'Nueva camada registrada',
    coalesce(NEW.name, 'Camada')
      || coalesce(' (' || NEW.puppy_count::text || ' cachorros)', ''),
    '/litters/' || NEW.id
  );

  RETURN NEW;
END;
$$;

-- Solo si la tabla litters tiene la columna name (defensa por entornos antiguos)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'litters'
  ) THEN
    DROP TRIGGER IF EXISTS litters_notify_insert ON litters;
    CREATE TRIGGER litters_notify_insert
      AFTER INSERT ON litters
      FOR EACH ROW EXECUTE FUNCTION public.notify_litter_new();
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Índice de performance (si no existe ya)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
  ON notifications(user_id, is_read, created_at DESC);

COMMENT ON FUNCTION public.create_notification IS
  'Inserta una notificación validando user_id no null. Usado por los triggers de Fase D.';
