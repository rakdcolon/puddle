-- Track solves by non-signed-in visitors so puzzle stats reflect everyone,
-- not just authenticated users. Keyed by a random client_id persisted in the
-- browser's localStorage (puddle.cid). The (client_id, puzzle_id) primary key
-- makes inserts idempotent, so each browser counts once per puzzle.

CREATE TABLE anon_solves (
  client_id       UUID     NOT NULL,
  puzzle_id       UUID     NOT NULL REFERENCES puzzles(id),
  status          TEXT     NOT NULL CHECK (status IN ('solved','revealed')),
  elapsed_seconds INT,
  hints_used      SMALLINT NOT NULL DEFAULT 0,
  attempts        SMALLINT NOT NULL DEFAULT 0,
  solved_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, puzzle_id)
);

CREATE INDEX ON anon_solves(puzzle_id);

-- Written and read only through the service client (the submit route + stats),
-- never the anon/authenticated REST API. Enable RLS with no policies so direct
-- client access is denied; the service role bypasses RLS.
ALTER TABLE anon_solves ENABLE ROW LEVEL SECURITY;
