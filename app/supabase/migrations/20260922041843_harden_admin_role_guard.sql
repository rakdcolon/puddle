-- A newly inserted own-user row must not bypass the existing UPDATE-only guard.
CREATE OR REPLACE FUNCTION public.prevent_is_admin_escalation()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NEW.is_admin = TRUE THEN
    IF TG_OP = 'INSERT' OR OLD.is_admin = FALSE THEN
      RAISE EXCEPTION 'Cannot escalate admin privileges';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER users_no_self_promotion ON public.users;
CREATE TRIGGER users_no_self_promotion
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_is_admin_escalation();
