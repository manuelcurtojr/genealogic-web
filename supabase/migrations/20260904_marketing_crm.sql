-- Marketing CRM interno (growth backend operado por admin).
-- Embudo de ADQUISICIÓN de criadores para la plataforma. Distinto del motor de
-- pipelines de puppy_reservations (que es por-kennel y vive en producción): aquí
-- los stages son fijos y el CRM es de la plataforma. Solo-admin (RLS is_admin()).
-- El "caballo de Troya" se apoya en datos ya existentes: kennels/dogs con
-- owner_id NULL e imported_from NOT NULL.

-- 1) Leads --------------------------------------------------------------------
create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),

  -- Identidad del criador prospecto
  kennel_name   text,
  contact_name  text,
  email         text,
  phone         text,
  website       text,
  instagram     text,
  country       text,
  region        text,
  breed_focus   text,

  -- Clasificación CRM (stages FIJOS, sin tabla de config)
  stage text not null default 'nuevo'
    check (stage in ('nuevo','contactado','respondio','registrado','activado','pro','perdido')),
  source text not null default 'db_troya'
    check (source in ('db_troya','directorio_club','instagram','web','referido','manual','otro')),
  source_detail text,
  lost_reason   text,

  -- Llaves de oro: unión lead <-> producto (misma DB)
  matched_kennel_id uuid references public.kennels(id) on delete set null,
  matched_user_id   uuid references auth.users(id)     on delete set null,

  -- Operación
  priority         int  not null default 0,   -- p.ej. nº de perros del kennel
  next_action_at   date,
  last_contacted_at timestamptz,
  internal_note    text,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un mismo criadero de la DB no debe entrar dos veces como lead.
create unique index if not exists uniq_marketing_leads_kennel
  on public.marketing_leads(matched_kennel_id) where matched_kennel_id is not null;
create index if not exists idx_marketing_leads_stage       on public.marketing_leads(stage);
create index if not exists idx_marketing_leads_next_action on public.marketing_leads(next_action_at);
create index if not exists idx_marketing_leads_email       on public.marketing_leads(lower(email));
create index if not exists idx_marketing_leads_matched_user on public.marketing_leads(matched_user_id);

-- 2) Timeline de eventos ------------------------------------------------------
create table if not exists public.marketing_lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.marketing_leads(id) on delete cascade,
  type text not null,          -- lead_created, email_sent, email_replied, stage_changed,
                               -- registered, added_dog, visited_page, upgraded_pro, unsubscribed, note
  detail  text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create index if not exists idx_marketing_lead_events_lead
  on public.marketing_lead_events(lead_id, occurred_at desc);

-- 3) Mensajes (emails) --------------------------------------------------------
create table if not exists public.marketing_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.marketing_leads(id) on delete cascade,
  direction text not null check (direction in ('out','in')),
  subject text,
  body    text,
  gmail_thread_id  text,
  gmail_message_id text,
  status text not null default 'draft'
    check (status in ('draft','sent','delivered','bounced','received')),
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_marketing_messages_lead
  on public.marketing_messages(lead_id, created_at desc);
create index if not exists idx_marketing_messages_thread
  on public.marketing_messages(gmail_thread_id);

-- 4) RLS: solo admin (defensa en profundidad; el service_role la bypassa) -----
alter table public.marketing_leads       enable row level security;
alter table public.marketing_lead_events enable row level security;
alter table public.marketing_messages    enable row level security;

create policy marketing_leads_admin on public.marketing_leads
  for all using (public.is_admin()) with check (public.is_admin());
create policy marketing_lead_events_admin on public.marketing_lead_events
  for all using (public.is_admin()) with check (public.is_admin());
create policy marketing_messages_admin on public.marketing_messages
  for all using (public.is_admin()) with check (public.is_admin());

-- 5) Candidatos "caballo de Troya" ------------------------------------------
-- Criaderos sin reclamar (owner_id NULL) con su nº de perros agregado, para
-- poblar el Tier A ordenado por tamaño SIN hacer N+1 en la aplicación.
create or replace function public.marketing_troya_candidates(
  min_dogs int default 1,
  only_website boolean default false
)
returns table (
  kennel_id      uuid,
  kennel_name    text,
  slug           text,
  website        text,
  dog_count      bigint,
  imported_count bigint,
  created_at     timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select k.id, k.name, k.slug, k.website,
         count(d.id)                                              as dog_count,
         count(d.id) filter (where d.imported_from is not null)   as imported_count,
         k.created_at
  from public.kennels k
  left join public.dogs d on d.kennel_id = k.id
  where k.owner_id is null
    and (not only_website or k.website is not null)
  group by k.id, k.name, k.slug, k.website, k.created_at
  having count(d.id) >= min_dogs
  order by count(d.id) desc
$$;
