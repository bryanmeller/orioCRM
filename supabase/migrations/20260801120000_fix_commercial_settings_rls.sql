-- Fix is_super_admin to be safe and comprehensive
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role profile_role_enum;
    v_status profile_status_enum;
    v_deleted_at TIMESTAMPTZ;
BEGIN
    SELECT role, status, deleted_at INTO v_role, v_status, v_deleted_at
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_role = 'SUPER_ADMIN' AND v_status = 'ACTIVE' AND v_deleted_at IS NULL THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Policies for provider_plans
DROP POLICY IF EXISTS "Super Admin Full Access on provider_plans" ON public.provider_plans;
DROP POLICY IF EXISTS "Anyone can read active provider plans" ON public.provider_plans;

CREATE POLICY "Super Admin Full Access on provider_plans"
ON public.provider_plans
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Active provider plans are readable by authenticated users"
ON public.provider_plans
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (status = 'ACTIVE' AND deleted_at IS NULL);


-- Policies for license_plans
DROP POLICY IF EXISTS "Super Admin Full Access on license_plans" ON public.license_plans;
DROP POLICY IF EXISTS "Anyone can read active license plans" ON public.license_plans;

CREATE POLICY "Super Admin Full Access on license_plans"
ON public.license_plans
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Active license plans are readable by authenticated users"
ON public.license_plans
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (status = 'ACTIVE' AND deleted_at IS NULL);


-- Policies for system_settings
DROP POLICY IF EXISTS "Super admin can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;

CREATE POLICY "Super Admin Full Access on system_settings"
ON public.system_settings
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Ensuring grants are properly set for authenticated users
GRANT SELECT, INSERT, UPDATE ON public.provider_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.license_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.system_settings TO authenticated;
