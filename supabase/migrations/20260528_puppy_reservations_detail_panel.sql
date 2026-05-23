-- Schema completo para el side panel de detalle de reserva (estilo Pawdoq).
-- Añade columnas para: notas internas, asignación de cachorro, contratos,
-- razón de pérdida, propósito del solicitante, dirección postal, datos del
-- bot. Soporte para status 'lost' y 'refunded' en el check.

-- Acciones internas / timeline
ALTER TABLE puppy_reservations
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_in_full_at timestamptz,
  ADD COLUMN IF NOT EXISTS reservation_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reservation_contract_url text,
  ADD COLUMN IF NOT EXISTS purchase_contract_url text;

-- Asignación de cachorro real (referencia a dogs)
ALTER TABLE puppy_reservations
  ADD COLUMN IF NOT EXISTS puppy_dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS puppy_reservations_puppy_dog_id_idx ON puppy_reservations(puppy_dog_id);

-- Marcar como perdido
ALTER TABLE puppy_reservations
  ADD COLUMN IF NOT EXISTS lost_at timestamptz,
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS lost_reason_detail text;

-- Formulario inicial del solicitante
ALTER TABLE puppy_reservations
  ADD COLUMN IF NOT EXISTS applicant_purpose text,
  ADD COLUMN IF NOT EXISTS applicant_country text,
  ADD COLUMN IF NOT EXISTS applicant_address text,
  ADD COLUMN IF NOT EXISTS applicant_postal_code text,
  ADD COLUMN IF NOT EXISTS applicant_city text,
  ADD COLUMN IF NOT EXISTS applicant_id_doc_type text,
  ADD COLUMN IF NOT EXISTS applicant_id_doc_number text;

-- Bot (preparación para integración con emailbot)
ALTER TABLE puppy_reservations
  ADD COLUMN IF NOT EXISTS bot_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_last_active_at timestamptz,
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz,
  ADD COLUMN IF NOT EXISTS escalated_reason text;

-- Expandir status para soportar 'lost' y 'refunded'
ALTER TABLE puppy_reservations DROP CONSTRAINT IF EXISTS puppy_reservations_status_check;
ALTER TABLE puppy_reservations ADD CONSTRAINT puppy_reservations_status_check
  CHECK (status IN (
    'interested','waitlisted','deposit_paid',
    'assigned','contract_signed','paid_in_full','delivered',
    'cancelled','refunded','lost'
  ));

-- Comentario explicativo
COMMENT ON COLUMN puppy_reservations.puppy_dog_id IS 'Cachorro concreto asignado a esta reserva (FK a dogs). Solo se rellena cuando status >= assigned.';
COMMENT ON COLUMN puppy_reservations.bot_enabled IS 'Si está activo, el emailbot puede responder automáticamente en esta conversación. Default false hasta que el criador lo active.';
COMMENT ON COLUMN puppy_reservations.escalated_at IS 'Timestamp cuando el bot derivó la conversación a humano. NULL = no escalada.';
