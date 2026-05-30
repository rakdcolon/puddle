-- Support authenticating via Discord in addition to Google, with account
-- merging by verified email. The app's `users` row is the canonical identity;
-- a single row can carry both a google_sub and a discord_sub once linked.

-- A user may now arrive via Discord first, so google_sub is no longer required.
ALTER TABLE users ALTER COLUMN google_sub DROP NOT NULL;

-- Discord's user id (the `sub`/`id` from the Discord OAuth identity).
ALTER TABLE users ADD COLUMN discord_sub TEXT UNIQUE;

-- Merge lookups resolve an existing account by email — index it.
CREATE INDEX ON users(email);

-- RLS: a Supabase session may now be a Google OR a Discord identity, so the
-- "own row" policies must match either sub. (The app reads/writes users and
-- solves through the service client; these policies are the safety net for any
-- direct authenticated REST access.)
DROP POLICY "users_own" ON users;
CREATE POLICY "users_own" ON users
  FOR ALL TO authenticated
  USING (
    google_sub  = auth.jwt() ->> 'sub'
    OR discord_sub = auth.jwt() ->> 'sub'
  );

DROP POLICY "solves_own" ON solves;
CREATE POLICY "solves_own" ON solves
  FOR ALL TO authenticated
  USING (
    user_id = (
      SELECT id FROM users
      WHERE google_sub = auth.jwt() ->> 'sub'
         OR discord_sub = auth.jwt() ->> 'sub'
    )
  );

DROP POLICY "settings_own" ON user_settings;
CREATE POLICY "settings_own" ON user_settings
  FOR ALL TO authenticated
  USING (
    user_id = (
      SELECT id FROM users
      WHERE google_sub = auth.jwt() ->> 'sub'
         OR discord_sub = auth.jwt() ->> 'sub'
    )
  );
