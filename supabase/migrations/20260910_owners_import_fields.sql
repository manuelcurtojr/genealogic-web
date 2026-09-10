-- Preparación de `owners` (directorio de contactos del criadero) para importar
-- el histórico completo de Irema Curtó (compradores + interesados + suscriptores)
-- de forma deduplicada, segmentada y trazable.
--
-- Contexto: /contactos ya unifica owners + puppy_reservations deduplicando por
-- email. Metemos TODO el histórico en `owners`; los compradores además tendrán
-- su reserva (entregada) + perro + contrato. Estas columnas permiten filtrar el
-- ruido (suscriptores) y no perder la procedencia de cada contacto.

-- 1. Segmento (para el filtro en /contactos) + canal de origen + trazabilidad
alter table public.owners
  add column if not exists segment text
    check (segment in ('buyer','interested','subscriber','other')),
  add column if not exists source text,          -- brevo|genealogic|excel-reserva|excel-camada|ig-form|envio|email|presadb...
  add column if not exists external_refs jsonb not null default '[]'::jsonb, -- [{fuente, evidencia, threadid, url}]
  add column if not exists first_contact_at date;

-- 2. Dedup real por email dentro del criadero. El import hace upsert por email,
--    pero este índice único protege también de duplicados en formularios/altas
--    manuales futuras. Parcial: solo cuando hay email (permite N contactos sin
--    email, típicos de compradores antiguos con solo nombre/ciudad).
--    ⚠️ Al aplicar: verificar antes que no existan ya duplicados por
--       (kennel_id, lower(email)) en `owners`; si los hay, fusionar primero.
create unique index if not exists owners_kennel_email_uniq
  on public.owners (kennel_id, lower(email))
  where email is not null and email <> '';

-- 3. Índice para filtrar/segmentar rápido en /contactos
create index if not exists owners_kennel_segment_idx
  on public.owners (kennel_id, segment);
