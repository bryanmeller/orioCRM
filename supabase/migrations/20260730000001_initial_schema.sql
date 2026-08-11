-- ==============================================================================
-- MIGRATION 00001: INITIAL SCHEMA & TABLE CONSTRAINTS (POSTGRESQL / SUPABASE)
-- Version: 1.0.0
-- Platform: StreamFlix TV SaaS Multi-Tenant
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'PROVEDOR', 'REVENDA', 'SUBREVENDA', 'END_USER');
CREATE TYPE account_status_enum AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO', 'PENDENTE');
CREATE TYPE license_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED');
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'APPROVED', 'EXPIRED', 'FAILED', 'REFUNDED');
CREATE TYPE device_type_enum AS ENUM ('SMART_TV', 'MOBILE', 'WEB', 'TV_BOX');

-- 3. HIERARCHY ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.accounts(id) ON DELETE RESTRICT,
  role user_role_enum NOT NULL DEFAULT 'REVENDA',
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  credits_balance INTEGER NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
  status account_status_enum NOT NULL DEFAULT 'ATIVO',
  business_mode VARCHAR(50) DEFAULT 'STANDARD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. END USERS (CLIENTES FINAIS IPTV/OTT)
CREATE TABLE IF NOT EXISTS public.end_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_owner_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  status account_status_enum NOT NULL DEFAULT 'ATIVO',
  max_connections INTEGER NOT NULL DEFAULT 1 CHECK (max_connections >= 1),
  expiration_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 5. DEVICES
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  end_user_id UUID NOT NULL REFERENCES public.end_users(id) ON DELETE CASCADE,
  device_id VARCHAR(100) NOT NULL,
  mac_address VARCHAR(50),
  device_type device_type_enum DEFAULT 'SMART_TV',
  last_ip VARCHAR(45),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(end_user_id, device_id)
);

-- 6. PROVIDER PLANS & PACKAGES
CREATE TABLE IF NOT EXISTS public.provider_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  credits_amount INTEGER NOT NULL CHECK (credits_amount > 0),
  price_brl NUMERIC(10, 2) NOT NULL CHECK (price_brl >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. LICENSE PLANS
CREATE TABLE IF NOT EXISTS public.license_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_owner_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  price_credits INTEGER NOT NULL CHECK (price_credits >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. LICENSES (LICENÇAS MAC / ALFANUMÉRICAS)
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_owner_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  end_user_id UUID REFERENCES public.end_users(id) ON DELETE SET NULL,
  license_plan_id UUID REFERENCES public.license_plans(id) ON DELETE RESTRICT,
  code VARCHAR(100) NOT NULL UNIQUE,
  status license_status_enum NOT NULL DEFAULT 'ACTIVE',
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CREDIT TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  receiver_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount <> 0),
  transaction_type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ACCOUNT DNS & SERVER CODES
CREATE TABLE IF NOT EXISTS public.account_dns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  dns_url VARCHAR(255) NOT NULL,
  server_code VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. LYNX GATEWAY ORDERS & PAYMENTS
CREATE TABLE IF NOT EXISTS public.lynx_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  provider_plan_id UUID REFERENCES public.provider_plans(id) ON DELETE SET NULL,
  lynx_transaction_id VARCHAR(100) UNIQUE,
  pix_payload TEXT,
  amount_brl NUMERIC(10, 2) NOT NULL CHECK (amount_brl > 0),
  credits INTEGER NOT NULL CHECK (credits > 0),
  status payment_status_enum NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. PLATFORM SETTINGS (GLOBAL JSONB CONFIG)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  user_role user_role_enum,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. USER SESSIONS
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. PERMISSIONS
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role_enum NOT NULL,
  resource VARCHAR(100) NOT NULL,
  can_read BOOLEAN NOT NULL DEFAULT FALSE,
  can_write BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(role, resource)
);

-- 16. INDEXES
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON public.accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_auth ON public.accounts(auth_id);
CREATE INDEX IF NOT EXISTS idx_end_users_owner ON public.end_users(account_owner_id);
CREATE INDEX IF NOT EXISTS idx_devices_user ON public.devices(end_user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_owner ON public.licenses(account_owner_id);
CREATE INDEX IF NOT EXISTS idx_licenses_code ON public.licenses(code);
CREATE INDEX IF NOT EXISTS idx_credit_tx_receiver ON public.credit_transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_lynx_orders_account ON public.lynx_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_account ON public.audit_logs(account_id);
