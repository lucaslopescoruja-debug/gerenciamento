
CREATE OR REPLACE FUNCTION get_auth_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(impersonated_company_id, company_id)
  FROM users
  WHERE auth_user_id = auth.uid()
  AND active = true
  LIMIT 1;
$$;

DROP POLICY IF EXISTS "view_users" ON public.users;
DROP POLICY IF EXISTS "insert_users" ON public.users;
DROP POLICY IF EXISTS "update_users" ON public.users;
DROP POLICY IF EXISTS "delete_users" ON public.users;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_users" ON public.users
FOR SELECT USING (
    auth_user_id = auth.uid() 
    OR company_id = get_auth_company_id()
    OR (SELECT is_super_admin FROM users WHERE auth_user_id = auth.uid() LIMIT 1) = true
);

CREATE POLICY "insert_users" ON public.users
FOR INSERT WITH CHECK (
    company_id = get_auth_company_id()
    OR (SELECT is_super_admin FROM users WHERE auth_user_id = auth.uid() LIMIT 1) = true
);

CREATE POLICY "update_users" ON public.users
FOR UPDATE USING (
    auth_user_id = auth.uid() 
    OR company_id = get_auth_company_id()
    OR (SELECT is_super_admin FROM users WHERE auth_user_id = auth.uid() LIMIT 1) = true
);

CREATE POLICY "delete_users" ON public.users
FOR DELETE USING (
    company_id = get_auth_company_id()
    OR (SELECT is_super_admin FROM users WHERE auth_user_id = auth.uid() LIMIT 1) = true
);
