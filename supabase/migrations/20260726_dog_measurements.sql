-- 20260726_dog_measurements.sql
-- Medidas morfológicas de perros con HISTORIAL fechado (cada fila = una tanda de
-- medidas en una fecha). Alimenta la predicción del planificador de cruces:
-- media de los progenitores (mid-parent) por cada medida numérica.
--
-- Patrón 1:N por perro (como vet_records) con RLS por dueño. Peso/altura básicos
-- siguen viviendo en dogs.weight/height (resumen rápido en la pestaña Datos);
-- aquí guardamos el snapshot morfométrico completo y su evolución.

create table if not exists public.dog_measurements (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  owner_id uuid,
  measured_at date not null default current_date,
  age_months integer,

  -- ── Numéricas (se promedian en el cruce) ──────────────────────────────
  -- Generales
  weight_kg numeric,
  height_withers_cm numeric,        -- altura a la cruz
  height_rump_cm numeric,           -- altura a la grupa
  -- Cabeza
  skull_circumference_cm numeric,   -- perímetro craneal
  head_length_cm numeric,           -- longitud total de cabeza
  skull_length_cm numeric,          -- longitud de cráneo
  muzzle_length_cm numeric,         -- longitud de morro
  skull_width_cm numeric,           -- ancho de cráneo
  muzzle_width_cm numeric,          -- ancho de morro
  inner_canthi_distance_cm numeric, -- distancia entre lagrimales
  ear_length_cm numeric,            -- longitud de oreja
  -- Cuello
  neck_length_cm numeric,
  neck_circumference_cm numeric,
  -- Tronco
  body_length_cm numeric,           -- longitud de tronco (cuello a base de rabo)
  chest_girth_cm numeric,           -- perímetro torácico
  abdominal_girth_cm numeric,       -- perímetro estomacal
  chest_width_cm numeric,           -- ancho de pecho
  shoulder_width_cm numeric,        -- ancho de hombros
  -- Grupa
  rump_width_cm numeric,            -- ancho de grupa
  rump_length_cm numeric,           -- longitud de grupa
  -- Miembro anterior
  elbow_to_wrist_cm numeric,        -- longitud de codo a muñeca
  wrist_to_ground_cm numeric,       -- longitud de muñeca al suelo
  -- Miembro posterior
  thigh_length_cm numeric,          -- longitud de muslo
  hock_to_ground_cm numeric,        -- corvejón al suelo
  -- Rabo
  tail_length_cm numeric,

  -- ── Cualitativas (se comparan lado a lado, no se promedian) ────────────
  dentition text,      -- boca (completa / incompleta)
  bite text,           -- mordida
  hip_grade text,      -- grado de cadera
  elbow_grade text,    -- grado de codos
  laboklin text,       -- laboklin
  stop text,
  aplomb text,         -- aplomos
  hocks text,          -- corvejones
  eyes text,           -- ojos
  nose text,           -- trufa
  lips text,           -- belfos
  angulations text,    -- angulaciones
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dog_measurements_dog on public.dog_measurements(dog_id, measured_at desc);
create index if not exists idx_dog_measurements_owner on public.dog_measurements(owner_id);

alter table public.dog_measurements enable row level security;

-- El dueño gestiona las medidas de sus perros (patrón vet_records).
create policy "dog_measurements_select_own" on public.dog_measurements
  for select using (owner_id = auth.uid());
create policy "dog_measurements_insert_own" on public.dog_measurements
  for insert with check (owner_id = auth.uid());
create policy "dog_measurements_update_own" on public.dog_measurements
  for update using (owner_id = auth.uid());
create policy "dog_measurements_delete_own" on public.dog_measurements
  for delete using (owner_id = auth.uid());

-- updated_at automático
create or replace function public.touch_dog_measurements_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_dog_measurements_updated_at
  before update on public.dog_measurements
  for each row execute function public.touch_dog_measurements_updated_at();
