-- Extensión de page_views para soportar el panel de analítica web completo
-- (estadísticas / visitas — port del módulo de Pawdoq).
--
-- Añade:
--   session_id  text  → hash diario por (ip + UA + día) para unique visitors
--   region      text  → región/estado (de Vercel geo)
--   city        text  → ciudad (de Vercel geo, decoded)
--   device      text  → mobile | tablet | desktop (derivado de UA)
--   browser     text  → Chrome | Safari | Firefox | Edge | Other
--   os          text  → iOS | Android | macOS | Windows | Linux | Other
--
-- visitor_hash (legacy) se queda como backup; el nuevo tracker escribe session_id.

ALTER TABLE page_views
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS device text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS os text;

CREATE INDEX IF NOT EXISTS page_views_session_id_idx ON page_views(session_id);
CREATE INDEX IF NOT EXISTS page_views_kennel_session_path_recent_idx
  ON page_views(kennel_id, session_id, path, created_at DESC);

COMMENT ON COLUMN page_views.session_id IS
  'Hash diario sha256(ip + UA + YYYY-MM-DD) — 16 hex chars. Identifica un visitante único por día sin almacenar PII. Reemplaza visitor_hash.';
COMMENT ON COLUMN page_views.device IS 'mobile / tablet / desktop derivado del User-Agent (no se persiste el UA crudo).';
