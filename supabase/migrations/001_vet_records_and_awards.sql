-- Fase 1: Vet Records + Awards tables
-- Run this in Supabase SQL Editor

-- Vet Records (Cartilla Veterinaria Digital)
CREATE TABLE IF NOT EXISTS vet_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('vaccine', 'deworming', 'treatment', 'test', 'surgery')),
  name text NOT NULL,
  date date NOT NULL,
  vet_name text,
  notes text,
  file_url text,
  is_public boolean DEFAULT false,
  next_reminder date,
  created_at timestamptz DEFAULT now()
);

-- Awards (Palmares / Show Titles)
CREATE TABLE IF NOT EXISTS awards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  award_type text NOT NULL CHECK (award_type IN ('CAC', 'CACIB', 'BOB', 'BOS', 'BOG', 'BIS', 'other')),
  event_name text NOT NULL,
  date date NOT NULL,
  judge text,
  notes text,
  file_url text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_vet_records_dog_id ON vet_records(dog_id);
CREATE INDEX idx_vet_records_owner_id ON vet_records(owner_id);
CREATE INDEX idx_awards_dog_id ON awards(dog_id);
CREATE INDEX idx_awards_owner_id ON awards(owner_id);

-- RLS Policies for vet_records
ALTER TABLE vet_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vet records" ON vet_records
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view public vet records" ON vet_records
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own vet records" ON vet_records
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own vet records" ON vet_records
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own vet records" ON vet_records
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for awards
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own awards" ON awards
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view public awards" ON awards
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own awards" ON awards
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own awards" ON awards
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own awards" ON awards
  FOR DELETE USING (auth.uid() = owner_id);
