-- Drop tables if they exist
DROP TABLE IF EXISTS "public"."transactions";
DROP TABLE IF EXISTS "public"."credit_balances";
DROP TABLE IF EXISTS "public"."devices";
DROP TABLE IF EXISTS "public"."licenses";
DROP TABLE IF EXISTS "public"."end_users";
DROP TABLE IF EXISTS "public"."server_dns";
DROP TABLE IF EXISTS "public"."license_plans";
DROP TABLE IF EXISTS "public"."provider_plans";
DROP TABLE IF EXISTS "public"."provider_subscriptions";
DROP TABLE IF EXISTS "public"."hierarchy_accounts";
DROP TABLE IF EXISTS "public"."admin_users";

-- Hierarchy Accounts (Provedores, Revendas, Sub-Revendas)
CREATE TABLE "public"."hierarchy_accounts" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "parent_id" TEXT REFERENCES hierarchy_accounts(id),
    "parent_name" TEXT,
    "owner_type" TEXT,
    "status" TEXT DEFAULT 'Ativo',
    "created_at" TEXT,
    "updated_at" TEXT
);

-- Admin Users (Linked to Supabase Auth)
CREATE TABLE "public"."admin_users" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "account_id" TEXT REFERENCES hierarchy_accounts(id) ON DELETE CASCADE,
    "created_at" TEXT
);

-- Provider Plans
CREATE TABLE "public"."provider_plans" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "max_active_users" INTEGER NOT NULL,
    "monthly_price" DECIMAL(10, 2) NOT NULL,
    "setup_fee" DECIMAL(10, 2) NOT NULL,
    "status" TEXT DEFAULT 'ATIVA',
    "created_at" TEXT,
    "updated_at" TEXT
);

-- Provider Subscriptions
CREATE TABLE "public"."provider_subscriptions" (
    "id" TEXT PRIMARY KEY,
    "provider_id" TEXT REFERENCES hierarchy_accounts(id) ON DELETE CASCADE,
    "plan_id" TEXT REFERENCES provider_plans(id),
    "status" TEXT DEFAULT 'ATIVA',
    "start_date" TEXT,
    "next_billing_date" TEXT,
    "created_at" TEXT,
    "updated_at" TEXT
);

-- License Plans
CREATE TABLE "public"."license_plans" (
    "id" TEXT PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "dias" INTEGER NOT NULL,
    "credit_cost" INTEGER NOT NULL,
    "sell_price" DECIMAL(10, 2) NOT NULL,
    "max_devices" INTEGER NOT NULL,
    "max_dns" INTEGER NOT NULL,
    "status" TEXT DEFAULT 'ATIVO',
    "created_at" TEXT,
    "updated_at" TEXT
);

-- Server DNS
CREATE TABLE "public"."server_dns" (
    "id" TEXT PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "owner_id" TEXT REFERENCES hierarchy_accounts(id) ON DELETE CASCADE,
    "owner_name" TEXT,
    "owner_type" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "server_code" TEXT,
    "notes" TEXT,
    "server_url" TEXT,
    "server_name" TEXT,
    "dns_url" TEXT,
    "created_at" TEXT,
    "updated_at" TEXT
);

-- End Users
CREATE TABLE "public"."end_users" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT DEFAULT 'Ativo',
    "provider_id" TEXT REFERENCES hierarchy_accounts(id),
    "provider_name" TEXT,
    "reseller_id" TEXT REFERENCES hierarchy_accounts(id),
    "reseller_name" TEXT,
    "origin_type" TEXT NOT NULL,
    "origin_id" TEXT REFERENCES hierarchy_accounts(id),
    "authorized_dns" JSONB DEFAULT '[]'::jsonb,
    "created_at" TEXT,
    "updated_at" TEXT,
    "is_deleted" BOOLEAN DEFAULT false
);

-- Licenses
CREATE TABLE "public"."licenses" (
    "id" TEXT PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "origin" TEXT NOT NULL,
    "owner_id" TEXT REFERENCES hierarchy_accounts(id),
    "owner_type" TEXT NOT NULL,
    "status" TEXT DEFAULT 'ATIVA',
    "devices_allowed" INTEGER DEFAULT 1,
    "max_servers" INTEGER DEFAULT 1,
    "user_id" TEXT REFERENCES end_users(id) ON DELETE CASCADE,
    "user_name" TEXT,
    "provider_id" TEXT REFERENCES hierarchy_accounts(id),
    "provider_name" TEXT,
    "reseller_id" TEXT REFERENCES hierarchy_accounts(id),
    "reseller_name" TEXT,
    "plan_id" TEXT REFERENCES license_plans(id),
    "plan_name" TEXT,
    "days" INTEGER NOT NULL,
    "credit_cost" INTEGER NOT NULL,
    "expires_at" TEXT NOT NULL,
    "device_id" TEXT,
    "registered_devices" JSONB DEFAULT '[]'::jsonb,
    "created_at" TEXT,
    "updated_at" TEXT
);

-- Credit Balances
CREATE TABLE "public"."credit_balances" (
    "id" TEXT PRIMARY KEY,
    "owner_id" TEXT UNIQUE REFERENCES hierarchy_accounts(id) ON DELETE CASCADE,
    "owner_name" TEXT,
    "owner_type" TEXT,
    "balance" INTEGER DEFAULT 0,
    "created_at" TEXT,
    "updated_at" TEXT
);

-- Transactions
CREATE TABLE "public"."transactions" (
    "id" TEXT PRIMARY KEY,
    "transaction_uuid" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "from_owner_id" TEXT REFERENCES hierarchy_accounts(id),
    "from_owner_name" TEXT,
    "to_owner_id" TEXT REFERENCES hierarchy_accounts(id) OR TEXT REFERENCES licenses(id),
    "to_owner_name" TEXT,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TEXT
);

-- Credit Orders (Lynx)
CREATE TABLE "public"."credit_orders" (
    "id" TEXT PRIMARY KEY,
    "order_uuid" TEXT,
    "provider_id" TEXT,
    "provider_name" TEXT,
    "credits" INTEGER,
    "amount" DECIMAL(10, 2),
    "payment_method" TEXT,
    "payment_status" TEXT,
    "gateway_transaction_id" TEXT,
    "pix_qr_code_url" TEXT,
    "pix_copia_e_cola" TEXT,
    "created_at" TEXT,
    "updated_at" TEXT
);

-- Disable RLS for demo environments, allowing frontend to query directly
ALTER TABLE "public"."hierarchy_accounts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."admin_users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."provider_plans" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."provider_subscriptions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."license_plans" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."server_dns" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."end_users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."licenses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."credit_balances" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transactions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."credit_orders" DISABLE ROW LEVEL SECURITY;
