-- 1. Tables and RLS status
SELECT 
    tablename AS table_name, 
    rowsecurity AS rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Policies
SELECT 
    tablename AS table_name, 
    policyname AS policy_name 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Functions
SELECT 
    proname AS function_name
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

-- 4. Triggers
SELECT 
    event_object_table AS table_name,
    trigger_name, 
    event_manipulation AS event
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. Missing Profiles or Users (Consistency Check)
SELECT 
    a.id AS auth_user_id, 
    a.email AS auth_email, 
    p.id AS profile_id, 
    p.email AS profile_email
FROM auth.users a
FULL OUTER JOIN public.profiles p ON a.id = p.id
WHERE a.id IS NULL OR p.id IS NULL;

-- 6. Super Admin Check
SELECT 
    id, 
    email, 
    role, 
    status, 
    portal_access 
FROM public.profiles 
WHERE role = 'SUPER_ADMIN';

-- 7. Table Row Counts
SELECT 'profiles' as table, count(*) from public.profiles
UNION ALL SELECT 'provider_plans', count(*) from public.provider_plans
UNION ALL SELECT 'license_plans', count(*) from public.license_plans
UNION ALL SELECT 'provider_subscriptions', count(*) from public.provider_subscriptions
UNION ALL SELECT 'iptv_servers', count(*) from public.iptv_servers
UNION ALL SELECT 'licenses', count(*) from public.licenses
UNION ALL SELECT 'license_servers', count(*) from public.license_servers
UNION ALL SELECT 'license_devices', count(*) from public.license_devices
UNION ALL SELECT 'credit_balances', count(*) from public.credit_balances
UNION ALL SELECT 'credit_transactions', count(*) from public.credit_transactions
UNION ALL SELECT 'payment_orders', count(*) from public.payment_orders
UNION ALL SELECT 'audit_logs', count(*) from public.audit_logs
UNION ALL SELECT 'system_settings', count(*) from public.system_settings;
