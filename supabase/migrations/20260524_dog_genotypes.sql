-- Genotipos de los perros por locus genético
-- Cada perro puede tener un registro por locus (E, K, A, B, D, M, S, L, F, CU...)
-- Permite calcular forecast de cruces (Genetics Forecast) y avisar de doble merle

CREATE TABLE IF NOT EXISTS dog_genotypes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  locus text NOT NULL,            -- 'E', 'K', 'A', 'B', 'D', 'M', 'S', 'L', 'F', 'CU'
  allele_1 text NOT NULL,         -- ej. 'E', 'e', 'Em', 'KB', 'kbr', 'ky', 'M', 'm', 'Mc'
  allele_2 text NOT NULL,
  source text NOT NULL DEFAULT 'declared' CHECK (source IN ('declared', 'embark', 'wisdom', 'ofa', 'observed')),
  confidence text NOT NULL DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low', 'estimated')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(dog_id, locus)
);

CREATE INDEX IF NOT EXISTS dog_genotypes_dog_id_idx ON dog_genotypes(dog_id);
CREATE INDEX IF NOT EXISTS dog_genotypes_locus_idx ON dog_genotypes(locus);

-- RLS: el dueño del perro puede gestionar sus genotipos
ALTER TABLE dog_genotypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_can_select_genotypes" ON dog_genotypes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM dogs WHERE dogs.id = dog_genotypes.dog_id AND dogs.owner_id = auth.uid())
  );
CREATE POLICY "owner_can_insert_genotypes" ON dog_genotypes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM dogs WHERE dogs.id = dog_genotypes.dog_id AND dogs.owner_id = auth.uid())
  );
CREATE POLICY "owner_can_update_genotypes" ON dog_genotypes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM dogs WHERE dogs.id = dog_genotypes.dog_id AND dogs.owner_id = auth.uid())
  );
CREATE POLICY "owner_can_delete_genotypes" ON dog_genotypes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM dogs WHERE dogs.id = dog_genotypes.dog_id AND dogs.owner_id = auth.uid())
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_dog_genotypes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dog_genotypes_updated_at_trigger ON dog_genotypes;
CREATE TRIGGER dog_genotypes_updated_at_trigger
  BEFORE UPDATE ON dog_genotypes
  FOR EACH ROW EXECUTE FUNCTION update_dog_genotypes_updated_at();
