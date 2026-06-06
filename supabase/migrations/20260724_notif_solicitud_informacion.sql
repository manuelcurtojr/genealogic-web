-- Renombrar el título de la notificación que llega al criador cuando se
-- recibe un formulario de contacto: "Nueva solicitud de reserva" →
-- "Nueva solicitud de información". El formulario público es de contacto
-- (no de reserva firme), así que "reserva" inducía a confusión al criador.
--
-- También retocamos las notificaciones existentes en BD para que el
-- histórico cuadre con la nueva copy.
--
-- Solo cambia el title — el resto de la lógica (mensaje, link, ruta,
-- email) se queda igual.

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
        'Nueva solicitud de información',
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

-- Backfill: actualizar notificaciones históricas para que cuadre la copy
UPDATE notifications
SET title = 'Nueva solicitud de información'
WHERE type = 'reservation_new'
  AND title = 'Nueva solicitud de reserva';
