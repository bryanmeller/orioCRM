import React, { useState } from 'react';
import {
  Database,
  Layers,
  ShieldCheck,
  FileCode,
  HardDrive,
  Copy,
  Check,
  Download,
  Terminal,
  Lock,
  KeyRound,
  Zap,
  Server,
  RefreshCw,
  Folder,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Code2,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { AdminUser, HierarchyAccount } from '../AdminPanel/AdminPanel';

interface SupabaseDatabaseModuleProps {
  currentUser: AdminUser | null;
  accounts: HierarchyAccount[];
  showToast: (msg: string) => void;
}

export const SupabaseDatabaseModule: React.FC<SupabaseDatabaseModuleProps> = ({
  currentUser,
  accounts,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'tables'
    | 'migrations'
    | 'rls'
    | 'seeds'
    | 'storage'
    | 'code_snippets'
  >('overview');

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string>('');
  
  const testConnection = async () => {
    setTestStatus('loading');
    try {
      const res = await fetch('/api/test-supabase');
      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus('success');
        setTestResult(data.message);
      } else {
        setTestStatus('error');
        setTestResult(data.error + (data.details ? ' ' + JSON.stringify(data.details) : ''));
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestResult(err.message || 'Erro de rede');
    }
  };
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>('ALL');

  const handleCopyCode = (codeText: string, sectionKey: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedSection(sectionKey);
    showToast('Código SQL/Typescript copiado para a área de transferência!');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // --- MIGRATION SQL FILES ---
  const migrationV1_InitialSchema = `-- ==============================================================================
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

-- 10. ACCOUNT Servidor (DNS) & SERVER CODES
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
`;

  const migrationV2_RLSPolicies = `-- ==============================================================================
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

-- 9. Servidor (DNS) POLICIES
CREATE POLICY "Accounts can read Servidor (DNS) in their tree" ON public.account_dns
FOR SELECT USING (public.is_account_in_hierarchy(account_id, auth.uid()));

-- 10. ORDERS POLICIES
CREATE POLICY "Accounts can read their own orders" ON public.lynx_orders
FOR SELECT USING (public.is_account_in_hierarchy(account_id, auth.uid()));
`;

  const migrationV3_TriggersAndFunctions = `-- ==============================================================================
-- MIGRATION 00003: SEEDS AND STORAGE
-- Version: 1.0.0
-- Platform: StreamFlix TV SaaS Multi-Tenant
-- ==============================================================================

-- 1. SEED DEFAULT PERMISSIONS
INSERT INTO public.permissions (role, resource, can_read, can_write, can_delete) VALUES
('SUPER_ADMIN', 'ALL', TRUE, TRUE, TRUE),
('PROVEDOR', 'RESELLERS', TRUE, TRUE, TRUE),
('PROVEDOR', 'USERS', TRUE, TRUE, TRUE),
('PROVEDOR', 'LICENSES', TRUE, TRUE, TRUE),
('REVENDA', 'SUBRESELLERS', TRUE, TRUE, TRUE),
('REVENDA', 'USERS', TRUE, TRUE, TRUE),
('REVENDA', 'LICENSES', TRUE, TRUE, TRUE),
('SUBREVENDA', 'USERS', TRUE, TRUE, TRUE),
('SUBREVENDA', 'LICENSES', TRUE, TRUE, TRUE)
ON CONFLICT (role, resource) DO NOTHING;

-- 2. SEED DEFAULT PROVIDER PLANS
INSERT INTO public.provider_plans (name, credits_amount, price_brl, is_active) VALUES
('Starter', 100, 200.00, TRUE),
('Professional', 500, 800.00, TRUE),
('Enterprise', 1000, 1500.00, TRUE)
ON CONFLICT DO NOTHING;

-- 3. SEED PLATFORM SETTINGS
INSERT INTO public.platform_settings (key, value, description) VALUES
('app_version', '{"version": "1.0.0", "build": 1}', 'Versão atual do aplicativo'),
('maintenance_mode', '{"enabled": false}', 'Modo de manutenção da API')
ON CONFLICT (key) DO NOTHING;

-- 4. CREATE STORAGE BUCKETS (Need to insert directly to storage.buckets)
INSERT INTO storage.buckets (id, name, public) VALUES 
('logos', 'logos', TRUE),
('avatars', 'avatars', TRUE),
('uploads', 'uploads', FALSE),
('backups', 'backups', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 5. STORAGE POLICIES
-- Logos (Public read, authenticated write)
CREATE POLICY "Public Access for Logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Auth Insert for Logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Avatars (Public read, authenticated write)
CREATE POLICY "Public Access for Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth Insert for Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Uploads (Authenticated only)
CREATE POLICY "Auth Access for Uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Insert for Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
`;


  

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 text-white font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0a0a0a] via-[#1a0f35] to-[#0a0a0a] border border-[#9C4DFF]/40 rounded-lg p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6A00FF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#6A00FF]/25 border border-white/10 px-3.5 py-1 rounded-full text-xs font-semibold text-gray-300 mb-2 shadow-sm font-mono">
              <Sparkles size={14} />
              <span>MÓDULO 22 — SUPABASE, BANCO DE DADOS POSTGRESQL & MIGRATIONS VERSIONADAS</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
              <span>Arquitetura de Dados Oficial Supabase</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold font-mono">
                PostgreSQL 15 Ready
              </span>
            </h2>
            <p className="text-gray-300 text-xs mt-1 max-w-2xl leading-relaxed">
              Persistência oficial em banco relacional PostgreSQL do Supabase, migrations SQL versionadas, integridade referencial estrita, Row Level Security (RLS) por árvore de hierarquia e buckets de armazenamento.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#000000]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-sm shrink-0 font-mono text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 size={16} />
              <span>15 Tabelas Schema SQL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center bg-[#000000] p-2 rounded-lg border border-white/10 shadow-sm overflow-x-auto gap-1.5 custom-scrollbar">
        {[
          { id: 'overview', label: 'Visão Geral & Arquitetura', icon: Database, badge: 'Supabase' },
          { id: 'tables', label: 'Tabelas & Relacionamentos', icon: Layers, badge: '15 Tables' },
          { id: 'migrations', label: 'Migrations SQL Versionadas', icon: FileCode, badge: 'V1 - V4' },
          { id: 'rls', label: 'Row Level Security (RLS)', icon: ShieldCheck, badge: 'Tree Isol' },
          { id: 'seeds', label: 'Seeds & Dados Iniciais', icon: Terminal, badge: 'SQL Seed' },
          { id: 'storage', label: 'Buckets & Storage Supabase', icon: HardDrive, badge: '4 Buckets' },
          { id: 'code_snippets', label: 'Código Client Supabase JS', icon: Code2, badge: 'TypeScript' },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-sm border border-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span className="bg-white/10 text-gray-300 text-xs px-1.5 py-0.2 rounded font-mono font-bold">
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: OVERVIEW & ARCHITECTURE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 space-y-2 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Database size={14} className="text-gray-300" />
                Engine Supabase
              </span>
              <div className="text-2xl font-semibold text-white font-mono">PostgreSQL 15</div>
              <p className="text-xs text-gray-400">Banco de dados relacional oficial com suporte a JSONB, UUID e extensions pg_crypto.</p>
            </div>

            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 space-y-2 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                Segurança RLS
              </span>
              <div className="text-2xl font-semibold text-emerald-400 font-mono">100% Isolado</div>
              <p className="text-xs text-gray-400">Políticas RLS garantem que nenhum usuário acesse dados fora de sua árvore hierárquica.</p>
            </div>

            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 space-y-2 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <FileCode size={14} className="text-blue-400" />
                Migrations DDL
              </span>
              <div className="text-2xl font-semibold text-blue-400 font-mono">Zero Manual</div>
              <p className="text-xs text-gray-400">Toda criação de tabela ou alteração é executada estritamente via migrations SQL versionadas.</p>
            </div>

            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 space-y-2 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <HardDrive size={14} className="text-amber-400" />
                Storage Buckets
              </span>
              <div className="text-2xl font-semibold text-amber-400 font-mono">4 Buckets</div>
              <p className="text-xs text-gray-400">Gestão de arquivos de logos, avatares, anexos e backups do banco com permissões dedicadas.</p>
            </div>
          </div>

          {/* DIAGRAM VISUAL DE RELACIONAMENTOS */}
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers size={18} className="text-gray-300" />
              <span>Diagrama de Integridade Referencial & Hierarquia Supabase</span>
            </h3>

            <div className="bg-[#000000] p-5 rounded-lg border border-white/10 font-mono text-xs space-y-4 text-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#000000] p-4 rounded-lg border border-purple-500/30">
                  <div className="text-purple-400 font-bold mb-2">accounts (Tabela Mãe Hierárquica)</div>
                  <ul className="space-y-1 text-xs text-gray-400">
                    <li>• <span className="text-white font-bold">id</span> (UUID PK)</li>
                    <li>• <span className="text-white">owner_id</span> (FK -&gt; accounts.id)</li>
                    <li>• <span className="text-white">role</span> (SUPER_ADMIN | PROVEDOR | REVENDA | SUBREVENDA)</li>
                    <li>• <span className="text-white">credits_balance</span> (CHECK &gt;= 0)</li>
                  </ul>
                </div>

                <div className="bg-[#000000] p-4 rounded-lg border border-blue-500/30">
                  <div className="text-blue-400 font-bold mb-2">end_users (Clientes IPTV/OTT)</div>
                  <ul className="space-y-1 text-xs text-gray-400">
                    <li>• <span className="text-white font-bold">id</span> (UUID PK)</li>
                    <li>• <span className="text-white">account_owner_id</span> (FK -&gt; accounts.id)</li>
                    <li>• <span className="text-white">username</span> (UNIQUE)</li>
                    <li>• <span className="text-white">max_connections</span> (CHECK &gt;= 1)</li>
                  </ul>
                </div>

                <div className="bg-[#000000] p-4 rounded-lg border border-emerald-500/30">
                  <div className="text-emerald-400 font-bold mb-2">licenses (Licenças Dispositivo)</div>
                  <ul className="space-y-1 text-xs text-gray-400">
                    <li>• <span className="text-white font-bold">id</span> (UUID PK)</li>
                    <li>• <span className="text-white">account_owner_id</span> (FK -&gt; accounts.id)</li>
                    <li>• <span className="text-white">code</span> (UNIQUE VARCHAR)</li>
                    <li>• <span className="text-white">status</span> (ACTIVE | EXPIRED | REVOKED)</li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 text-xs text-gray-400 leading-relaxed">
                <span className="text-white font-bold">Relações de Chave Estrangeira (Foreign Keys):</span> Todos os cadastros e transações pertencem estritamente a uma conta <code className="text-purple-300">accounts.id</code>. A exclusão de contas revendedoras cascateia permissões e restringe sub-contas por meio de RLS recursivo.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TABELAS & RELATIONSHIPS */}
      {activeTab === 'tables' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Layers size={18} className="text-gray-300" />
                <span>Dicionário Completo de Tabelas do Banco Supabase</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">14 tabelas mapeadas com restrições, chaves primárias e chaves estrangeiras.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {[
              { name: 'public.accounts', pk: 'id (UUID)', fk: 'auth_id -> auth.users.id, owner_id -> accounts.id', desc: 'Contas da hierarquia (Super Admin, Provedor, Revenda, SubRevenda)' },
              { name: 'public.end_users', pk: 'id (UUID)', fk: 'account_owner_id -> accounts.id', desc: 'Usuários finais do sistema' },
              { name: 'public.devices', pk: 'id (UUID)', fk: 'end_user_id -> end_users.id', desc: 'Dispositivos dos usuários finais' },
              { name: 'public.provider_plans', pk: 'id (UUID)', fk: '-', desc: 'Planos de pacotes de crédito' },
              { name: 'public.license_plans', pk: 'id (UUID)', fk: 'account_owner_id -> accounts.id', desc: 'Planos de licenças' },
              { name: 'public.licenses', pk: 'id (UUID)', fk: 'account_owner_id -> accounts.id, end_user_id, license_plan_id', desc: 'Licenças de ativação' },
              { name: 'public.credit_transactions', pk: 'id (UUID)', fk: 'sender_id, receiver_id -> accounts.id', desc: 'Extrato imutável de movimentações de créditos' },
              { name: 'public.account_dns', pk: 'id (UUID)', fk: 'account_id -> accounts.id', desc: 'URLs Servidor (DNS) e códigos de servidor' },
              { name: 'public.lynx_orders', pk: 'id (UUID)', fk: 'account_id, provider_plan_id', desc: 'Pedidos de PIX gerados no Gateway Lynx' },
              { name: 'public.platform_settings', pk: 'key (VARCHAR)', fk: '-', desc: 'Configurações globais armazenadas em JSONB' },
              { name: 'public.audit_logs', pk: 'id (UUID)', fk: 'account_id -> accounts.id', desc: 'Registros de auditoria de segurança' },
              { name: 'public.user_sessions', pk: 'id (UUID)', fk: 'auth_id -> auth.users.id', desc: 'Sessões ativas dos usuários' },
              { name: 'public.permissions', pk: 'id (UUID)', fk: '-', desc: 'Permissões por Role e Recurso' },
              { name: 'storage.buckets', pk: 'id (VARCHAR)', fk: '-', desc: 'Buckets: logos, avatars, uploads, backups' }
            ].map((t) => (
              <div key={t.name} className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-300 text-sm">{t.name}</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">OK</span>
                </div>
                <div className="text-gray-300 text-xs font-sans">{t.desc}</div>
                <div className="text-xs text-gray-400 space-y-0.5 pt-1 border-t border-white/5">
                  <div><strong className="text-gray-200">PK:</strong> {t.pk}</div>
                  <div><strong className="text-gray-200">FK:</strong> {t.fk}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MIGRATIONS SQL VERSIONADAS */}
      {activeTab === 'migrations' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileCode size={18} className="text-gray-300" />
              <span>Migrations SQL Versionadas para Supabase CLI</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Scripts SQL prontos para execução em <code className="text-purple-300">supabase db push</code> ou Editor SQL do Supabase.</p>
          </div>

          <div className="space-y-6">
            {/* MIGRATION 1 */}
            <div className="bg-[#000000] rounded-lg border border-white/10 overflow-hidden">
              <div className="bg-[#000000] p-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-purple-300">00001_initial_schema.sql (Tabelas & PK/FK)</span>
                <button
                  onClick={() => handleCopyCode(migrationV1_InitialSchema, 'mig1')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-xs text-gray-200 rounded-lg cursor-pointer font-sans"
                >
                  {copiedSection === 'mig1' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSection === 'mig1' ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-72 custom-scrollbar">
                {migrationV1_InitialSchema}
              </pre>
            </div>

            {/* MIGRATION 2 */}
            <div className="bg-[#000000] rounded-lg border border-white/10 overflow-hidden">
              <div className="bg-[#000000] p-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-300">00002_row_level_security_rls.sql (Políticas RLS)</span>
                <button
                  onClick={() => handleCopyCode(migrationV2_RLSPolicies, 'mig2')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-xs text-gray-200 rounded-lg cursor-pointer font-sans"
                >
                  {copiedSection === 'mig2' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSection === 'mig2' ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-72 custom-scrollbar">
                {migrationV2_RLSPolicies}
              </pre>
            </div>

            {/* MIGRATION 3 */}
            <div className="bg-[#000000] rounded-lg border border-white/10 overflow-hidden">
              <div className="bg-[#000000] p-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-blue-300">00003_triggers_and_functions.sql (Triggers e RPC)</span>
                <button
                  onClick={() => handleCopyCode(migrationV3_TriggersAndFunctions, 'mig3')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-xs text-gray-200 rounded-lg cursor-pointer font-sans"
                >
                  {copiedSection === 'mig3' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSection === 'mig3' ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-72 custom-scrollbar">
                {migrationV3_TriggersAndFunctions}
              </pre>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 4: ROW LEVEL SECURITY (RLS) POLICIES */}
      {activeTab === 'rls' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>Políticas de Segurança em Nível de Linha (Row Level Security - RLS)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Garantia absoluta de isolamento hierárquico no banco PostgreSQL.</p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">1. Função Auxiliar: is_account_in_hierarchy()</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">PL/pgSQL Security Definer</span>
              </div>
              <p className="text-gray-300 text-xs font-sans">
                Busca de forma recursiva (WITH RECURSIVE) se a conta solicitante é dona direta ou indireta da conta alvo. Retorna TRUE instantaneamente para SUPER_ADMIN.
              </p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-400">2. Isolamento de Contas e Sub-Contas (public.accounts)</span>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">USING Clause</span>
              </div>
              <p className="text-gray-300 text-xs font-sans">
                Provedores enxergam suas Revendas e SubRevendas. Revendas enxergam apenas suas SubRevendas. Usuários finais nunca conseguem consultar a tabela de contas.
              </p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400">3. Isolamento de Clientes Finais (public.end_users)</span>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">USING Clause</span>
              </div>
              <p className="text-gray-300 text-xs font-sans">
                Clientes IPTV só podem ser lidos, editados ou renovados por revendedores localizados acima de sua árvore de cadastro.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SEEDS SQL */}
      {activeTab === 'seeds' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Terminal size={18} className="text-gray-300" />
                <span>Seed SQL — Dados Iniciais e Registros de Padrão</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Gera Super Admin, Provedor e Revenda de testes com pacotes de crédito e Servidor (DNS).</p>
            </div>
            <button
              onClick={() => handleCopyCode('', 'seeds')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg shadow-sm cursor-pointer"
            >
              {copiedSection === 'seeds' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedSection === 'seeds' ? 'Copiado!' : 'Copiar Seed SQL'}</span>
            </button>
          </div>

          <pre className="p-4 bg-[#000000] border border-white/10 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto max-h-96 custom-scrollbar">
            
          </pre>
        </div>
      )}

      {/* SUB-TAB 6: STORAGE BUCKETS */}
      {activeTab === 'storage' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <HardDrive size={18} className="text-amber-400" />
              <span>Buckets do Supabase Storage Configurados</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Armazenamento de arquivos com restrições de MIME-type e limites de tamanho.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Folder size={16} className="text-emerald-400" />
                  Bucket "logos"
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">Público (5 MB)</span>
              </div>
              <p className="text-gray-400 text-xs">Logotipos personalizados para personalização White-Label do aplicativo TV e painel web.</p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Folder size={16} className="text-blue-400" />
                  Bucket "avatars"
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400">Público (2 MB)</span>
              </div>
              <p className="text-gray-400 text-xs">Fotos de perfil de Provedores e Revendedores registradas no painel.</p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Folder size={16} className="text-purple-400" />
                  Bucket "uploads"
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400">Autenticado (50 MB)</span>
              </div>
              <p className="text-gray-400 text-xs">Comprovantes de pagamento PIX e documentos de renovação.</p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Folder size={16} className="text-red-400" />
                  Bucket "backups"
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400">Restrito Super Admin (500 MB)</span>
              </div>
              <p className="text-gray-400 text-xs">Armazenamento seguro de Dumps SQL do PostgreSQL para recuperação de desastre.</p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: CODE SNIPPETS TS */}
      {activeTab === 'code_snippets' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Code2 size={18} className="text-gray-300" />
              <span>Cliente Supabase TypeScript Integrado (@supabase/supabase-js)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Exemplo de inicialização e execução de RPC para transferência atômica de créditos.</p>
          </div>

          <pre className="p-4 bg-[#000000] border border-white/10 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto custom-scrollbar">
{`import { createClient } from '@supabase/supabase-js';

// INICIALIZAÇÃO DO CLIENTE SUPABASE
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xyz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// EXEMPLO: EXECUTAR TRANSFERÊNCIA ATÔMICA DE CRÉDITOS VIA RPC
export async function transferCredits(senderId: string, receiverId: string, amount: number, notes: string) {
  const { data, error } = await supabase.rpc('fn_transfer_credits', {
    p_sender_id: senderId,
    p_receiver_id: receiverId,
    p_amount: amount,
    p_notes: notes
  });

  if (error) {
    throw new Error(\`Erro Supabase: \${error.message}\`);
  }

  return data;
}`}
          </pre>
        </div>
      )}
    </div>
  );
};
