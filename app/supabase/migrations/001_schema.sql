-- puddle schema
-- Apply in Supabase SQL editor or via: supabase db push

CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub   TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email        TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE puzzles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_no        INT  UNIQUE NOT NULL,
  vol             INT  NOT NULL DEFAULT 1,
  date_active     DATE UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  genre           TEXT NOT NULL CHECK (genre IN ('logic','quant','pattern','lateral','wordplay','deduction')),
  difficulty      SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  prompt          JSONB NOT NULL,          -- string[]
  answer          TEXT NOT NULL,           -- trimmed + lowercased for comparison
  answer_display  TEXT NOT NULL,           -- original casing for solution display
  hints           JSONB NOT NULL DEFAULT '[]',          -- string[] up to 3
  solution_lede   TEXT NOT NULL DEFAULT '',
  solution_steps  JSONB NOT NULL DEFAULT '[]',          -- {body, elapsed_min}[]
  input_type      TEXT NOT NULL CHECK (input_type IN ('freetext','numeric','choice')),
  input_config    JSONB                    -- numeric: {min,max}; choice: {options: string[]}
);

CREATE TABLE solves (
  user_id         UUID     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id       UUID     NOT NULL REFERENCES puzzles(id),
  status          TEXT     NOT NULL CHECK (status IN ('solved','revealed')),
  elapsed_seconds INT,
  hints_used      SMALLINT NOT NULL DEFAULT 0,
  attempts        SMALLINT NOT NULL DEFAULT 0,
  solved_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, puzzle_id)
);

CREATE TABLE submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_email  TEXT NOT NULL,
  submitter_name   TEXT NOT NULL,
  payload          JSONB NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected'))
);

CREATE TABLE user_settings (
  user_id      UUID    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sound        BOOLEAN NOT NULL DEFAULT TRUE,
  show_streak  BOOLEAN NOT NULL DEFAULT TRUE,
  hint_pacing  TEXT    NOT NULL DEFAULT 'instant' CHECK (hint_pacing IN ('instant','5s-pause')),
  display_name TEXT
);

-- Performance indexes
CREATE INDEX ON puzzles(date_active);
CREATE INDEX ON solves(user_id);
CREATE INDEX ON solves(puzzle_id);

-- Row Level Security
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE solves        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Puzzles readable by everyone (date_active in the past or today)
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "puzzles_public" ON puzzles
  FOR SELECT TO anon, authenticated
  USING (date_active <= CURRENT_DATE);

-- Users can only read/write their own row
CREATE POLICY "users_own" ON users
  FOR ALL TO authenticated
  USING (google_sub = auth.jwt() ->> 'sub');

-- Solves belong to their user
CREATE POLICY "solves_own" ON solves
  FOR ALL TO authenticated
  USING (user_id = (SELECT id FROM users WHERE google_sub = auth.jwt() ->> 'sub'));

-- Settings belong to their user
CREATE POLICY "settings_own" ON user_settings
  FOR ALL TO authenticated
  USING (user_id = (SELECT id FROM users WHERE google_sub = auth.jwt() ->> 'sub'));

-- Submissions: write-only for everyone, no read via RLS (use service role for admin reads)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions_insert" ON submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
