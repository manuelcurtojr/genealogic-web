-- Observaciones visuales (fenotipo) del perro
--
-- Una capa más simple que dog_genotypes: el criador describe lo que VE
-- (color principal + atributos visibles) y el sistema infiere los alelos
-- compatibles con confidence apropiada. Para criadores sin test DNA.

CREATE TABLE IF NOT EXISTS dog_color_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL UNIQUE REFERENCES dogs(id) ON DELETE CASCADE,
  -- Color principal (referencia al catálogo existente)
  color_id uuid REFERENCES colors(id) ON DELETE SET NULL,
  -- Atributos visibles refinables
  coat_length text NOT NULL DEFAULT 'short' CHECK (coat_length IN ('short', 'medium', 'long', 'wire')),
  white_pattern text NOT NULL DEFAULT 'none' CHECK (white_pattern IN ('none', 'small', 'parti', 'piebald')),
  has_merle boolean NOT NULL DEFAULT false,
  has_mask boolean NOT NULL DEFAULT false,
  has_tan_points boolean NOT NULL DEFAULT false,
  has_brindle boolean NOT NULL DEFAULT false,
  is_diluted boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dog_color_observations_dog_id_idx ON dog_color_observations(dog_id);

-- RLS: el dueño del perro gestiona su observación
ALTER TABLE dog_color_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_can_select_color_obs" ON dog_color_observations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM dogs WHERE dogs.id = dog_color_observations.dog_id AND dogs.owner_id = auth.uid())
  );
CREATE POLICY "owner_can_insert_color_obs" ON dog_color_observations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM dogs WHERE dogs.id = dog_color_observations.dog_id AND dogs.owner_id = auth.uid())
  );
CREATE POLICY "owner_can_update_color_obs" ON dog_color_observations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM dogs WHERE dogs.id = dog_color_observations.dog_id AND dogs.owner_id = auth.uid())
  );
CREATE POLICY "owner_can_delete_color_obs" ON dog_color_observations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM dogs WHERE dogs.id = dog_color_observations.dog_id AND dogs.owner_id = auth.uid())
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_dog_color_observations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dog_color_observations_updated_at_trigger ON dog_color_observations;
CREATE TRIGGER dog_color_observations_updated_at_trigger
  BEFORE UPDATE ON dog_color_observations
  FOR EACH ROW EXECUTE FUNCTION update_dog_color_observations_updated_at();
