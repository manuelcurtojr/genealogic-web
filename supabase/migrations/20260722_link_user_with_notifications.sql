-- ═══════════════════════════════════════════════════════════════════════════
-- Notificaciones retroactivas al registrarse el cliente
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Problema: cuando un cliente recibe un email contract_sent y se registra
-- en Genealogic con ese mismo email, el trigger
-- `link_user_to_existing_records` (definido en 20260601_client_panel_phase_a)
-- vincula `puppy_reservations.client_user_id = new user.id`. Pero las
-- notificaciones generadas POR los eventos pasados (contract_sent,
-- payment_new, etc.) NO se crearon en su momento porque client_user_id
-- era NULL — los triggers de notificación tienen un IF
-- `client_user_id IS NOT NULL` que las salta.
--
-- Resultado: el cliente se registra, ve la reserva en /mis-reservas pero
-- la campana está vacía. Tampoco hay notificación que le redirija a
-- firmar el contrato pendiente.
--
-- Solución: reescribir `link_user_to_existing_records` para que, además
-- de vincular las filas, INSERTE las notificaciones retroactivas que
-- correspondan al estado actual de cada reserva/contrato/pago vinculado.
--
-- Solo se crean notificaciones para eventos que SIGUEN SIENDO RELEVANTES
-- (contratos sent o signed_partial sin firma del cliente; pagos pending;
-- perro asignado pero no entregado). Ignoramos eventos ya completados
-- (entregado, contract_signed_full) para no spamear.

CREATE OR REPLACE FUNCTION public.link_user_to_existing_records()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
  v_reservation_ids uuid[];
  v_kennel_name text;
  v_contract record;
  v_payment record;
  v_reservation record;
BEGIN
  v_email := lower(coalesce(NEW.email, ''));
  IF v_email = '' THEN
    RETURN NEW;
  END IF;

  -- ── 1) Vincular reservas pendientes por email ──
  -- Capturamos los IDs vinculados para procesar después.
  WITH updated AS (
    UPDATE puppy_reservations
       SET client_user_id = NEW.id
     WHERE client_user_id IS NULL
       AND lower(applicant_email) = v_email
    RETURNING id
  )
  SELECT array_agg(id) INTO v_reservation_ids FROM updated;

  -- ── 2) Vincular contactos CRM por email ──
  UPDATE owners
     SET user_id = NEW.id
   WHERE user_id IS NULL
     AND lower(email) = v_email;

  -- ── 3) Notificaciones retroactivas para cada reserva vinculada ──
  IF v_reservation_ids IS NOT NULL AND array_length(v_reservation_ids, 1) > 0 THEN
    FOR v_reservation IN
      SELECT pr.*, k.name AS kennel_name
        FROM puppy_reservations pr
        LEFT JOIN kennels k ON k.id = pr.kennel_id
       WHERE pr.id = ANY(v_reservation_ids)
    LOOP
      v_kennel_name := coalesce(v_reservation.kennel_name, 'el criadero');

      -- 3a) Una notificación de bienvenida por cada reserva vinculada —
      --     que el cliente vea SU reserva en /mis-reservas. Solo si la
      --     reserva está activa (no cancelled).
      IF v_reservation.status NOT IN ('cancelled') THEN
        PERFORM create_notification(
          NEW.id,
          'reservation_status',
          'Tu reserva con ' || v_kennel_name,
          'Esta reserva ahora está vinculada a tu cuenta. Aquí podrás firmar contratos, ver pagos y mensajearte con el criador.',
          '/mis-reservas/' || v_reservation.id
        );
      END IF;

      -- 3b) Contratos pendientes de firma del cliente — sent o signed_partial
      --     con signed_at_client IS NULL.
      FOR v_contract IN
        SELECT id, kind, status, signed_at_breeder, signed_at_client
          FROM reservation_contracts
         WHERE reservation_id = v_reservation.id
           AND status IN ('sent', 'signed_partial')
           AND signed_at_client IS NULL
      LOOP
        PERFORM create_notification(
          NEW.id,
          'contract_sent',
          'Contrato pendiente de firma',
          CASE
            WHEN v_contract.kind = 'delivery'
              THEN 'Tienes el contrato de compraventa y entrega de ' || v_kennel_name || ' listo para firmar.'
            ELSE 'Tienes el contrato de reserva de ' || v_kennel_name || ' listo para firmar.'
          END,
          '/mis-reservas/' || v_reservation.id || '/contrato'
        );
      END LOOP;

      -- 3c) Pagos pendientes — status pending o requested
      FOR v_payment IN
        SELECT id, amount_cents, currency, description, type
          FROM reservation_payments
         WHERE reservation_id = v_reservation.id
           AND status IN ('pending', 'requested')
      LOOP
        PERFORM create_notification(
          NEW.id,
          'payment_new',
          'Pago pendiente: ' || to_char(v_payment.amount_cents / 100.0, 'FM999G999D00') || ' ' || coalesce(v_payment.currency, 'EUR'),
          coalesce(v_payment.description, 'Pago para tu reserva con ' || v_kennel_name),
          '/mis-reservas/' || v_reservation.id || '/pagos'
        );
      END LOOP;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- El trigger ya existe (definido en 20260601), solo reemplazamos la
-- función. No hay que recrear el trigger.

COMMENT ON FUNCTION public.link_user_to_existing_records IS
  'Trigger AFTER INSERT en auth.users: vincula puppy_reservations + owners por email, '
  'y crea notificaciones retroactivas (contratos pendientes de firma, pagos pendientes) '
  'para que el cliente recién registrado vea su estado actual en la campana.';


-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger inverso: BEFORE INSERT puppy_reservations → auto-link si el
-- applicant_email matchea con un auth.users ya existente.
--
-- Cubre el caso B: cliente que YA tenía cuenta (compró antes a otro
-- criador, etc.) y rellena un nuevo lead. Sin este trigger, su reserva
-- quedaba con client_user_id=NULL hasta que volviera a registrarse (cosa
-- que no pasa, ya tiene cuenta). Y las notificaciones del contrato nunca
-- le llegarían.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_link_reservation_to_existing_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Solo si la reserva entra sin client_user_id explícito y tiene email
  IF NEW.client_user_id IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.applicant_email IS NULL OR trim(NEW.applicant_email) = '' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_user_id
    FROM auth.users
   WHERE lower(email) = lower(NEW.applicant_email)
   LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    NEW.client_user_id := v_user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservations_auto_link_to_user ON puppy_reservations;
CREATE TRIGGER reservations_auto_link_to_user
  BEFORE INSERT ON puppy_reservations
  FOR EACH ROW EXECUTE FUNCTION public.auto_link_reservation_to_existing_user();

COMMENT ON FUNCTION public.auto_link_reservation_to_existing_user IS
  'BEFORE INSERT puppy_reservations: si applicant_email matchea un auth.users existente, rellena client_user_id automáticamente. Cubre el caso del cliente que ya tenía cuenta antes del lead.';
