-- Corrige la RLS del bucket `contracts`. La política anterior usaba una
-- subconsulta a `kennels` (k.owner_id = auth.uid()) para autorizar, y bloqueaba
-- las subidas. Se pasa al patrón canónico y robusto de Supabase: carpeta por
-- uid del dueño = primer segmento del path.
--
-- Paths: contracts/<owner_uid>/<reservation_id>/<fichero>.pdf
-- (el código ya sube con este prefijo). El server action valida la propiedad
-- de la reserva antes de tocar la fila, así que el uid del path es el del dueño.

drop policy if exists "contracts_owner_all" on storage.objects;
create policy "contracts_owner_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'contracts' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'contracts' and (storage.foldername(name))[1] = auth.uid()::text);
