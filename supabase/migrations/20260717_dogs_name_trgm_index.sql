-- Índice GIN trigram sobre dogs.name para que el ilike '%term%' del constructor
-- de genealogías (buscar padre/madre) sea rápido sobre 70k+ perros.
create extension if not exists pg_trgm;
create index if not exists idx_dogs_name_trgm on public.dogs using gin (name gin_trgm_ops);
