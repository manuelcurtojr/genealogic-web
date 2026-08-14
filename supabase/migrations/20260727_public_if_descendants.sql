-- 20260727_public_if_descendants.sql
-- INVARIANTE: un perro con descendientes DEBE ser público. Solo pueden ser
-- privados los perros SIN descendientes.
--
-- Motivo (producto): puedes tener un perro que compras, al que le haces pruebas,
-- que aún no ha criado, y quieres usarlo en el planificador / cartilla / fotos en
-- privado. En cuanto tiene una camada pasa a público automáticamente, porque las
-- genealogías de sus hijos lo referencian y no puede existir un ancestro oculto.
--
-- Se garantiza a nivel de BD (no solo en la app) para que NINGUNA vía lo salte
-- (formulario, importador, API v1). Es distinto de show_in_kennel (mostrar/ocultar
-- en la página de criadero), que no se toca aquí.

-- ── Helper: ¿el perro es padre o madre de alguien? ──────────────────────────
-- SECURITY DEFINER para ver TODA la descendencia (incluida la de otros dueños o
-- privada). Apoya en los índices parciales dogs_father_id_idx / dogs_mother_id_idx.
create or replace function public.dog_has_descendants(dog_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.dogs
    where father_id = dog_id or mother_id = dog_id
  );
$$;

grant execute on function public.dog_has_descendants(uuid) to anon, authenticated;

-- ── Trigger 1: no se puede dejar en privado un perro con descendientes ──────
-- Si la fila quedaría privada y tiene descendencia, se fuerza a pública. Solo
-- ejecuta el EXISTS cuando is_public sería false, así que no penaliza a la
-- inmensa mayoría (perros ya públicos).
create or replace function public.enforce_public_if_has_descendants()
returns trigger
language plpgsql
as $$
begin
  if new.is_public is false and public.dog_has_descendants(new.id) then
    new.is_public := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_public_if_descendants on public.dogs;
create trigger trg_enforce_public_if_descendants
  before insert or update of is_public on public.dogs
  for each row execute function public.enforce_public_if_has_descendants();

-- ── Trigger 2: al enlazar un perro como padre/madre, se publica al progenitor ─
-- Cuando un perro gana descendencia (se le pone father_id/mother_id a un hijo),
-- sus progenitores pasan a público. El UPDATE a is_public=true dispara el
-- Trigger 1 sobre el progenitor pero como pone TRUE es no-op (sin recursión).
create or replace function public.publish_parents_on_link()
returns trigger
language plpgsql
as $$
begin
  update public.dogs
     set is_public = true
   where is_public = false
     and (id = new.father_id or id = new.mother_id);
  return null;
end;
$$;

drop trigger if exists trg_publish_parents_on_link on public.dogs;
create trigger trg_publish_parents_on_link
  after insert or update of father_id, mother_id on public.dogs
  for each row execute function public.publish_parents_on_link();

-- ── Backfill de seguridad ───────────────────────────────────────────────────
-- Publica cualquier privado que YA tenga descendencia (hoy = 0, pero por si
-- acaso). Eficiente vía los índices father_id/mother_id.
update public.dogs
   set is_public = true
 where is_public = false
   and id in (
     select father_id from public.dogs where father_id is not null
     union
     select mother_id from public.dogs where mother_id is not null
   );
