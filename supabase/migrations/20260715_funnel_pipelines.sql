-- ============================================================================
-- EMBUDO (Funnel) — configurable sales/reservation pipelines with typed stages.
-- Expand-only migration: KEEPS puppy_reservations.status intact as a mirror so
-- nothing breaks mid-transition. Default pipelines are seeded LAZILY per kennel
-- (6.7k kennels, most inactive) via ensure_default_pipelines(); only kennels
-- with existing reservations are backfilled here.
--
-- Stage rules: every pipeline must have >=1 'normal', >=1 'won', >=1 'lost'
-- (enforced in the app/config layer). Default stage names are stored in Spanish
-- as the i18n KEY and rendered with t() (custom names pass through untranslated).
-- ============================================================================

-- ---------- 1. pipelines ----------
create table if not exists public.pipelines (
  id          uuid primary key default gen_random_uuid(),
  kennel_id   uuid not null references public.kennels(id) on delete cascade,
  name        text not null,
  slug        text,                         -- 'ventas' | 'reservas' for seeded defaults; null for custom
  position    int  not null default 0,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_pipelines_kennel on public.pipelines(kennel_id);
create unique index if not exists uniq_pipelines_kennel_slug
  on public.pipelines(kennel_id, slug) where slug is not null;

-- ---------- 2. pipeline_stages ----------
create table if not exists public.pipeline_stages (
  id               uuid primary key default gen_random_uuid(),
  pipeline_id      uuid not null references public.pipelines(id) on delete cascade,
  name             text not null,
  position         int  not null default 0,
  type             text not null default 'normal' check (type in ('normal','won','lost')),
  is_entry         boolean not null default false,        -- stage where new leads land
  celebrate        boolean not null default false,        -- confetti popup on enter (won stages)
  loss_reasons     text[] not null default '{}',          -- survey options for lost stages
  handoff_stage_id uuid references public.pipeline_stages(id) on delete set null, -- clone target on enter
  color            text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_stages_pipeline on public.pipeline_stages(pipeline_id, position);

-- ---------- 3. puppy_reservations: new columns (expand-only) ----------
alter table public.puppy_reservations
  add column if not exists pipeline_id        uuid references public.pipelines(id) on delete set null,
  add column if not exists stage_id           uuid references public.pipeline_stages(id) on delete set null,
  add column if not exists origin_entry_id    uuid references public.puppy_reservations(id) on delete set null,
  add column if not exists seen_by_breeder_at timestamptz;
create index if not exists idx_reservations_stage    on public.puppy_reservations(stage_id);
create index if not exists idx_reservations_pipeline on public.puppy_reservations(pipeline_id);

-- ---------- 4. RLS ----------
alter table public.pipelines       enable row level security;
alter table public.pipeline_stages enable row level security;

-- pipelines
drop policy if exists pipelines_admin_all     on public.pipelines;
drop policy if exists pipelines_select_owner  on public.pipelines;
drop policy if exists pipelines_select_client on public.pipelines;
drop policy if exists pipelines_insert_owner  on public.pipelines;
drop policy if exists pipelines_update_owner  on public.pipelines;
drop policy if exists pipelines_delete_owner  on public.pipelines;
create policy pipelines_admin_all on public.pipelines for all using (is_admin());
create policy pipelines_select_owner on public.pipelines for select
  using (kennel_id in (select id from public.kennels where owner_id = auth.uid()));
create policy pipelines_select_client on public.pipelines for select
  using (id in (select pr.pipeline_id from public.puppy_reservations pr where pr.client_user_id = auth.uid()));
create policy pipelines_insert_owner on public.pipelines for insert
  with check (kennel_id in (select id from public.kennels where owner_id = auth.uid()));
create policy pipelines_update_owner on public.pipelines for update
  using (kennel_id in (select id from public.kennels where owner_id = auth.uid()));
create policy pipelines_delete_owner on public.pipelines for delete
  using (kennel_id in (select id from public.kennels where owner_id = auth.uid()));

-- pipeline_stages (scoped via parent pipeline's kennel)
drop policy if exists stages_admin_all     on public.pipeline_stages;
drop policy if exists stages_select_owner  on public.pipeline_stages;
drop policy if exists stages_select_client on public.pipeline_stages;
drop policy if exists stages_insert_owner  on public.pipeline_stages;
drop policy if exists stages_update_owner  on public.pipeline_stages;
drop policy if exists stages_delete_owner  on public.pipeline_stages;
create policy stages_admin_all on public.pipeline_stages for all using (is_admin());
create policy stages_select_owner on public.pipeline_stages for select
  using (pipeline_id in (select p.id from public.pipelines p
         join public.kennels k on k.id = p.kennel_id where k.owner_id = auth.uid()));
create policy stages_select_client on public.pipeline_stages for select
  using (pipeline_id in (select pr.pipeline_id from public.puppy_reservations pr where pr.client_user_id = auth.uid()));
create policy stages_insert_owner on public.pipeline_stages for insert
  with check (pipeline_id in (select p.id from public.pipelines p
              join public.kennels k on k.id = p.kennel_id where k.owner_id = auth.uid()));
create policy stages_update_owner on public.pipeline_stages for update
  using (pipeline_id in (select p.id from public.pipelines p
         join public.kennels k on k.id = p.kennel_id where k.owner_id = auth.uid()));
create policy stages_delete_owner on public.pipeline_stages for delete
  using (pipeline_id in (select p.id from public.pipelines p
         join public.kennels k on k.id = p.kennel_id where k.owner_id = auth.uid()));

-- ---------- 5. lazy seeding function (idempotent) ----------
create or replace function public.ensure_default_pipelines(p_kennel_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ventas        uuid;
  v_reservas      uuid;
  v_won_ventas    uuid;
  v_entry_reserva uuid;
begin
  -- idempotent: bail if defaults already exist
  if exists (select 1 from pipelines where kennel_id = p_kennel_id and slug = 'ventas') then
    return;
  end if;

  insert into pipelines(kennel_id, name, slug, position, is_default)
    values (p_kennel_id, 'Ventas', 'ventas', 0, true) returning id into v_ventas;
  insert into pipelines(kennel_id, name, slug, position, is_default)
    values (p_kennel_id, 'Reservas', 'reservas', 1, true) returning id into v_reservas;

  insert into pipeline_stages(pipeline_id, name, position, type, is_entry, celebrate, loss_reasons) values
    (v_ventas, 'Interesados',   0, 'normal', true,  false, '{}'),
    (v_ventas, 'Contactado',    1, 'normal', false, false, '{}'),
    (v_ventas, 'Oferta enviada',2, 'normal', false, false, '{}'),
    (v_ventas, 'En seguimiento',3, 'normal', false, false, '{}'),
    (v_ventas, 'Venta ganada',  4, 'won',    false, true,  '{}'),
    (v_ventas, 'Venta perdida', 5, 'lost',   false, false,
       array['Precio muy caro','No era el momento','No le convence la raza','No responde','Otro']);

  insert into pipeline_stages(pipeline_id, name, position, type, is_entry, celebrate, loss_reasons) values
    (v_reservas, 'Reserva en firme',    0, 'normal', true,  false, '{}'),
    (v_reservas, 'Perro seleccionado',  1, 'normal', false, false, '{}'),
    (v_reservas, 'En espera',           2, 'normal', false, false, '{}'),
    (v_reservas, 'Pendiente de entrega',3, 'normal', false, false, '{}'),
    (v_reservas, 'Entregado',           4, 'won',    false, true,  '{}'),
    (v_reservas, 'Reserva cancelada',   5, 'lost',   false, false,
       array['No quiere esperar más','No puede tenerlo','No responde pasado el plazo','Ha muerto','Otro']);

  -- handoff (clone): Ventas/'Venta ganada' -> Reservas/'Reserva en firme'
  select id into v_won_ventas    from pipeline_stages where pipeline_id = v_ventas   and name = 'Venta ganada';
  select id into v_entry_reserva from pipeline_stages where pipeline_id = v_reservas and name = 'Reserva en firme';
  update pipeline_stages set handoff_stage_id = v_entry_reserva where id = v_won_ventas;
end;
$$;

-- ---------- 6. backfill existing reservations ----------
do $$
declare k uuid;
begin
  for k in select distinct kennel_id from puppy_reservations loop
    perform ensure_default_pipelines(k);
  end loop;

  update puppy_reservations pr
     set pipeline_id = s.pipeline_id, stage_id = s.id
    from pipeline_stages s
    join pipelines p on p.id = s.pipeline_id
   where p.kennel_id = pr.kennel_id
     and pr.stage_id is null
     and (
       (pr.status='interested'      and p.slug='ventas'   and s.name='Interesados')          or
       (pr.status='lost'            and p.slug='ventas'   and s.name='Venta perdida')         or
       (pr.status='waitlisted'      and p.slug='ventas'   and s.name='En seguimiento')        or
       (pr.status='deposit_paid'    and p.slug='reservas' and s.name='Reserva en firme')      or
       (pr.status='assigned'        and p.slug='reservas' and s.name='Perro seleccionado')    or
       (pr.status='contract_signed' and p.slug='reservas' and s.name='Pendiente de entrega')  or
       (pr.status='paid_in_full'    and p.slug='reservas' and s.name='Pendiente de entrega')  or
       (pr.status='delivered'       and p.slug='reservas' and s.name='Entregado')             or
       (pr.status='cancelled'       and p.slug='reservas' and s.name='Reserva cancelada')     or
       (pr.status='refunded'        and p.slug='reservas' and s.name='Reserva cancelada')
     );

  -- existing rows already handled by the breeder: don't light up as "new"
  update puppy_reservations set seen_by_breeder_at = now() where seen_by_breeder_at is null;
end $$;
