-- Add is_admin flag to users table.
-- Admins are set via service role only; authenticated users cannot self-promote.
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Block authenticated users from escalating is_admin to true.
-- Service role bypasses RLS and this trigger via current_user = 'service_role'.
CREATE OR REPLACE FUNCTION prevent_is_admin_escalation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_admin = TRUE AND OLD.is_admin = FALSE AND current_user = 'authenticated' THEN
    RAISE EXCEPTION 'Cannot escalate admin privileges';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_no_self_promotion
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_is_admin_escalation();
