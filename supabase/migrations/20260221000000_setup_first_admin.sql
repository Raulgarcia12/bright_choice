-- Migration: create claim_first_admin() RPC for the setup page
-- This function is SECURITY DEFINER, runs as the DB owner, and only works
-- when there are NO existing admin users — safe to expose via the anon key.

CREATE OR REPLACE FUNCTION public.claim_first_admin(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_admin_count int;
BEGIN
  -- Guard: reject if any admin already exists
  SELECT COUNT(*) INTO existing_admin_count
  FROM public.user_roles
  WHERE role = 'admin';

  IF existing_admin_count > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'admin_exists');
  END IF;

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT DO NOTHING;

  -- Also confirm the email immediately so the user can log in
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = target_user_id
    AND email_confirmed_at IS NULL;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.claim_first_admin(uuid) TO anon, authenticated;

-- Helper: check whether any admin already exists (used on page load)
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.has_any_admin() TO anon, authenticated;
