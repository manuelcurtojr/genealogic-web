-- CRM: separar EMBUDO (deals abiertos) de HISTÓRICO (cerrados).
--
-- Un deal (puppy_reservations) se "cierra" cuando entra en una etapa terminal
-- (pipeline_stages.type in ('won','lost')). Marcamos `closed_at` en ese momento
-- (lo hace moveEntryToStage). El tablero del embudo muestra solo abiertos + los
-- cerrados dentro de una gracia de 7 días; el histórico / pestaña "Cerradas"
-- muestra `closed_at is not null`. Sin cron: la gracia se calcula en la query
--   board:     closed_at is null OR closed_at > now() - interval '7 days'
--   histórico: closed_at is not null
-- Los importados (compradores antiguos) llegan con closed_at de hace años → van
-- directos al histórico, nunca al tablero.

alter table public.puppy_reservations
  add column if not exists closed_at timestamptz;

comment on column public.puppy_reservations.closed_at is
  'Momento en que el deal entró en una etapa terminal (won/lost). NULL = abierto. El embudo oculta los cerrados pasada la gracia de 7 días; el histórico los muestra.';

-- Backfill 1: reservas ya asignadas a una etapa terminal (fuente de verdad del board)
update public.puppy_reservations pr
set closed_at = coalesce(pr.delivered_at, pr.lost_at, pr.deposit_paid_at, pr.updated_at, pr.created_at)
from public.pipeline_stages s
where pr.stage_id = s.id
  and s.type in ('won','lost')
  and pr.closed_at is null;

-- Backfill 2: reservas sin etapa asignada pero con status legacy terminal
update public.puppy_reservations
set closed_at = coalesce(delivered_at, lost_at, updated_at, created_at)
where closed_at is null
  and stage_id is null
  and status in ('delivered','cancelled');

-- Índice para el filtro del board / histórico por kennel
create index if not exists puppy_reservations_kennel_closed_idx
  on public.puppy_reservations (kennel_id, closed_at);
