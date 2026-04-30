-- API Keys table for kennels — used by Pawdoq Breeders to consume Genealogic data
-- 30 abr 2026

CREATE TABLE IF NOT EXISTS kennel_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kennel_id uuid NOT NULL REFERENCES kennels(id) ON DELETE CASCADE,
  name text NOT NULL,                      -- friendly label, e.g. "Pawdoq Production"
  key_hash text NOT NULL UNIQUE,           -- sha256 of the actual key
  key_last4 text NOT NULL,                 -- last 4 chars for display only
  scopes text[] NOT NULL DEFAULT ARRAY['read'],  -- future-proof
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz                   -- if revoked, ignore
);

CREATE INDEX IF NOT EXISTS kennel_api_keys_kennel_id_idx ON kennel_api_keys(kennel_id);
CREATE INDEX IF NOT EXISTS kennel_api_keys_key_hash_idx ON kennel_api_keys(key_hash);

-- RLS: kennel owner can manage their own keys
ALTER TABLE kennel_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_can_select_own_api_keys" ON kennel_api_keys
  FOR SELECT USING (
    kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid())
  );
CREATE POLICY "owner_can_insert_own_api_keys" ON kennel_api_keys
  FOR INSERT WITH CHECK (
    kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid())
  );
CREATE POLICY "owner_can_update_own_api_keys" ON kennel_api_keys
  FOR UPDATE USING (
    kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid())
  );
CREATE POLICY "owner_can_delete_own_api_keys" ON kennel_api_keys
  FOR DELETE USING (
    kennel_id IN (SELECT id FROM kennels WHERE owner_id = auth.uid())
  );
