-- Pivot to Pawdoq Breeders model: Genealogic becomes free + acquisition engine
-- 30 abr 2026
--
-- Removes:
--  • Monetization tables (subscriptions, plan_limits) — Pawdoq charges
--  • Lead capture tables (form_submissions, kennel_forms, contacts) — Pawdoq Chat does this
--  • Profile columns: pro_started_at, pro_expires_at, stripe_customer_id
--
-- Simplifies role to: 'owner' | 'breeder' | 'admin'
--  • 'owner'   = users without a kennel (default for new users)
--  • 'breeder' = users with at least one kennel (auto-promoted)
--  • 'admin'   = internal staff
-- Old roles 'free' / 'amateur' / 'pro' are migrated based on whether the user has a kennel.

-- ─── Drop monetization & lead capture ───
DROP TABLE IF EXISTS form_submissions CASCADE;
DROP TABLE IF EXISTS kennel_forms CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plan_limits CASCADE;

-- ─── Profile column cleanup ───
ALTER TABLE profiles DROP COLUMN IF EXISTS pro_started_at CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS pro_expires_at CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_customer_id CASCADE;

-- ─── Role migration ───
-- Promote anyone with a kennel to 'breeder', everyone else (non-admin) to 'owner'
UPDATE profiles SET role = 'breeder'
  WHERE role IN ('free', 'amateur', 'pro')
    AND id IN (SELECT DISTINCT owner_id FROM kennels WHERE owner_id IS NOT NULL);

UPDATE profiles SET role = 'owner'
  WHERE role IN ('free', 'amateur', 'pro');
