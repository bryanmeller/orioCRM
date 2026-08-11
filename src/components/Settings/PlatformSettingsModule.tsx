import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Shield,
  UploadCloud,
  Mail,
  Database,
  Terminal,
  Palette,
  Smartphone,
  AlertTriangle,
  Building2,
  CheckCircle2,
  KeyRound,
  Globe,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Send,
  Download,
  Lock,
  Layers,
  Sparkles,
  Server,
  FileCode,
  Check,
  X,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import {
  AdminUser,
  ProviderPlan,
  LicensePlan,
  AccountDns
} from '../AdminPanel/AdminPanel';

interface PlatformSettingsModuleProps {
  currentUser: AdminUser | null;
  providerPlans: ProviderPlan[];
  setProviderPlans: React.Dispatch<React.SetStateAction<ProviderPlan[]>>;
  plans: LicensePlan[];
  setPlans: React.Dispatch<React.SetStateAction<LicensePlan[]>>;
  accountDnsList: AccountDns[];
  setAccountDnsList: React.Dispatch<React.SetStateAction<AccountDns[]>>;
  showToast: (msg: string) => void;
}

export type SettingsTab =
  | 'geral'
  | 'provider_plans'
  | 'license_plans'
  | 'lynx_gateway'
  | 'dns_global'
  | 'security'
  | 'uploads'
  | 'email'
  | 'backup'
  | 'logs'
  | 'customization'
  | 'app_config'
  | 'maintenance'
  | 'api_docs';

export interface SystemLogItem {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SECURITY';
  module: string;
  user: string;
  ip: string;
  action: string;
  details: string;
}

export const PlatformSettingsModule: React.FC<PlatformSettingsModuleProps> = ({
  currentUser,
  providerPlans,
  setProviderPlans,
  plans,
  setPlans,
  accountDnsList,
  setAccountDnsList,
  showToast,
}) => {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isProvedor = currentUser?.role === 'PROVEDOR';

  // Selected Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('geral');

  // 1. TAB: GERAL STATE
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'StreamFlix Multi-Tenant SaaS',
    appName: 'StreamFlix TV',
    currentVersion: 'v19.4.2-STABLE',
    website: 'https://streamflix.tv',
    supportEmail: 'suporte@streamflix.tv',
    supportPhone: '+55 11 98765-4321',
    logoUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200&auto=format&fit=crop',
    faviconUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=32&auto=format&fit=crop',
    primaryColor: '#6A00FF',
    secondaryColor: '#9C4DFF',
    defaultLanguage: 'pt-BR',
    timeZone: 'America/Sao_Paulo (UTC-3)',
  });

  // 2. TAB: PLANOS DOS PROVEDORES (Provider Plans State)
  const [editingProviderPlan, setEditingProviderPlan] = useState<Partial<ProviderPlan> | null>(null);
  const [showProviderPlanModal, setShowProviderPlanModal] = useState<boolean>(false);

  // 3. TAB: PLANOS DE LICENÇAS (12m, 24m, 36m License Plans State)
  const [licensePlanConfigs, setLicensePlanConfigs] = useState({
    plan12m: { active: true, price: 180.0, credits: 1, name: '12 Meses Premium' },
    plan24m: { active: true, price: 320.0, credits: 2, name: '24 Meses Family Pack' },
    plan36m: { active: true, price: 420.0, credits: 3, name: '36 Meses Lifetime Corporate' },
  });

  // 4. TAB: LYNX GATEWAY STATE
  const [lynxGateway, setLynxGateway] = useState({
    apiKey: '',
    secret: '',
    webhookUrl: 'https://api.streamflix.tv/api/v1/webhooks/lynx-pix',
    environment: 'production' as 'sandbox' | 'production',
    timeoutSeconds: 30,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    pricePerCredit: 15.0,
  });

  // 5. TAB: Servidor (DNS) GLOBAL STATE
  const [globalDnsInput, setGlobalDnsInput] = useState({
    dnsUrl: 'http://cdn-global.streamflix.tv:8080',
    
    notes: 'DNS de borda com balancamento BGP',
  });

  // 6. TAB: SEGURANÇA STATE
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    jwtExpirationHours: 24,
    refreshTokenDays: 7,
    minPasswordLength: 8,
    requireSpecialChar: true,
    requireNumbers: true,
    requireUppercase: true,
  });

  // 7. TAB: UPLOADS STATE
  const [uploadSettings, setUploadSettings] = useState({
    maxFileSizeMb: 25,
    allowedExtensions: '.jpg, .png, .webp, .svg, .apk',
    storageDirectory: '/var/www/uploads/streamflix',
    autoCompressImages: true,
  });

  // 8. TAB: E-MAIL (SMTP) STATE
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    smtpUser: 'apikey',
    smtpPass: 'SG.891a2b3c4d5e6f7a8b9c0d.secret_key',
    senderEmail: 'no-reply@streamflix.tv',
    useSsl: false,
    useTls: true,
  });

  // 9. TAB: BACKUP STATE
  const [backupSettings, setBackupSettings] = useState({
    autoBackupEnabled: true,
    periodicity: 'DAILY' as 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
    retentionDays: 30,
    backupDirectory: '/var/backups/postgresql/streamflix',
    lastBackupDate: '29/07/2026 03:00:12',
  });

  // 10. TAB: LOGS STATE
  const [logs, setLogs] = useState<SystemLogItem[]>([
    {
      id: 'log-1',
      timestamp: '29/07/2026 10:14:22',
      level: 'INFO',
      module: 'AUTENTICACAO',
      user: 'superadmin@streamflix.tv',
      ip: '189.120.45.102',
      action: 'LOGIN_SUCCESS',
      details: 'Sessão iniciada com sucesso via duplo fator.',
    },
    {
      id: 'log-2',
      timestamp: '29/07/2026 09:55:01',
      level: 'SECURITY',
      module: 'LYNX_PIX',
      user: 'webhook@lynx.gateway',
      ip: '52.90.122.4',
      action: 'WEBHOOK_CONFIRMATION',
      details: 'Pedido ORD-8812 confirmado R$ 150.00 (+10 CR).',
    },
    {
      id: 'log-3',
      timestamp: '29/07/2026 08:30:10',
      level: 'WARNING',
      module: 'SEGURANCA',
      user: 'revenda_sul@streamflix.tv',
      ip: '200.180.12.99',
      action: 'FAILED_LOGIN',
      details: 'Senha incorreta digitada (Tentativa 1/5).',
    },
    {
      id: 'log-4',
      timestamp: '29/07/2026 03:00:12',
      level: 'INFO',
      module: 'BACKUP_ENGINE',
      user: 'SYSTEM_CRON',
      ip: '127.0.0.1',
      action: 'BACKUP_CREATED',
      details: 'Dump PostgreSQL executado. Arquivo: streamflix_20260729.sql.gz (142MB).',
    },
  ]);
  const [logFilterLevel, setLogFilterLevel] = useState<string>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // 11. TAB: PERSONALIZAÇÃO STATE
  const [customizationSettings, setCustomizationSettings] = useState({
    loginTitle: 'StreamFlix TV — Acesse sua Conta',
    initialMessage: 'Seja bem-vindo à melhor experiência em streaming 4K Ultra HD.',
    footerText: '© 2026 StreamFlix TV Network. Todos os direitos reservados.',
    themeStyle: 'DARK_PURPLE_PREMIUM',
  });

  // 12. TAB: APLICATIVO STATE
  const [appConfigSettings, setAppConfigSettings] = useState({
    minRequiredVersion: '1.2.0',
    currentAppVersion: '2.1.0',
    updateMessage: 'Nova versão disponível com melhorias no player HLS e suporte a Dolby Atmos.',
    forceUpdate: false,
    apkUrl: 'https://cdn.streamflix.tv/apps/streamflix-mobile-v2.1.0.apk',
    androidTvUrl: 'https://cdn.streamflix.tv/apps/streamflix-androidtv-v2.1.0.apk',
    fireTvUrl: 'https://cdn.streamflix.tv/apps/streamflix-firetv-v2.1.0.apk',
  });

  // 13. TAB: MANUTENÇÃO STATE
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    maintenanceMode: false,
    customMessage: 'Estamos realizando uma manutenção preventiva programada em nossos servidores de borda. Voltaremos em breve!',
    estimatedReturnTime: '29/07/2026 às 12:00 BRT',
  });

  // Handlers for Save & Test Actions
  const handleSaveGeneral = () => {
    showToast('Configurações Gerais salvas no Banco de Dados com sucesso!');
  };

  const handleTestLynxConnection = () => {
    showToast(`Pagamento temporariamente indisponível. Integração com o Gateway em configuração.`);
  };

  const handleTestSmtpEmail = () => {
    showToast(`E-mail de teste enviado para ${emailSettings.senderEmail} via SMTP ${emailSettings.smtpHost}:${emailSettings.smtpPort}!`);
  };

  const handleRunBackupNow = () => {
    const now = new Date().toLocaleString('pt-BR');
    setBackupSettings((prev) => ({ ...prev, lastBackupDate: now }));
    showToast(`Backup do Banco de Dados PostgreSQL executado com sucesso! Salvo em ${backupSettings.backupDirectory}.`);
  };

  const handleRestoreBackup = () => {
    if (window.confirm('Atenção: A restauração irá sobrescrever os dados atuais. Deseja prosseguir com o último backup?')) {
      showToast('Processo de restauração de backup concluído com sucesso!');
    }
  };

  const handleAddGlobalDns = () => {
    if (!globalDnsInput.dnsUrl) {
      showToast('Insira uma URL de Servidor (DNS) válida.');
      return;
    }
    const newDns: AccountDns = {
      id: `dns-global-${Date.now()}`,
      ownerId: 'GLOBAL_PLATFORM',
      ownerName: 'Plataforma Global',
      ownerType: 'SUPER_ADMIN',
      domain: globalDnsInput.dnsUrl,
      dnsUrl: globalDnsInput.dnsUrl,
      updatedAt: new Date().toISOString(),
      
      status: 'ATIVO',
      notes: globalDnsInput.notes,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };
    setAccountDnsList((prev) => [newDns, ...prev]);
    setGlobalDnsInput({ dnsUrl: '',  notes: '' });
    showToast('DNS Global cadastrada com sucesso!');
  };

  const handleDeleteGlobalDns = (id: string) => {
    setAccountDnsList((prev) => prev.filter((d) => d.id !== id));
    showToast('DNS Global removida!');
  };

  // Filtered System Logs
  const filteredLogs = logs.filter((l) => {
    const matchLevel = logFilterLevel === 'ALL' || l.level === logFilterLevel;
    const q = logSearchQuery.toLowerCase();
    const matchSearch =
      !q ||
      l.user.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.module.toLowerCase().includes(q);
    return matchLevel && matchSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 text-white font-sans">
      {/* Top Banner & Header Info */}
      <div className="bg-gradient-to-r from-[#0a0a0a] via-[#1c004d]/60 to-[#0a0a0a] border border-white/10 rounded-lg p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6A00FF]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#6A00FF]/25 border border-white/10 px-3.5 py-1 rounded-full text-xs font-semibold text-gray-300 mb-2 shadow-sm">
              <Sparkles size={14} />
              <span>MÓDULO 20 — CONFIGURAÇÕES GERAIS DA PLATAFORMA</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
              <span>Central Unificada de Administração SaaS</span>
              <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-bold">
                Role: {currentUser?.role}
              </span>
            </h2>
            <p className="text-gray-300 text-xs mt-1 max-w-2xl leading-relaxed">
              Todas as variáveis globais, planos, chaves de pagamento, SMTP, logs e configurações de segurança armazenadas em banco de dados com isolamento por perfil de acesso.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#000000]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-sm shrink-0">
            <button
              onClick={() => showToast('Cache de configurações limpo e recarregado do Banco de Dados!')}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-white/10"
            >
              <RefreshCw size={14} />
              <span>Recarregar Cache DB</span>
            </button>
            <button
              onClick={handleSaveGeneral}
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-black rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm border border-white/10"
            >
              <Save size={14} />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>

      {/* 13-Tab Navigation Bar */}
      <div className="flex items-center bg-[#000000] p-2 rounded-lg border border-white/10 shadow-sm overflow-x-auto gap-1.5 custom-scrollbar">
        {[
          { id: 'geral', label: 'Geral', icon: Settings, adminOnly: false },
          { id: 'provider_plans', label: 'Planos Provedores', icon: Building2, adminOnly: true },
          { id: 'license_plans', label: 'Planos Licenças', icon: KeyRound, adminOnly: true },
          { id: 'lynx_gateway', label: 'Gateway Lynx', icon: ShieldCheck, adminOnly: true },
          { id: 'dns_global', label: 'DNS Global', icon: Globe, adminOnly: false },
          { id: 'security', label: 'Segurança', icon: Shield, adminOnly: true },
          { id: 'uploads', label: 'Uploads', icon: UploadCloud, adminOnly: true },
          { id: 'email', label: 'E-mail SMTP', icon: Mail, adminOnly: true },
          { id: 'backup', label: 'Backup DB', icon: Database, adminOnly: true },
          { id: 'logs', label: 'Logs Sistema', icon: Terminal, adminOnly: true },
          { id: 'customization', label: 'Personalização', icon: Palette, adminOnly: false },
          { id: 'app_config', label: 'Aplicativo TV', icon: Smartphone, adminOnly: true },
          { id: 'maintenance', label: 'Manutenção', icon: AlertTriangle, adminOnly: true },
          { id: 'api_docs', label: 'APIs Endpoints', icon: FileCode, adminOnly: false },
        ].map((tab) => {
          const Icon = tab.icon;
          const isDisabled = tab.adminOnly && !isSuperAdmin;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isDisabled) {
                  showToast('Apenas o Super Admin tem permissão para esta aba.');
                  return;
                }
                setActiveTab(tab.id as SettingsTab);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-sm border border-white/10'
                  : isDisabled
                  ? 'text-gray-600 bg-white/2 opacity-50 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {isDisabled && <Lock size={10} className="text-gray-500 ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GERAL */}
      {activeTab === 'geral' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Settings size={18} className="text-gray-300" />
                <span>Configurações Gerais da Plataforma</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Identificação principal, contatos de suporte e fuso horário.</p>
            </div>
            {!isSuperAdmin && (
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full font-mono">
                Modo Edição Limitada ({currentUser?.role})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Nome da Plataforma</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={generalSettings.platformName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Nome do Aplicativo</label>
              <input
                type="text"
                value={generalSettings.appName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, appName: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Versão Atual do Sistema</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={generalSettings.currentVersion}
                onChange={(e) => setGeneralSettings({ ...generalSettings, currentVersion: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30 font-mono disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Website Oficial</label>
              <input
                type="text"
                value={generalSettings.website}
                onChange={(e) => setGeneralSettings({ ...generalSettings, website: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">E-mail de Suporte</label>
              <input
                type="email"
                value={generalSettings.supportEmail}
                onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Telefone / WhatsApp</label>
              <input
                type="text"
                value={generalSettings.supportPhone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, supportPhone: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">URL do Logotipo</label>
              <input
                type="text"
                value={generalSettings.logoUrl}
                onChange={(e) => setGeneralSettings({ ...generalSettings, logoUrl: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Cor Primária</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={generalSettings.primaryColor}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, primaryColor: e.target.value })}
                  className="w-10 h-9 bg-transparent border border-white/10 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={generalSettings.primaryColor}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, primaryColor: e.target.value })}
                  className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Fuso Horário Padrão</label>
              <select
                disabled={!isSuperAdmin}
                value={generalSettings.timeZone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, timeZone: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30 disabled:opacity-50"
              >
                <option value="America/Sao_Paulo (UTC-3)">America/Sao_Paulo (UTC-3)</option>
                <option value="America/Manaus (UTC-4)">America/Manaus (UTC-4)</option>
                <option value="Europe/Lisbon (UTC+0)">Europe/Lisbon (UTC+0)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={handleSaveGeneral}
              className="px-6 py-2 bg-white text-black font-bold rounded-lg shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Save size={16} />
              <span>Salvar Configurações Gerais</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PLANOS DOS PROVEDORES */}
      {activeTab === 'provider_plans' && isSuperAdmin && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Building2 size={18} className="text-gray-300" />
                <span>Gestão de Planos de Assinatura dos Provedores</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Configurar capacidades, mensalidade e taxa de implantação para Provedores.</p>
            </div>
            <button
              onClick={() => {
                setEditingProviderPlan({
                  name: '',
                  maxActiveUsers: 500,
                  monthlyPrice: 299.0,
                  implementationFee: 150.0,
                  description: 'Plano com suporte a múltiplos servidores',
                  status: 'ACTIVE',
                });
                setShowProviderPlanModal(true);
              }}
              className="px-4 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Criar Novo Plano de Provedor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providerPlans.map((plan) => (
              <div key={plan.id} className="bg-[#000000] border border-white/10 rounded-lg p-5 shadow-sm space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{plan.name}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      plan.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {plan.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <div className="text-2xl font-semibold text-gray-300">
                    R$ {plan.monthlyPrice.toFixed(2)} <span className="text-xs text-gray-400 font-sans">/mês</span>
                  </div>
                  <p className="text-gray-400">Limite Ativo: <strong className="text-white">{plan.maxActiveUsers} Usuários</strong></p>
                  <p className="text-gray-400">Taxa Implantação: <strong className="text-white">R$ {plan.implementationFee.toFixed(2)}</strong></p>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{plan.description}</p>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                  <button
                    onClick={() => {
                      setProviderPlans((prev) =>
                        prev.map((p) => (p.id === plan.id ? { ...p, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : p))
                      );
                      showToast(`Status do plano ${plan.name} alterado com sucesso!`);
                    }}
                    className="text-gray-400 hover:text-white cursor-pointer"
                  >
                    {plan.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                  </button>

                  <button
                    onClick={() => {
                      setProviderPlans((prev) => prev.filter((p) => p.id !== plan.id));
                      showToast(`Plano ${plan.name} removido logicamente!`);
                    }}
                    className="text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PLANOS DE LICENÇAS */}
      {activeTab === 'license_plans' && isSuperAdmin && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <KeyRound size={18} className="text-gray-300" />
              <span>Configuração dos Ciclos de Licença (12, 24 e 36 Meses)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Definir consumo de créditos, precificação e ativação para longos períodos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
            {/* 12 MESES */}
            <div className="bg-[#000000] border border-purple-500/30 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-extrabold text-white text-sm">Plano 12 Meses (1 Ano)</span>
                <span className="text-xs text-purple-400 font-mono font-bold">365 Dias</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 block mb-1">Nome de Exibição</label>
                  <input
                    type="text"
                    value={licensePlanConfigs.plan12m.name}
                    onChange={(e) => setLicensePlanConfigs({
                      ...licensePlanConfigs,
                      plan12m: { ...licensePlanConfigs.plan12m, name: e.target.value }
                    })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Valor Final (R$)</label>
                  <input
                    type="number"
                    value={licensePlanConfigs.plan12m.price}
                    onChange={(e) => setLicensePlanConfigs({
                      ...licensePlanConfigs,
                      plan12m: { ...licensePlanConfigs.plan12m, price: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Créditos Consumidos</label>
                  <input
                    type="number"
                    value={licensePlanConfigs.plan12m.credits}
                    onChange={(e) => setLicensePlanConfigs({
                      ...licensePlanConfigs,
                      plan12m: { ...licensePlanConfigs.plan12m, credits: parseInt(e.target.value) || 1 }
                    })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 24 MESES */}
            <div className="bg-[#000000] border border-blue-500/30 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-extrabold text-white text-sm">Plano 24 Meses (2 Anos)</span>
                <span className="text-xs text-blue-400 font-mono font-bold">730 Dias</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 block mb-1">Nome de Exibição</label>
                  <input
                    type="text"
                    value={licensePlanConfigs.plan24m.name}
                    onChange={(e) => setLicensePlanConfigs({
                      ...licensePlanConfigs,
                      plan24m: { ...licensePlanConfigs.plan24m, name: e.target.value }
                    })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Valor Final (R$)</label>
                  <input
                    type="number"
                    value={licensePlanConfigs.plan24m.price}
                    onChange={(e) => setLicensePlanConfigs({
                      ...licensePlanConfigs,
                      plan24m: { ...licensePlanConfigs.plan24m, price: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Créditos Consumidos</label>
                  <input
                    type="number"
                    value={licensePlanConfigs.plan24m.credits}
                    onChange={(e) => setLicensePlanConfigs({
                      ...licensePlanConfigs,
                      plan24m: { ...licensePlanConfigs.plan24m, credits: parseInt(e.target.value) || 1 }
                    })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 36 MESES */}
            <div className="bg-[#000000] border border-emerald-500/30 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-extrabold text-white text-sm">Plano 36 Meses (3 Anos)</span>
                <span className="text-xs text-emerald-400 font-mono font-bold">1095 Dias</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 block mb-1">Nome de Exibição</label>
                  <input
                    type="text"
                    value={licensePlanConfigs.plan36m.name}
                    onChange={(e) => setLicensePlanConfigs({
                      ...licensePlanConfigs,
                      plan36m: { ...licensePlanConfigs.plan36m, name: e.target.value }
                    })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Valor Final (R$)</label>
                  <input
                    type="number"
                    value={licensePlanConfigs.plan36m.price}
                    onChange={(e) => setLicensePlanConfigs({
                      ...licensePlanConfigs,
                      plan36m: { ...licensePlanConfigs.plan36m, price: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Créditos Consumidos</label>
                  <input
                    type="number"
                    value={licensePlanConfigs.plan36m.credits}
                    onChange={(e) => setLicensePlanConfigs({
                      ...licensePlanConfigs,
                      plan36m: { ...licensePlanConfigs.plan36m, credits: parseInt(e.target.value) || 1 }
                    })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => showToast('Planos de Licenças (12m, 24m, 36m) atualizados com sucesso!')}
              className="px-6 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Save size={16} />
              <span>Salvar Planos de Licenças</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: GATEWAY LYNX */}
      {activeTab === 'lynx_gateway' && isSuperAdmin && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-gray-300" />
                <span>Configurações do Gateway de Pagamento Lynx PIX</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Credenciais da API REST, Webhook de ativação automática e precificação por crédito.</p>
            </div>
            <button
              onClick={handleTestLynxConnection}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Testar Conexão Gateway Lynx</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Lynx API Key</label>
              <input
                type="text"
                value={lynxGateway.apiKey}
                onChange={(e) => setLynxGateway({ ...lynxGateway, apiKey: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Lynx API Secret</label>
              <input
                type="password"
                value={lynxGateway.secret}
                onChange={(e) => setLynxGateway({ ...lynxGateway, secret: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-gray-300 font-semibold block">URL do Webhook para Confirmação PIX</label>
              <input
                type="text"
                value={lynxGateway.webhookUrl}
                onChange={(e) => setLynxGateway({ ...lynxGateway, webhookUrl: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Ambiente de Operação</label>
              <select
                value={lynxGateway.environment}
                onChange={(e) => setLynxGateway({ ...lynxGateway, environment: e.target.value as any })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
              >
                <option value="sandbox">Sandbox (Testes com QR Code Simulado)</option>
                <option value="production">Produção (Chaveiro PIX Oficial Lynx)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Preço de Tabela por Crédito (R$)</label>
              <input
                type="number"
                value={lynxGateway.pricePerCredit}
                onChange={(e) => setLynxGateway({ ...lynxGateway, pricePerCredit: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => showToast('Parâmetros do Gateway Lynx PIX salvos!')}
              className="px-6 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Save size={16} />
              <span>Salvar Parâmetros Lynx</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: Servidor (DNS) GLOBAL */}
      {activeTab === 'dns_global' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Globe size={18} className="text-gray-300" />
              <span>Cadastro de Servidor (DNS) Globais Sugeridas</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Servidores (DNS) de apoio cadastrados pelo Super Admin como sugestão para novos Provedores.</p>
          </div>

          <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Cadastrar Nova Servidor (DNS) Global</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <input
                type="text"
                placeholder="URL da Servidor (DNS) (ex: http://play.streamflix.tv:8080)"
                value={globalDnsInput.dnsUrl}
                onChange={(e) => setGlobalDnsInput({ ...globalDnsInput, dnsUrl: e.target.value })}
                className="bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Código"
                value={globalDnsInput.serverCode}
                onChange={(e) => setGlobalDnsInput({ ...globalDnsInput, serverCode: e.target.value })}
                className="bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
              <button
                onClick={handleAddGlobalDns}
                className="bg-[#6A00FF] hover:bg-[#801aff] text-white font-bold px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>Adicionar DNS</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 font-mono uppercase text-xs">
                  <th className="p-3">DNS URL</th>
                  <th className="p-3">Código</th>
                  <th className="p-3">Proprietário</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {accountDnsList.map((dns) => (
                  <tr key={dns.id} className="hover:bg-white/5">
                    <td className="p-3 text-white font-bold">{dns.dnsUrl}</td>
                    
                    <td className="p-3 text-gray-300 font-sans">{dns.ownerName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {dns.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {dns.ownerId === 'GLOBAL_PLATFORM' && (
                        <button
                          onClick={() => handleDeleteGlobalDns(dns.id)}
                          className="text-red-400 hover:text-red-300 font-sans cursor-pointer text-xs"
                        >
                          Remover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SEGURANÇA */}
      {activeTab === 'security' && isSuperAdmin && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Shield size={18} className="text-gray-300" />
              <span>Políticas de Segurança e Autenticação JWT</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Tempo de sessão, bloqueio por força bruta e regras de complexidade de senhas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Tempo Limite da Sessão (Minutos)</label>
              <input
                type="number"
                value={securitySettings.sessionTimeoutMinutes}
                onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeoutMinutes: parseInt(e.target.value) || 30 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Tentativas Máximas de Login</label>
              <input
                type="number"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Tempo de Bloqueio (Minutos)</label>
              <input
                type="number"
                value={securitySettings.lockoutDurationMinutes}
                onChange={(e) => setSecuritySettings({ ...securitySettings, lockoutDurationMinutes: parseInt(e.target.value) || 15 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">JWT Expiration (Horas)</label>
              <input
                type="number"
                value={securitySettings.jwtExpirationHours}
                onChange={(e) => setSecuritySettings({ ...securitySettings, jwtExpirationHours: parseInt(e.target.value) || 24 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Tamanho Mínimo da Senha</label>
              <input
                type="number"
                value={securitySettings.minPasswordLength}
                onChange={(e) => setSecuritySettings({ ...securitySettings, minPasswordLength: parseInt(e.target.value) || 8 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-3 md:col-span-3 pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-white block">Requisitos de Senha Exigidos:</span>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.requireSpecialChar}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, requireSpecialChar: e.target.checked })}
                    className="rounded border-white/10 bg-[#000000] text-gray-400"
                  />
                  <span>Obrigar Caracteres Especiais (!@#$)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.requireNumbers}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, requireNumbers: e.target.checked })}
                    className="rounded border-white/10 bg-[#000000] text-gray-400"
                  />
                  <span>Obrigar Números (0-9)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.requireUppercase}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, requireUppercase: e.target.checked })}
                    className="rounded border-white/10 bg-[#000000] text-gray-400"
                  />
                  <span>Obrigar Letras Maiúsculas (A-Z)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => showToast('Regras de Segurança atualizadas!')}
              className="px-6 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Save size={16} />
              <span>Salvar Políticas de Segurança</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: UPLOADS */}
      {activeTab === 'uploads' && isSuperAdmin && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <UploadCloud size={18} className="text-gray-300" />
              <span>Diretórios e Parâmetros de Upload de Arquivos</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Limites de tamanho, formatos aceitos e diretórios no servidor.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Tamanho Máximo do Arquivo (MB)</label>
              <input
                type="number"
                value={uploadSettings.maxFileSizeMb}
                onChange={(e) => setUploadSettings({ ...uploadSettings, maxFileSizeMb: parseInt(e.target.value) || 10 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Extensões Permitidas</label>
              <input
                type="text"
                value={uploadSettings.allowedExtensions}
                onChange={(e) => setUploadSettings({ ...uploadSettings, allowedExtensions: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-gray-300 font-semibold block">Diretório de Armazenamento Local</label>
              <input
                type="text"
                value={uploadSettings.storageDirectory}
                onChange={(e) => setUploadSettings({ ...uploadSettings, storageDirectory: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadSettings.autoCompressImages}
                  onChange={(e) => setUploadSettings({ ...uploadSettings, autoCompressImages: e.target.checked })}
                  className="rounded border-white/10 bg-[#000000] text-gray-400"
                />
                <span>Compressão Automática de Imagens (WebP 80% qualidade)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => showToast('Parâmetros de Upload salvos com sucesso!')}
              className="px-6 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Save size={16} />
              <span>Salvar Configuração de Uploads</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: E-MAIL (SMTP) */}
      {activeTab === 'email' && isSuperAdmin && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Mail size={18} className="text-gray-300" />
                <span>Servidor SMTP e Notificações Transacionais</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Envio de e-mails de redefinição de senha e alertas de vencimento.</p>
            </div>
            <button
              onClick={handleTestSmtpEmail}
              className="px-4 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Send size={14} />
              <span>Enviar E-mail de Teste</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">SMTP Host</label>
              <input
                type="text"
                value={emailSettings.smtpHost}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">SMTP Porta</label>
              <input
                type="number"
                value={emailSettings.smtpPort}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) || 587 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">SMTP Usuário</label>
              <input
                type="text"
                value={emailSettings.smtpUser}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">SMTP Senha</label>
              <input
                type="password"
                value={emailSettings.smtpPass}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">E-mail do Remetente</label>
              <input
                type="email"
                value={emailSettings.senderEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailSettings.useSsl}
                  onChange={(e) => setEmailSettings({ ...emailSettings, useSsl: e.target.checked })}
                  className="rounded border-white/10 bg-[#000000] text-gray-400"
                />
                <span>SSL</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailSettings.useTls}
                  onChange={(e) => setEmailSettings({ ...emailSettings, useTls: e.target.checked })}
                  className="rounded border-white/10 bg-[#000000] text-gray-400"
                />
                <span>TLS</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => showToast('Configurações SMTP salvas!')}
              className="px-6 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Save size={16} />
              <span>Salvar E-mail SMTP</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 9: BACKUP */}
      {activeTab === 'backup' && isSuperAdmin && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Database size={18} className="text-gray-300" />
              <span>Rotinas de Backup do Banco de Dados PostgreSQL</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Políticas de retenção, dumps automatizados e restauração de emergência.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Periodicidade do Backup</label>
              <select
                value={backupSettings.periodicity}
                onChange={(e) => setBackupSettings({ ...backupSettings, periodicity: e.target.value as any })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="HOURLY">A cada 1 hora</option>
                <option value="DAILY">Diário (3h da manhã)</option>
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensal</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Retenção de Dumps (Dias)</label>
              <input
                type="number"
                value={backupSettings.retentionDays}
                onChange={(e) => setBackupSettings({ ...backupSettings, retentionDays: parseInt(e.target.value) || 30 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-gray-300 font-semibold block">Diretório do Servidor</label>
              <input
                type="text"
                value={backupSettings.backupDirectory}
                onChange={(e) => setBackupSettings({ ...backupSettings, backupDirectory: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="md:col-span-2 bg-[#000000] p-4 rounded-lg border border-white/5 flex items-center justify-between font-mono">
              <div>
                <span className="text-gray-400 text-xs block">Último Backup Realizado:</span>
                <span className="text-emerald-400 text-sm font-bold">{backupSettings.lastBackupDate}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunBackupNow}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Database size={14} />
                  <span>Executar Backup Agora</span>
                </button>
                <button
                  onClick={handleRestoreBackup}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-sans text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={14} />
                  <span>Restaurar Backup</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: LOGS */}
      {activeTab === 'logs' && isSuperAdmin && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Terminal size={18} className="text-gray-300" />
                <span>Logs do Sistema e Trilha de Auditoria</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Auditoria em tempo real de autenticações, ações do admin e transações do gateway.</p>
            </div>

            <button
              onClick={() => {
                setLogs([]);
                showToast('Logs antigos excluídos com sucesso!');
              }}
              className="px-3.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg cursor-pointer"
            >
              Excluir Logs Antigos
            </button>
          </div>

          {/* Search & Filter Logs */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 gap-2 flex-1">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por usuário, IP, ação ou módulo..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none w-full"
              />
            </div>

            <select
              value={logFilterLevel}
              onChange={(e) => setLogFilterLevel(e.target.value)}
              className="bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
            >
              <option value="ALL">Todos os Níveis</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="SECURITY">SECURITY</option>
            </select>
          </div>

          <div className="overflow-x-auto bg-[#000000] rounded-lg border border-white/10">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase text-xs">
                  <th className="p-3">Data/Hora</th>
                  <th className="p-3">Nível</th>
                  <th className="p-3">Módulo</th>
                  <th className="p-3">Usuário</th>
                  <th className="p-3">IP</th>
                  <th className="p-3">Ação</th>
                  <th className="p-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="p-3 text-gray-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          log.level === 'INFO'
                            ? 'bg-blue-500/20 text-blue-400'
                            : log.level === 'SECURITY'
                            ? 'bg-purple-500/20 text-purple-400'
                            : log.level === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {log.level}
                      </span>
                    </td>
                    <td className="p-3 text-gray-300">{log.module}</td>
                    <td className="p-3 text-white">{log.user}</td>
                    <td className="p-3 text-gray-400">{log.ip}</td>
                    <td className="p-3 text-emerald-400 font-bold">{log.action}</td>
                    <td className="p-3 text-gray-300 font-sans">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 11: PERSONALIZAÇÃO */}
      {activeTab === 'customization' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Palette size={18} className="text-gray-300" />
              <span>Personalização de Marca & Interface (White-Label)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Configurações visuais de tela de login, mensagem inicial e rodapé.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Título da Tela de Login</label>
              <input
                type="text"
                value={customizationSettings.loginTitle}
                onChange={(e) => setCustomizationSettings({ ...customizationSettings, loginTitle: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Tema de Cor Principal</label>
              <select
                value={customizationSettings.themeStyle}
                onChange={(e) => setCustomizationSettings({ ...customizationSettings, themeStyle: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="DARK_PURPLE_PREMIUM">Roxo Dark Premium (Padrão)</option>
                <option value="DARK_NEON_BLUE">Azul Neon Dark</option>
                <option value="DARK_EMERALD_STREAM">Esmeralda Stream Dark</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-gray-300 font-semibold block">Mensagem Inicial de Boas-Vindas</label>
              <textarea
                rows={2}
                value={customizationSettings.initialMessage}
                onChange={(e) => setCustomizationSettings({ ...customizationSettings, initialMessage: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg p-3 text-white"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-gray-300 font-semibold block">Texto do Rodapé</label>
              <input
                type="text"
                value={customizationSettings.footerText}
                onChange={(e) => setCustomizationSettings({ ...customizationSettings, footerText: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => showToast('Tema e marcas de personalização atualizados!')}
              className="px-6 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Save size={16} />
              <span>Salvar Personalização</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 12: APLICATIVO */}
      {activeTab === 'app_config' && isSuperAdmin && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Smartphone size={18} className="text-gray-300" />
              <span>Configurações do Aplicativo Smart TV & Mobile</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">URLs dos arquivos APK, atualização obrigatória e mensagens aos dispositivos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Versão Mínima Obrigatória</label>
              <input
                type="text"
                value={appConfigSettings.minRequiredVersion}
                onChange={(e) => setAppConfigSettings({ ...appConfigSettings, minRequiredVersion: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Versão Atual Publicada</label>
              <input
                type="text"
                value={appConfigSettings.currentAppVersion}
                onChange={(e) => setAppConfigSettings({ ...appConfigSettings, currentAppVersion: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-gray-300 font-semibold block">Mensagem de Atualização Exibida na TV</label>
              <input
                type="text"
                value={appConfigSettings.updateMessage}
                onChange={(e) => setAppConfigSettings({ ...appConfigSettings, updateMessage: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-gray-300 font-semibold block">URL do APK Android TV</label>
              <input
                type="text"
                value={appConfigSettings.androidTvUrl}
                onChange={(e) => setAppConfigSettings({ ...appConfigSettings, androidTvUrl: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-gray-300 font-semibold block">URL do APK Fire TV</label>
              <input
                type="text"
                value={appConfigSettings.fireTvUrl}
                onChange={(e) => setAppConfigSettings({ ...appConfigSettings, fireTvUrl: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appConfigSettings.forceUpdate}
                  onChange={(e) => setAppConfigSettings({ ...appConfigSettings, forceUpdate: e.target.checked })}
                  className="rounded border-white/10 bg-[#000000] text-gray-400"
                />
                <span className="font-bold text-amber-400">Forçar Atualização Obrigatória (Bloqueia versões antigas)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => showToast('Configuração do App Smart TV atualizada!')}
              className="px-6 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Save size={16} />
              <span>Salvar Parâmetros do App</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 13: MANUTENÇÃO */}
      {activeTab === 'maintenance' && isSuperAdmin && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <span>Modo Manutenção Programada</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Bloquear acessos temporariamente enquanto o Super Admin realiza atualizações.</p>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-white text-sm block">Status do Modo Manutenção</span>
                <span className="text-gray-400 text-xs">Quando ativo, apenas a conta Super Admin terá permissão de login.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceSettings.maintenanceMode}
                  onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Mensagem Exibida aos Usuários</label>
              <textarea
                rows={3}
                value={maintenanceSettings.customMessage}
                onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, customMessage: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg p-3 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Horário Previsto de Retorno</label>
              <input
                type="text"
                value={maintenanceSettings.estimatedReturnTime}
                onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, estimatedReturnTime: e.target.value })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => showToast('Status do Modo Manutenção salvo!')}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Save size={16} />
              <span>Salvar Estado de Manutenção</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 14: API DOCS & ENDPOINTS TESTER */}
      {activeTab === 'api_docs' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6 font-sans">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileCode size={18} className="text-gray-300" />
              <span>Endpoints REST API — Módulo 20 Configurações Gerais</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Especificação técnica dos endpoints de busca, salvamento, testes e uploads.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-[#000000] p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-emerald-400 font-bold">GET /api/v1/settings</span>
              <p className="text-gray-400 font-sans text-xs">Retorna as configurações globais armazenadas no banco de dados (com cache em memória).</p>
            </div>

            <div className="bg-[#000000] p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-blue-400 font-bold">POST /api/v1/settings/save</span>
              <p className="text-gray-400 font-sans text-xs">Salva ou atualiza os parâmetros gerais (Requer autenticação de Super Admin ou Provedor).</p>
            </div>

            <div className="bg-[#000000] p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-purple-400 font-bold">POST /api/v1/settings/test-lynx</span>
              <p className="text-gray-400 font-sans text-xs">Testa a chave API e Secret do Gateway Lynx PIX retornando o status da conexão.</p>
            </div>

            <div className="bg-[#000000] p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-purple-400 font-bold">POST /api/v1/settings/test-smtp</span>
              <p className="text-gray-400 font-sans text-xs">Valida a conexão do servidor de e-mail SMTP e envia um e-mail de teste de verificação.</p>
            </div>

            <div className="bg-[#000000] p-3 rounded-lg border border-white/5 space-y-1">
              <span className="text-amber-400 font-bold">POST /api/v1/settings/backup/run</span>
              <p className="text-gray-400 font-sans text-xs">Executa o dump automático do PostgreSQL gerando o arquivo compactado no diretório retido.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
