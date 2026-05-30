-- ─────────────────────────────────────────────────────────────────────────
-- Fix: search_dogs_smart daba 500 en el buscador para usuarios logueados
-- ─────────────────────────────────────────────────────────────────────────
-- Diagnóstico (2026-05-30): la función era SECURITY INVOKER. Al llamarla un
-- usuario logueado, PostgREST la ejecuta con el rol `authenticated`, que tiene
-- statement_timeout = 3s Y aplica la RLS de `dogs` (258k filas). Con
-- word_similarity sobre esa tabla, una query común ('de' → 40.846 matches)
-- tardaba ~2.9s CON RLS (vs ~0.4s sin RLS). Al rozar/superar los 3s →
-- statement timeout → 500. Kennels/breeds no fallan (tablas pequeñas).
--
-- Arreglo: ejecutar la función como SECURITY DEFINER (sin el coste de la RLS
-- de dogs). Es SEGURO porque la función YA filtra `d.is_public = true` — solo
-- devuelve perros públicos, nunca privados. search_path fijo por seguridad
-- (buena práctica obligada en funciones SECURITY DEFINER).

ALTER FUNCTION public.search_dogs_smart(text, integer)
  SECURITY DEFINER
  SET search_path = public, extensions;
