-- Soft-delete support for puzzles.
-- Lets the JSON-in-git sync hide a puzzle without breaking FK refs in `solves`.

ALTER TABLE puzzles ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX puzzles_deleted_at_idx ON puzzles(deleted_at) WHERE deleted_at IS NULL;

DROP POLICY "puzzles_public" ON puzzles;
CREATE POLICY "puzzles_public" ON puzzles
  FOR SELECT TO anon, authenticated
  USING (date_active <= CURRENT_DATE AND deleted_at IS NULL);
