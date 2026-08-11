-- ==============================================================================
-- MIGRATION 00002: ROW LEVEL SECURITY (RLS) & ISOLATION POLICIES
-- Version: 1.0.0
-- Platform: StreamFlix TV SaaS Multi-Tenant
-- ==============================================================================

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.end_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_dns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lynx_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- 2. HELPER RECURSIVE FUNCTION: CHECK IF TARGET ACCOUNT IS IN USER'S TREE
CREATE OR REPLACE FUNCTION public.is_account_in_hierarchy(target_acc_id UUID, current_user_auth_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_acc_id UUID;
  current_role user_role_enum;
BEGIN
  SELECT id, role INTO current_acc_id, current_role
  FROM public.accounts
  WHERE auth_id = current_user_auth_id;

  -- SUPER ADMIN ACCESSES ALL
  IF current_role = 'SUPER_ADMIN' THEN
    RETURN TRUE;
  END IF;

  -- SELF ACCESS
  IF current_acc_id = target_acc_id THEN
    RETURN TRUE;
  END IF;

  -- HIERARCHY ACCESS
  -- Simplification for now: check if target's owner_id is current account
  -- In a fully recursive setup, this would be a recursive CTE.
  RETURN EXISTS (
    WITH RECURSIVE account_tree AS (
      SELECT id, owner_id FROM public.accounts WHERE id = current_acc_id
      UNION ALL
      SELECT a.id, a.owner_id FROM public.accounts a
      INNER JOIN account_tree t ON a.owner_id = t.id
    )
    SELECT 1 FROM account_tree WHERE id = target_acc_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ACCOUNTS POLICIES
CREATE POLICY "Accounts can read their own tree" ON public.accounts
FOR SELECT USING (public.is_account_in_hierarchy(id, auth.uid()));

CREATE POLICY "Accounts can update themselves" ON public.accounts
FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "Super admin can do all on accounts" ON public.accounts
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.accounts WHERE auth_id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- 4. END USERS POLICIES
CREATE POLICY "Accounts can read users in their tree" ON public.end_users
FOR SELECT USING (public.is_account_in_hierarchy(account_owner_id, auth.uid()));

CREATE POLICY "Accounts can manage users in their tree" ON public.end_users
FOR ALL USING (public.is_account_in_hierarchy(account_owner_id, auth.uid()));

-- 5. LICENSES POLICIES
CREATE POLICY "Accounts can read licenses in their tree" ON public.licenses
FOR SELECT USING (public.is_account_in_hierarchy(account_owner_id, auth.uid()));

CREATE POLICY "Accounts can manage licenses in their tree" ON public.licenses
FOR ALL USING (public.is_account_in_hierarchy(account_owner_id, auth.uid()));

-- 6. TRANSACTIONS POLICIES
CREATE POLICY "Accounts can read their own transactions" ON public.credit_transactions
FOR SELECT USING (
  public.is_account_in_hierarchy(receiver_id, auth.uid()) OR
  public.is_account_in_hierarchy(sender_id, auth.uid())
);

-- 7. PLATFORM SETTINGS POLICIES (Read-only for all, write for super admin)
CREATE POLICY "Anyone can read platform settings" ON public.platform_settings
FOR SELECT USING (TRUE);

CREATE POLICY "Super admin can write platform settings" ON public.platform_settings
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.accounts WHERE auth_id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- 8. PROVIDER PLANS POLICIES (Read-only for all, write for super admin)
CREATE POLICY "Anyone can read provider plans" ON public.provider_plans
FOR SELECT USING (TRUE);

CREATE POLICY "Super admin can write provider plans" ON public.provider_plans
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.accounts WHERE auth_id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- 9. DNS POLICIES
CREATE POLICY "Accounts can read DNS in their tree" ON public.account_dns
FOR SELECT USING (public.is_account_in_hierarchy(account_id, auth.uid()));

-- 10. ORDERS POLICIES
CREATE POLICY "Accounts can read their own orders" ON public.lynx_orders
FOR SELECT USING (public.is_account_in_hierarchy(account_id, auth.uid()));
