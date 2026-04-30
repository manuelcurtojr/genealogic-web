-- Remove prescindible features: CRM, chat, genes, achievements, calendar, planner, favorites, contributions
-- 30 abr 2026 — keep only: perros, criaderos, camadas, búsqueda, importar pedigrí, formulario contacto

-- ─── CRM tables ───
DROP TABLE IF EXISTS deal_files CASCADE;
DROP TABLE IF EXISTS deal_activities CASCADE;
DROP TABLE IF EXISTS deal_dogs CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS pipeline_stages CASCADE;
DROP TABLE IF EXISTS pipelines CASCADE;

-- ─── Chat / inbox / messages ───
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- ─── Genes (currency) ───
DROP TABLE IF EXISTS gene_transactions CASCADE;
DROP TABLE IF EXISTS genes_transactions CASCADE;

-- ─── Achievements ───
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;

-- ─── Favorites ───
DROP TABLE IF EXISTS favorites CASCADE;

-- ─── Contributions (dog_changes) ───
DROP TABLE IF EXISTS dog_changes CASCADE;

-- ─── Calendar / events (not used anywhere now) ───
DROP TABLE IF EXISTS events CASCADE;

-- ─── Drop columns from existing tables ───
-- CASCADE needed because some columns have RLS policies depending on them
-- profiles.genes (currency balance)
ALTER TABLE profiles DROP COLUMN IF EXISTS genes CASCADE;
-- profiles.notif_deals, profiles.notif_calendar (no longer used)
ALTER TABLE profiles DROP COLUMN IF EXISTS notif_deals CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS notif_calendar CASCADE;

-- form_submissions.deal_id (deals tabla borrada)
ALTER TABLE form_submissions DROP COLUMN IF EXISTS deal_id CASCADE;

-- dogs.contributor_id (contributions borradas) — CASCADE drops dependent RLS policies
ALTER TABLE dogs DROP COLUMN IF EXISTS contributor_id CASCADE;
