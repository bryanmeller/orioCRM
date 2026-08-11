BEGIN;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO \$$ BEGIN
    CREATE TYPE profile_role_enum AS ENUM ('SUPER_ADMIN', 'PROVIDER', 'RESELLER', 'SUB_RESELLER', 'END_USER');
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TYPE profile_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TYPE business_mode_enum AS ENUM ('SYSTEM', 'PROVIDER', 'RESELLER', 'SUB_RESELLER', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TYPE license_origin_enum AS ENUM ('SELF_SERVICE', 'SUPER_ADMIN', 'PROVIDER', 'RESELLER', 'SUB_RESELLER');
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TYPE license_status_enum AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'BLOCKED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TYPE server_connection_type_enum AS ENUM ('XTREAM_MANUAL', 'XTREAM_FULL_URL', 'M3U');
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TYPE credit_transaction_type_enum AS ENUM ('PURCHASE', 'TRANSFER', 'LICENSE_CREATION', 'LICENSE_RENEWAL', 'ADMIN_ADJUSTMENT', 'REFUND');
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TYPE payment_order_type_enum AS ENUM ('CREDIT_PURCHASE', 'PROVIDER_SUBSCRIPTION', 'SELF_SERVICE_LICENSE');
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TYPE generic_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END \$$;

-- 3. TABLES

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    role profile_role_enum NOT NULL DEFAULT 'END_USER',
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    business_mode business_mode_enum NOT NULL DEFAULT 'CUSTOMER',
    status profile_status_enum NOT NULL DEFAULT 'ACTIVE',
    portal_access BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(lower(username));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON public.profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- PROVIDER PLANS
CREATE TABLE IF NOT EXISTS public.provider_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    monthly_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monthly_price >= 0),
    setup_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (setup_fee >= 0),
    max_active_users INTEGER NOT NULL DEFAULT 0 CHECK (max_active_users >= 0),
    max_servers INTEGER NOT NULL DEFAULT 0 CHECK (max_servers >= 0),
    status generic_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- LICENSE PLANS
CREATE TABLE IF NOT EXISTS public.license_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    validity_days INTEGER NOT NULL CHECK (validity_days > 0),
    self_service_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (self_service_price >= 0),
    reseller_credit_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (reseller_credit_cost >= 0),
    devices_allowed INTEGER NOT NULL DEFAULT 1 CHECK (devices_allowed > 0),
    max_servers INTEGER NOT NULL DEFAULT 1 CHECK (max_servers > 0),
    trial_days INTEGER NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
    status generic_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- PROVIDER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.provider_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.provider_plans(id) ON DELETE RESTRICT,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status generic_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- IPTV SERVERS
CREATE TABLE IF NOT EXISTS public.iptv_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    connection_type server_connection_type_enum NOT NULL,
    url TEXT NOT NULL,
    username TEXT,
    password TEXT,
    status generic_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- LICENSES
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    end_user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    origin license_origin_enum NOT NULL,
    plan_id UUID NOT NULL REFERENCES public.license_plans(id) ON DELETE RESTRICT,
    status license_status_enum NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMPTZ NOT NULL,
    devices_allowed INTEGER NOT NULL DEFAULT 1 CHECK (devices_allowed > 0),
    max_servers INTEGER NOT NULL DEFAULT 1 CHECK (max_servers > 0),
    portal_access BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- LICENSE SERVERS
CREATE TABLE IF NOT EXISTS public.license_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
    server_id UUID NOT NULL REFERENCES public.iptv_servers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(license_id, server_id)
);

-- LICENSE DEVICES
CREATE TABLE IF NOT EXISTS public.license_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    platform TEXT,
    model TEXT,
    app_version TEXT,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(license_id, device_id)
);

-- CREDIT BALANCES
CREATE TABLE IF NOT EXISTS public.credit_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CREDIT TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    from_owner_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    to_owner_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    type credit_transaction_type_enum NOT NULL,
    description TEXT,
    license_id UUID NULL REFERENCES public.licenses(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PAYMENT ORDERS
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_type payment_order_type_enum NOT NULL,
    reference_id UUID NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    credits NUMERIC(14,2) NOT NULL DEFAULT 0,
    status payment_status_enum NOT NULL DEFAULT 'PENDING',
    gateway TEXT DEFAULT 'LYNX',
    gateway_transaction_id TEXT,
    gateway_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_orders_gateway_transaction_id ON public.payment_orders(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 4. FUNCTIONS & TRIGGERS

-- set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS \$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$$ LANGUAGE plpgsql;

DO \$$ BEGIN
    CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TRIGGER trg_provider_plans_updated_at BEFORE UPDATE ON public.provider_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TRIGGER trg_license_plans_updated_at BEFORE UPDATE ON public.license_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TRIGGER trg_provider_subscriptions_updated_at BEFORE UPDATE ON public.provider_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TRIGGER trg_iptv_servers_updated_at BEFORE UPDATE ON public.iptv_servers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TRIGGER trg_licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TRIGGER trg_credit_balances_updated_at BEFORE UPDATE ON public.credit_balances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TRIGGER trg_payment_orders_updated_at BEFORE UPDATE ON public.payment_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

DO \$$ BEGIN
    CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

-- generate_license_code
CREATE OR REPLACE FUNCTION public.generate_license_code()
RETURNS TEXT AS \$$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER := 0;
    done BOOLEAN := false;
BEGIN
    WHILE NOT done LOOP
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        IF NOT EXISTS (SELECT 1 FROM public.licenses WHERE code = result) THEN
            done := true;
        END IF;
    END LOOP;
    RETURN result;
END;
\$$ LANGUAGE plpgsql VOLATILE;

-- before_insert_license
CREATE OR REPLACE FUNCTION public.before_insert_license()
RETURNS TRIGGER AS \$$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := public.generate_license_code();
    END IF;
    RETURN NEW;
END;
\$$ LANGUAGE plpgsql;

DO \$$ BEGIN
    CREATE TRIGGER trg_before_insert_license BEFORE INSERT ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.before_insert_license();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

-- before_update_license_code
CREATE OR REPLACE FUNCTION public.before_update_license_code()
RETURNS TRIGGER AS \$$
BEGIN
    IF NEW.code <> OLD.code THEN
        RAISE EXCEPTION 'O código da licença não pode ser alterado.';
    END IF;
    RETURN NEW;
END;
\$$ LANGUAGE plpgsql;

DO \$$ BEGIN
    CREATE TRIGGER trg_before_update_license_code BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.before_update_license_code();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

-- before_insert_license_server
CREATE OR REPLACE FUNCTION public.before_insert_license_server()
RETURNS TRIGGER AS \$$
DECLARE
    v_license_owner UUID;
    v_server_owner UUID;
    v_max_servers INTEGER;
    v_current_servers INTEGER;
BEGIN
    SELECT owner_id, max_servers INTO v_license_owner, v_max_servers FROM public.licenses WHERE id = NEW.license_id;
    SELECT owner_id INTO v_server_owner FROM public.iptv_servers WHERE id = NEW.server_id;
    
    IF v_license_owner <> v_server_owner THEN
        RAISE EXCEPTION 'O servidor deve pertencer ao mesmo proprietário da licença.';
    END IF;
    
    SELECT COUNT(*) INTO v_current_servers FROM public.license_servers WHERE license_id = NEW.license_id;
    IF v_current_servers >= v_max_servers THEN
        RAISE EXCEPTION 'O limite de servidores da licença foi atingido.';
    END IF;
    
    RETURN NEW;
END;
\$$ LANGUAGE plpgsql;

DO \$$ BEGIN
    CREATE TRIGGER trg_before_insert_license_server BEFORE INSERT ON public.license_servers FOR EACH ROW EXECUTE FUNCTION public.before_insert_license_server();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

-- before_insert_license_device
CREATE OR REPLACE FUNCTION public.before_insert_license_device()
RETURNS TRIGGER AS \$$
DECLARE
    v_devices_allowed INTEGER;
    v_current_devices INTEGER;
BEGIN
    SELECT devices_allowed INTO v_devices_allowed FROM public.licenses WHERE id = NEW.license_id;
    SELECT COUNT(*) INTO v_current_devices FROM public.license_devices WHERE license_id = NEW.license_id;
    
    IF v_current_devices >= v_devices_allowed THEN
        RAISE EXCEPTION 'O limite de dispositivos da licença foi atingido.';
    END IF;
    
    RETURN NEW;
END;
\$$ LANGUAGE plpgsql;

DO \$$ BEGIN
    CREATE TRIGGER trg_before_insert_license_device BEFORE INSERT ON public.license_devices FOR EACH ROW EXECUTE FUNCTION public.before_insert_license_device();
EXCEPTION WHEN duplicate_object THEN null; END \$$;

-- auto_create_profile_from_auth
CREATE OR REPLACE FUNCTION public.auto_create_profile_from_auth()
RETURNS TRIGGER AS \$$
BEGIN
    IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'full_name' IS NOT NULL AND NEW.raw_user_meta_data->>'username' IS NOT NULL THEN
        INSERT INTO public.profiles (
            id,
            full_name,
            email,
            username,
            role,
            parent_id,
            business_mode,
            status,
            portal_access
        ) VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'full_name',
            NEW.email,
            NEW.raw_user_meta_data->>'username',
            COALESCE((NEW.raw_user_meta_data->>'role')::profile_role_enum, 'END_USER'::profile_role_enum),
            (NEW.raw_user_meta_data->>'parent_id')::uuid,
            COALESCE((NEW.raw_user_meta_data->>'business_mode')::business_mode_enum, 'CUSTOMER'::business_mode_enum),
            COALESCE((NEW.raw_user_meta_data->>'status')::profile_status_enum, 'ACTIVE'::profile_status_enum),
            COALESCE((NEW.raw_user_meta_data->>'portal_access')::boolean, false)
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
\$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO \$$ BEGIN
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.auto_create_profile_from_auth();
EXCEPTION WHEN OTHERS THEN null; END \$$;

-- HELPER FUNCTIONS FOR RLS
CREATE OR REPLACE FUNCTION public.current_profile_id() RETURNS UUID AS \$$
    SELECT auth.uid();
\$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.current_profile_role() RETURNS profile_role_enum AS \$$
    SELECT role FROM public.profiles WHERE id = auth.uid();
\$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS BOOLEAN AS \$$
    SELECT public.current_profile_role() = 'SUPER_ADMIN'::profile_role_enum;
\$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_profile_in_my_tree(target_profile_id uuid) RETURNS BOOLEAN AS \$$
DECLARE
    v_role profile_role_enum;
    v_parent_id uuid;
BEGIN
    IF target_profile_id = auth.uid() THEN RETURN true; END IF;
    v_role := public.current_profile_role();
    IF v_role = 'SUPER_ADMIN' THEN RETURN true; END IF;
    
    SELECT parent_id INTO v_parent_id FROM public.profiles WHERE id = target_profile_id;
    
    IF v_role = 'PROVIDER' THEN
        RETURN v_parent_id = auth.uid();
    END IF;
    
    IF v_role = 'RESELLER' THEN
        RETURN v_parent_id = auth.uid();
    END IF;
    
    RETURN false;
END;
\$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iptv_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES IF RE-RUNNING
DO \$$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename); 
    END LOOP; 
END \$$;

-- PROFILES POLICIES
CREATE POLICY "Super Admin Full Access on profiles" ON public.profiles FOR ALL USING (public.is_super_admin());
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Providers and Resellers can read tree" ON public.profiles FOR SELECT USING (public.is_profile_in_my_tree(id));

-- PROVIDER PLANS POLICIES
CREATE POLICY "Super Admin Full Access on provider_plans" ON public.provider_plans FOR ALL USING (public.is_super_admin());
CREATE POLICY "Anyone can read active provider plans" ON public.provider_plans FOR SELECT USING (status = 'ACTIVE');

-- LICENSE PLANS POLICIES
CREATE POLICY "Super Admin Full Access on license_plans" ON public.license_plans FOR ALL USING (public.is_super_admin());
CREATE POLICY "Anyone can read active license plans" ON public.license_plans FOR SELECT USING (status = 'ACTIVE');

-- PROVIDER SUBSCRIPTIONS POLICIES
CREATE POLICY "Super Admin Full Access on provider_subscriptions" ON public.provider_subscriptions FOR ALL USING (public.is_super_admin());
CREATE POLICY "Providers can read own subscriptions" ON public.provider_subscriptions FOR SELECT USING (provider_id = auth.uid());

-- IPTV SERVERS POLICIES
CREATE POLICY "Super Admin Full Access on iptv_servers" ON public.iptv_servers FOR ALL USING (public.is_super_admin());
CREATE POLICY "Owners can manage own iptv_servers" ON public.iptv_servers FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "End users can see their licensed servers" ON public.iptv_servers FOR SELECT USING (
    id IN (
        SELECT server_id FROM public.license_servers WHERE license_id IN (
            SELECT id FROM public.licenses WHERE end_user_id = auth.uid() OR owner_id = auth.uid()
        )
    )
);

-- LICENSES POLICIES
CREATE POLICY "Super Admin Full Access on licenses" ON public.licenses FOR ALL USING (public.is_super_admin());
CREATE POLICY "Owners can manage own licenses" ON public.licenses FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "End users can read own licenses" ON public.licenses FOR SELECT USING (end_user_id = auth.uid() AND portal_access = true);

-- LICENSE SERVERS POLICIES
CREATE POLICY "Super Admin Full Access on license_servers" ON public.license_servers FOR ALL USING (public.is_super_admin());
CREATE POLICY "Owners can manage own license_servers" ON public.license_servers FOR ALL USING (
    license_id IN (SELECT id FROM public.licenses WHERE owner_id = auth.uid())
);
CREATE POLICY "End users can read own license_servers" ON public.license_servers FOR SELECT USING (
    license_id IN (SELECT id FROM public.licenses WHERE end_user_id = auth.uid() AND portal_access = true)
);

-- LICENSE DEVICES POLICIES
CREATE POLICY "Super Admin Full Access on license_devices" ON public.license_devices FOR ALL USING (public.is_super_admin());
CREATE POLICY "Owners can manage own license_devices" ON public.license_devices FOR ALL USING (
    license_id IN (SELECT id FROM public.licenses WHERE owner_id = auth.uid())
);
CREATE POLICY "End users can read own license_devices" ON public.license_devices FOR SELECT USING (
    license_id IN (SELECT id FROM public.licenses WHERE end_user_id = auth.uid() AND portal_access = true)
);

-- CREDIT BALANCES POLICIES
CREATE POLICY "Super Admin Full Access on credit_balances" ON public.credit_balances FOR ALL USING (public.is_super_admin());
CREATE POLICY "Owners can read own balances" ON public.credit_balances FOR SELECT USING (owner_id = auth.uid());

-- CREDIT TRANSACTIONS POLICIES
CREATE POLICY "Super Admin Full Access on credit_transactions" ON public.credit_transactions FOR ALL USING (public.is_super_admin());
CREATE POLICY "Users can read related transactions" ON public.credit_transactions FOR SELECT USING (
    from_owner_id = auth.uid() OR to_owner_id = auth.uid()
);

-- PAYMENT ORDERS POLICIES
CREATE POLICY "Super Admin Full Access on payment_orders" ON public.payment_orders FOR ALL USING (public.is_super_admin());
CREATE POLICY "Buyers can read own orders" ON public.payment_orders FOR SELECT USING (buyer_id = auth.uid());

-- AUDIT LOGS POLICIES
CREATE POLICY "Super Admin Full Access on audit_logs" ON public.audit_logs FOR ALL USING (public.is_super_admin());

-- SYSTEM SETTINGS POLICIES
CREATE POLICY "Super admin can manage system settings" ON public.system_settings FOR ALL USING (public.is_super_admin());
CREATE POLICY "Anyone can read system settings" ON public.system_settings FOR SELECT USING (true);

COMMIT;
