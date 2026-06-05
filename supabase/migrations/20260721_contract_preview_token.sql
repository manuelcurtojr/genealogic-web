-- ============================================================================
-- Contract preview token — vista pública sólo-lectura del contrato.
--
-- Permite que el criador comparta un link público sin auth con el cliente
-- para que LEA el contrato antes de comprometerse a firmar / registrarse.
-- Útil porque hay clientes que no quieren crear cuenta sin ver primero el
-- contrato.
--
-- Acceso: cualquiera con el token puede leer el contrato (no editar, no
-- firmar). El token es uuid random (122 bits) — efectivamente
-- imposible adivinar; el criador lo comparte con su cliente vía
-- WhatsApp/email/lo que sea.
-- ============================================================================

alter table public.reservation_contracts
  add column if not exists preview_token uuid default gen_random_uuid();

-- Backfill: contratos antiguos no tenían default → rellenamos los NULL.
update public.reservation_contracts
   set preview_token = gen_random_uuid()
 where preview_token is null;

-- Unique para evitar colisiones (improbables pero el lookup es por aquí).
create unique index if not exists uniq_reservation_contracts_preview_token
  on public.reservation_contracts(preview_token);

-- A partir de ahora no debe ser NULL (la columna se rellena con default).
alter table public.reservation_contracts
  alter column preview_token set not null;

comment on column public.reservation_contracts.preview_token is
  'UUID público que identifica al contrato en /contrato-preview/[token]. Cualquiera con el link puede LEER (no firmar). El criador comparte este link con el cliente para que vea el contrato antes de registrarse.';
