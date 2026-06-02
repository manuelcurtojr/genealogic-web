-- Nota interna del criador sobre un lead/reserva (no visible para el cliente).
alter table public.puppy_reservations add column if not exists internal_note text;
