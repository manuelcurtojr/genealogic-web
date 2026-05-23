-- Heat cycles tracking para planificador reproductivo
-- Cada registro = un ciclo de celo de una hembra (real o estimado)

CREATE TABLE IF NOT EXISTS heat_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,                          -- opcional, se calcula como start_date + 21 días si null
  was_mated boolean NOT NULL DEFAULT false,
  resulted_in_litter_id uuid REFERENCES litters(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS heat_cycles_dog_id_idx ON heat_cycles(dog_id);
CREATE INDEX IF NOT EXISTS heat_cycles_owner_id_idx ON heat_cycles(owner_id);
CREATE INDEX IF NOT EXISTS heat_cycles_start_date_idx ON heat_cycles(start_date);

-- RLS
ALTER TABLE heat_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_can_select_heat_cycles" ON heat_cycles
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "owner_can_insert_heat_cycles" ON heat_cycles
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner_can_update_heat_cycles" ON heat_cycles
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "owner_can_delete_heat_cycles" ON heat_cycles
  FOR DELETE USING (auth.uid() = owner_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_heat_cycles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS heat_cycles_updated_at_trigger ON heat_cycles;
CREATE TRIGGER heat_cycles_updated_at_trigger
  BEFORE UPDATE ON heat_cycles
  FOR EACH ROW EXECUTE FUNCTION update_heat_cycles_updated_at();
