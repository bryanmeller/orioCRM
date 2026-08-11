CREATE TABLE IF NOT EXISTS public.credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    price_per_credit NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    status generic_status_enum NOT NULL DEFAULT 'ACTIVE',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin Full Access on credit_packages"
ON public.credit_packages
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Active credit packages are readable by authenticated users"
ON public.credit_packages
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (status = 'ACTIVE' AND deleted_at IS NULL);

GRANT SELECT, INSERT, UPDATE ON public.credit_packages TO authenticated;

-- Seed initial packages
INSERT INTO public.credit_packages (name, credits, price_per_credit, total_price, sort_order) VALUES
('+10 Créditos', 10, 7.00, 70.00, 1),
('+20 Créditos', 20, 6.00, 120.00, 2),
('+100 Créditos', 100, 5.00, 500.00, 3),
('+1000 Créditos', 1000, 4.00, 4000.00, 4);

CREATE TRIGGER trg_credit_packages_updated_at
BEFORE UPDATE ON public.credit_packages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- IMPORTANT: Se você está rodando isso no SQL Editor do Supabase, 
-- após a execução, pode ser necessário rodar:
NOTIFY pgrst, 'reload schema';
