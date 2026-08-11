ALTER TABLE public.provider_plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.license_plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.iptv_servers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE OR REPLACE FUNCTION public.execute_credit_transaction(
    p_from_id UUID,
    p_to_id UUID,
    p_amount NUMERIC,
    p_type TEXT,
    p_description TEXT,
    p_license_id UUID DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_from_balance NUMERIC;
    v_to_balance NUMERIC;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than zero';
    END IF;

    -- If from_id is provided, check and lock balance
    IF p_from_id IS NOT NULL THEN
        SELECT balance INTO v_from_balance FROM public.credit_balances WHERE owner_id = p_from_id FOR UPDATE;
        IF NOT FOUND OR v_from_balance < p_amount THEN
            RAISE EXCEPTION 'Insufficient credits';
        END IF;
        
        UPDATE public.credit_balances SET balance = balance - p_amount, updated_at = NOW() WHERE owner_id = p_from_id;
    END IF;

    -- If to_id is provided, add balance
    IF p_to_id IS NOT NULL THEN
        INSERT INTO public.credit_balances (owner_id, balance) VALUES (p_to_id, p_amount)
        ON CONFLICT (owner_id) DO UPDATE SET balance = credit_balances.balance + p_amount, updated_at = NOW();
    END IF;

    -- Record transaction
    INSERT INTO public.credit_transactions (
        from_owner_id, to_owner_id, amount, type, description, license_id
    ) VALUES (
        p_from_id, p_to_id, p_amount, p_type::credit_transaction_type_enum, p_description, p_license_id
    );

    RETURN '{"success": true}'::jsonb;
END;
$$;
