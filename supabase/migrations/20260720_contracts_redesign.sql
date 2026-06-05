-- ============================================================================
-- Contracts redesign — fill-form UX
--
-- Dos cambios independientes que sostienen el nuevo flujo:
--
--   1. `contract_templates.default_for_kind text` — sustituye al boolean
--      global `is_default`. El criador puede tener UNA plantilla default
--      por cada tipo de contrato (reserva / entrega), no una sola global.
--      Backfill: cualquier plantilla con is_default=true se considera default
--      del kind 'reservation' (la mayoría de plantillas reales son de reserva
--      hoy; entrega se introdujo hace pocos días).
--
--   2. `reservation_contracts.template_values jsonb` — guarda los valores
--      del FORMULARIO (campo→valor) aparte del body_html ya resuelto. El
--      body se regenera de la plantilla + valores en cada save. Esto
--      permite, al volver a abrir el contrato, mostrar el formulario
--      relleno y no solo el texto final.
--
-- Expand-only: NO se borra is_default todavía para no romper código
-- existente que aún lo lea. Una segunda migración lo retirará cuando todos
-- los callers usen default_for_kind.
-- ============================================================================

-- ---------- 1. contract_templates.default_for_kind ----------
alter table public.contract_templates
  add column if not exists default_for_kind text;

alter table public.contract_templates
  drop constraint if exists contract_templates_default_for_kind_check;
alter table public.contract_templates
  add constraint contract_templates_default_for_kind_check
  check (default_for_kind is null or default_for_kind in ('reservation', 'delivery'));

-- Solo UNA plantilla puede ser default por (kennel_id, kind). Permite que
-- haya plantillas sin default (default_for_kind IS NULL) sin restricción.
create unique index if not exists uniq_contract_templates_default_per_kind
  on public.contract_templates(kennel_id, default_for_kind)
  where default_for_kind is not null;

-- Backfill: las que estaban marcadas como default global pasan a ser default
-- del kind 'reservation'. NO marcamos default para 'delivery' — el criador lo
-- elegirá explícitamente desde la UI nueva.
update public.contract_templates
   set default_for_kind = 'reservation'
 where is_default = true
   and default_for_kind is null;

-- ---------- 2. reservation_contracts.template_values ----------
alter table public.reservation_contracts
  add column if not exists template_values jsonb;

comment on column public.reservation_contracts.template_values is
  'Valores del formulario fill-form (token→valor). El body_html se regenera de la plantilla + estos valores en cada save. Permite editar el formulario y mantener consistencia, en lugar de editar el markdown directamente.';
