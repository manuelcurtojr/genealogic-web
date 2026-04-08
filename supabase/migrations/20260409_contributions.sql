-- Add contributor_id to dogs table for the contributions system
-- A dog with owner_id = user is "my dog"
-- A dog with contributor_id = user AND owner_id IS NULL is "my contribution"
-- Contributions are public by default so the community can build shared genealogies

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS contributor_id UUID REFERENCES auth.users(id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_dogs_contributor_id ON dogs(contributor_id);

-- RLS: users can read/edit dogs they contributed (but not transfer — owner_id stays NULL)
CREATE POLICY "contributors_can_read_own_contributions" ON dogs
  FOR SELECT USING (contributor_id = auth.uid());

CREATE POLICY "contributors_can_update_own_contributions" ON dogs
  FOR UPDATE USING (contributor_id = auth.uid())
  WITH CHECK (contributor_id = auth.uid() AND owner_id IS NULL);

CREATE POLICY "contributors_can_insert_contributions" ON dogs
  FOR INSERT WITH CHECK (contributor_id = auth.uid());
