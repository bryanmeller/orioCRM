DROP POLICY IF EXISTS "Anyone can read active license plans" ON public.license_plans;

CREATE POLICY "Active license plans are readable by authenticated users"
ON public.license_plans
FOR SELECT
TO authenticated
USING (status = 'ACTIVE' AND deleted_at IS NULL);
