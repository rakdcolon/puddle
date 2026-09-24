-- Address Supabase security advisor warnings.

-- submissions are inserted only via /api/submissions, which uses the service
-- client and bypasses RLS. The anon/authenticated direct-insert door is unused,
-- so drop the permissive policy entirely. RLS stays enabled; with no INSERT
-- policy, only the service role can write.
DROP POLICY "submissions_insert" ON submissions;

-- rls_auto_enable() is an event trigger fired on CREATE TABLE. It is not meant
-- to be reachable via /rest/v1/rpc/. Revoke EXECUTE so it isn't exposed as an
-- API endpoint. The event trigger continues to run normally.
-- This platform-managed function is absent on some fresh/local Supabase stacks.
DO $$ BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
