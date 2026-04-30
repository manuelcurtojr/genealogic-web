-- Restore events table (calendar) and profiles.notif_calendar

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_type text NOT NULL DEFAULT 'other',
  start_date timestamptz,
  end_date timestamptz,
  all_day boolean NOT NULL DEFAULT true,
  is_completed boolean NOT NULL DEFAULT false,
  color text,
  notes text,
  dog_id uuid REFERENCES dogs(id) ON DELETE SET NULL,
  litter_id uuid REFERENCES litters(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS events_owner_id_idx ON events(owner_id);
CREATE INDEX IF NOT EXISTS events_start_date_idx ON events(start_date);
CREATE INDEX IF NOT EXISTS events_dog_id_idx ON events(dog_id);
CREATE INDEX IF NOT EXISTS events_litter_id_idx ON events(litter_id);

-- RLS: owner can do everything with their events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_can_select_own_events" ON events
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "owner_can_insert_own_events" ON events
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner_can_update_own_events" ON events
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "owner_can_delete_own_events" ON events
  FOR DELETE USING (auth.uid() = owner_id);

-- Restore notif_calendar column on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_calendar boolean NOT NULL DEFAULT true;
