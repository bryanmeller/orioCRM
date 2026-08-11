-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- Linked to auth.users in code
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'PROVIDER', 'RESELLER', 'SUB_RESELLER', 'END_USER')),
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_mode VARCHAR(50) DEFAULT 'STANDARD',
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.provider_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  setup_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  max_active_users INTEGER NOT NULL DEFAULT 100,
  max_servers INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.license_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  validity_days INTEGER NOT NULL DEFAULT 30,
  self_service_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  reseller_credit_cost INTEGER NOT NULL DEFAULT 1,
  devices_allowed INTEGER NOT NULL DEFAULT 1,
  max_servers INTEGER NOT NULL DEFAULT 1,
  trial_days INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.provider_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_plan_id UUID NOT NULL REFERENCES public.provider_plans(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  active_users_limit INTEGER NOT NULL,
  server_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.iptv_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  connection_type VARCHAR(50) NOT NULL CHECK (connection_type IN ('XTREAM_MANUAL', 'XTREAM_FULL_URL', 'M3U')),
  server_url VARCHAR(255),
  xtream_username VARCHAR(100),
  xtream_password_encrypted VARCHAR(255),
  m3u_url TEXT,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  end_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin VARCHAR(50) NOT NULL CHECK (origin IN ('SELF_SERVICE', 'SUPER_ADMIN', 'PROVIDER', 'RESELLER', 'SUB_RESELLER')),
  license_plan_id UUID NOT NULL REFERENCES public.license_plans(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'BLOCKED', 'CANCELLED')),
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  devices_allowed INTEGER NOT NULL DEFAULT 1,
  max_servers INTEGER NOT NULL DEFAULT 1,
  portal_access BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.license_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES public.iptv_servers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(license_id, server_id)
);

CREATE TABLE IF NOT EXISTS public.license_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  device_id VARCHAR(100) NOT NULL,
  device_name VARCHAR(150),
  platform VARCHAR(50),
  model VARCHAR(100),
  app_version VARCHAR(50),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(license_id, device_id)
);

CREATE TABLE IF NOT EXISTS public.credit_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  from_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('PURCHASE', 'TRANSFER', 'LICENSE_CREATION', 'LICENSE_RENEWAL', 'ADMIN_ADJUSTMENT', 'REFUND')),
  description TEXT,
  license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_type VARCHAR(50) NOT NULL,
  reference_id UUID,
  amount NUMERIC(10, 2) NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  gateway VARCHAR(50) DEFAULT 'LYNX',
  gateway_transaction_id VARCHAR(100) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_parent_id ON public.profiles(parent_id);
CREATE INDEX idx_licenses_code ON public.licenses(code);
CREATE INDEX idx_licenses_owner_id ON public.licenses(owner_id);
CREATE INDEX idx_licenses_end_user_id ON public.licenses(end_user_id);
CREATE INDEX idx_iptv_servers_owner_id ON public.iptv_servers(owner_id);
CREATE INDEX idx_license_devices_device_id ON public.license_devices(device_id);
CREATE INDEX idx_credit_transactions_from_owner_id ON public.credit_transactions(from_owner_id);
CREATE INDEX idx_credit_transactions_to_owner_id ON public.credit_transactions(to_owner_id);

-- RLS
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

-- SEEDS
INSERT INTO public.license_plans (name, validity_days, self_service_price, reseller_credit_cost, devices_allowed, max_servers, trial_days)
VALUES 
('Plano 1 Tela Mensal', 30, 25.00, 1, 1, 1, 0),
('Plano 2 Telas Mensal', 30, 35.00, 2, 2, 1, 0);

INSERT INTO public.provider_plans (name, monthly_price, setup_fee, max_active_users, max_servers)
VALUES
('Provedor Starter', 99.90, 0.00, 1000, 2),
('Provedor Pro', 199.90, 0.00, 5000, 5);

INSERT INTO public.system_settings (setting_key, setting_value)
VALUES
('GLOBAL_MAINTENANCE', '{"enabled": false}');

-- RLS POLICIES

-- profiles
CREATE POLICY "Super Admin Full Access on profiles" ON public.profiles FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (
  id = auth.uid()
);
CREATE POLICY "Providers can read their network" ON public.profiles FOR SELECT USING (
  parent_id = auth.uid() OR id = auth.uid()
);

-- provider_plans
CREATE POLICY "Anyone can read active provider plans" ON public.provider_plans FOR SELECT USING (status = 'ACTIVE');

-- license_plans
CREATE POLICY "Super Admin Full Access on license_plans" ON public.license_plans FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);
CREATE POLICY "Anyone can read active license plans" ON public.license_plans FOR SELECT USING (status = 'ACTIVE');

-- provider_subscriptions
CREATE POLICY "Providers can read own subscriptions" ON public.provider_subscriptions FOR SELECT USING (
  provider_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- iptv_servers
CREATE POLICY "Owners can manage own iptv_servers" ON public.iptv_servers FOR ALL USING (
  owner_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- licenses
CREATE POLICY "Owners can manage own licenses" ON public.licenses FOR ALL USING (
  owner_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);
CREATE POLICY "End users can read own licenses" ON public.licenses FOR SELECT USING (
  end_user_id = auth.uid()
);

-- license_servers
CREATE POLICY "Users can read linked servers for their licenses" ON public.license_servers FOR SELECT USING (
  license_id IN (SELECT id FROM public.licenses WHERE owner_id = auth.uid() OR end_user_id = auth.uid())
);

-- license_devices
CREATE POLICY "Users can manage devices for their licenses" ON public.license_devices FOR ALL USING (
  license_id IN (SELECT id FROM public.licenses WHERE owner_id = auth.uid() OR end_user_id = auth.uid())
);

-- credit_balances
CREATE POLICY "Owners can read own balances" ON public.credit_balances FOR SELECT USING (
  owner_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- credit_transactions
CREATE POLICY "Users can read related transactions" ON public.credit_transactions FOR SELECT USING (
  from_owner_id = auth.uid() OR to_owner_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- payment_orders
CREATE POLICY "Buyers can read own orders" ON public.payment_orders FOR SELECT USING (
  buyer_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- system_settings
CREATE POLICY "Anyone can read system settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Super admin can update system settings" ON public.system_settings FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

