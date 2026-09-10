-- Contratos como PDF en la ficha del cliente (unificado):
--  · Bucket privado `contracts` para los PDFs (escaneos de papel + autogenerados).
--  · RLS: el dueño del criadero gestiona los objetos bajo contracts/<kennel_id>/...
--  · reservation_contracts gana is_uploaded + original_filename para distinguir
--    un contrato SUBIDO (escaneo) de uno generado en Genealogic. El pdf_url
--    (columna ya existente) se rellena para ambos → todo acaba como PDF.

-- 1. Bucket privado (solo PDFs, máx 15 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contracts', 'contracts', false, 15728640, array['application/pdf'])
on conflict (id) do nothing;

-- 2. RLS de storage.objects: el criador dueño del kennel (primer segmento del
--    path = kennel_id) puede subir/leer/borrar sus contratos. Lectura pública
--    solo vía signed URLs que el propio criador genera con su sesión.
drop policy if exists "contracts_owner_all" on storage.objects;
create policy "contracts_owner_all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'contracts'
    and exists (
      select 1 from kennels k
      where k.id::text = (storage.foldername(name))[1] and k.owner_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'contracts'
    and exists (
      select 1 from kennels k
      where k.id::text = (storage.foldername(name))[1] and k.owner_id = auth.uid()
    )
  );

-- 3. Distinguir contratos subidos (escaneos) de los generados en Genealogic
alter table reservation_contracts
  add column if not exists is_uploaded boolean not null default false,
  add column if not exists original_filename text;
