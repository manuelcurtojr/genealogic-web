ALTER TABLE kennel_pages
  ADD COLUMN IF NOT EXISTS undo_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS redo_history jsonb NOT NULL DEFAULT '[]'::jsonb;
SELECT 'kennel_pages: undo_history + redo_history OK';
