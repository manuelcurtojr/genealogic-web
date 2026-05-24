-- ═══════════════════════════════════════════════════════════════════════════
-- Panel del Propietario — Fase B: transferencia automática al entregar
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cuando el criador marca puppy_reservations.status = 'delivered':
--
--  1. Si la reserva tiene client_user_id (cliente con cuenta) Y dog_id (cachorro
--     asignado) → mover dogs.owner_id al cliente + grabar
--     dogs.delivered_from_reservation_id como trazabilidad.
--  2. Si no se cumple alguna condición, no hace nada (la reserva pasa a
--     'delivered' igual, simplemente no aparece en /mis-perros del cliente).
--  3. Se respeta delivered_at si ya estaba puesto; si no, lo rellena con NOW().
--
-- El cliente entra a /mis-perros y ve el perro automáticamente, sin pasos
-- manuales. El perro deja de estar en el catálogo público del criador como
-- "criado por nosotros" (sale del kennel.dogs filtro porque cambia owner).
--
-- Idempotente: ejecutar este script múltiples veces no rompe nada.

CREATE OR REPLACE FUNCTION public.transfer_dog_on_reservation_delivered()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Solo si la transición es a 'delivered' (sea desde otro estado o nuevo).
  IF NEW.status <> 'delivered' THEN
    RETURN NEW;
  END IF;
  -- Si no hubo cambio real (UPDATE que mantenía 'delivered'), no repetir.
  IF TG_OP = 'UPDATE' AND OLD.status = 'delivered' THEN
    RETURN NEW;
  END IF;

  -- Rellenar delivered_at si no estaba
  IF NEW.delivered_at IS NULL THEN
    NEW.delivered_at := now();
  END IF;

  -- Transfer ownership solo si hay perro asignado Y cliente con cuenta
  IF NEW.dog_id IS NOT NULL AND NEW.client_user_id IS NOT NULL THEN
    UPDATE dogs
      SET owner_id = NEW.client_user_id,
          delivered_from_reservation_id = NEW.id
      WHERE id = NEW.dog_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservations_transfer_dog_on_delivered ON puppy_reservations;
CREATE TRIGGER reservations_transfer_dog_on_delivered
  BEFORE UPDATE ON puppy_reservations
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION public.transfer_dog_on_reservation_delivered();

-- También para INSERTs directos con status='delivered' (caso poco común
-- pero posible si el criador crea reserva ya cerrada para histórico)
DROP TRIGGER IF EXISTS reservations_transfer_dog_on_insert_delivered ON puppy_reservations;
CREATE TRIGGER reservations_transfer_dog_on_insert_delivered
  BEFORE INSERT ON puppy_reservations
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION public.transfer_dog_on_reservation_delivered();

COMMENT ON FUNCTION public.transfer_dog_on_reservation_delivered IS
  'Al marcar reserva como entregada, transfiere ownership del perro al client_user_id si ambos existen. Permite que el cliente vea su perro en /mis-perros sin acción manual.';
