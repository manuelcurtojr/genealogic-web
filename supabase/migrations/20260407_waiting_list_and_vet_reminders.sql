-- ==============================================
-- MIGRATION: Waiting List + Vet Reminders
-- Run this in Supabase SQL Editor
-- ==============================================

-- 1. WAITING LIST: Add preference fields to deals
-- ================================================
ALTER TABLE deals ADD COLUMN IF NOT EXISTS preferred_sex text CHECK (preferred_sex IN ('male', 'female', 'any'));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS preferred_color text; -- free text or color_id reference
ALTER TABLE deals ADD COLUMN IF NOT EXISTS queue_position integer;

-- Default preferred_sex to 'any' for existing deals linked to litters
UPDATE deals SET preferred_sex = 'any' WHERE litter_id IS NOT NULL AND preferred_sex IS NULL;

-- 2. VET REMINDER TEMPLATES
-- ================================================
CREATE TABLE IF NOT EXISTS vet_reminder_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('vaccine', 'deworming', 'checkup', 'custom')),
  default_interval_days integer NOT NULL DEFAULT 365,
  applies_to text NOT NULL DEFAULT 'both' CHECK (applies_to IN ('puppy', 'adult', 'both')),
  is_system boolean DEFAULT true, -- system templates can't be deleted by users
  owner_id uuid REFERENCES auth.users(id), -- NULL for system templates
  created_at timestamptz DEFAULT now()
);

-- Insert default system templates
INSERT INTO vet_reminder_templates (name, description, type, default_interval_days, applies_to, is_system) VALUES
  ('Primovacunación', 'Primera vacuna polivalente del cachorro (6-8 semanas)', 'vaccine', 0, 'puppy', true),
  ('Refuerzo vacuna (12 sem)', 'Segunda dosis de vacuna polivalente', 'vaccine', 28, 'puppy', true),
  ('Refuerzo vacuna (16 sem)', 'Tercera dosis de vacuna polivalente + rabia', 'vaccine', 28, 'puppy', true),
  ('Vacuna anual', 'Refuerzo anual de vacuna polivalente', 'vaccine', 365, 'adult', true),
  ('Desparasitación cachorro', 'Desparasitación interna cada 2 semanas (cachorro)', 'deworming', 14, 'puppy', true),
  ('Desparasitación trimestral', 'Desparasitación interna cada 3 meses (adulto)', 'deworming', 90, 'adult', true),
  ('Revisión general', 'Chequeo veterinario general anual', 'checkup', 365, 'both', true),
  ('Control de peso', 'Control de peso y condición corporal', 'checkup', 180, 'both', true)
ON CONFLICT DO NOTHING;

-- 3. VET REMINDERS (instances per dog)
-- ================================================
CREATE TABLE IF NOT EXISTS vet_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  template_id uuid REFERENCES vet_reminder_templates(id),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('vaccine', 'deworming', 'checkup', 'custom')),
  due_date date NOT NULL,
  completed_date date,
  notes text,
  auto_generated boolean DEFAULT false,
  recurrence_days integer, -- if set, generates next reminder on completion
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE vet_reminder_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_reminders ENABLE ROW LEVEL SECURITY;

-- Templates: anyone can read system templates, users can CRUD their own
CREATE POLICY "read_system_templates" ON vet_reminder_templates FOR SELECT USING (is_system = true OR owner_id = auth.uid());
CREATE POLICY "insert_own_templates" ON vet_reminder_templates FOR INSERT WITH CHECK (auth.uid() = owner_id AND is_system = false);
CREATE POLICY "update_own_templates" ON vet_reminder_templates FOR UPDATE USING (auth.uid() = owner_id AND is_system = false);
CREATE POLICY "delete_own_templates" ON vet_reminder_templates FOR DELETE USING (auth.uid() = owner_id AND is_system = false);

-- Reminders: users can CRUD their own
CREATE POLICY "read_own_reminders" ON vet_reminders FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "insert_own_reminders" ON vet_reminders FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "update_own_reminders" ON vet_reminders FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "delete_own_reminders" ON vet_reminders FOR DELETE USING (auth.uid() = owner_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_vet_reminders_dog ON vet_reminders(dog_id);
CREATE INDEX IF NOT EXISTS idx_vet_reminders_owner ON vet_reminders(owner_id);
CREATE INDEX IF NOT EXISTS idx_vet_reminders_due ON vet_reminders(due_date) WHERE completed_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_deals_litter ON deals(litter_id) WHERE litter_id IS NOT NULL;
