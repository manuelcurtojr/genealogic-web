-- Dos contratos por reserva (reserva + entrega) y entidad legal completa del criador.

-- 1) reservation_contracts: tipo de contrato
alter table public.reservation_contracts
  add column if not exists kind text not null default 'reservation';
alter table public.reservation_contracts drop constraint if exists reservation_contracts_kind_check;
alter table public.reservation_contracts
  add constraint reservation_contracts_kind_check check (kind in ('reservation', 'delivery'));

-- Permitir 1 contrato de reserva + 1 de entrega por reserva:
-- quitar el UNIQUE(reservation_id) y poner UNIQUE(reservation_id, kind).
alter table public.reservation_contracts drop constraint if exists reservation_contracts_reservation_id_key;
create unique index if not exists uniq_contract_reservation_kind
  on public.reservation_contracts(reservation_id, kind);

-- 2) kennels: entidad legal para rellenar los contratos
alter table public.kennels
  add column if not exists legal_representative    text,  -- D. Manuel Curtó Richini-Fuster
  add column if not exists legal_representative_id text,  -- DNI del representante
  add column if not exists sign_city               text,  -- ciudad de firma (p.ej. La Laguna)
  add column if not exists jurisdiction            text;  -- p.ej. Santa Cruz de Tenerife

-- nota cliente: de qué plantilla se generó (null = plantilla base por kind), para regenerar al rellenar datos del cliente.
alter table public.reservation_contracts add column if not exists source_template_id uuid;
