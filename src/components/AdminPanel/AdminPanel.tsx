import { BuyCreditsTab } from './BuyCreditsTab';
import { parseServerInput, testXtreamConnection } from '../../utils/xtreamParser';
import { supabase } from '../../lib/supabase';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import React, { useState, useEffect } from 'react';
import { useAdminHandlers } from './AdminHandlers';
import { getEndUserDTO } from '../../services/admin/endUserService';
import { DashboardModule } from '../Dashboard/DashboardModule';
import { CommercialSettingsModule } from '../CommercialSettings/CommercialSettingsModule';
import { PlatformSettingsModule } from '../Settings/PlatformSettingsModule';
import { SecurityAuditModule } from '../SecurityAudit/SecurityAuditModule';
import { SupabaseDatabaseModule } from '../Database/SupabaseDatabaseModule';
import { DeployEnvironmentModule } from '../Deploy/DeployEnvironmentModule';
import { HomologationModule } from '../Homologation/HomologationModule';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Database,
  DollarSign,
  Edit2,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode2,
  FileText,
  Filter,
  GitFork,
  Globe,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  MinusCircle,
  Network,
  Palette,
  Pencil,
  Plus,
  PlusCircle,
  QrCode,
  Receipt,
  RefreshCw,
  Save,
  Search,
  Send,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Smartphone,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  UserX,
  Users,
  Wallet,
  Wifi,
  X,
  XCircle,
  Zap
} from 'lucide-react';

// Types for Admin Panel & Hierarchy (Module 12)
export type AdminRole = 'SUPER_ADMIN' | 'PROVEDOR' | 'REVENDA' | 'SUBREVENDA' | 'USUARIO_FINAL';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  providerId?: string;
  resellerId?: string;
  subResellerId?: string;
  accountId: string; // References hierarchy account ID
}

// Module 14 Lynx Gateway PIX & Credit Orders Types
export type OrderPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface CreditOrder {
  id: string;
  orderUuid: string; // Auto-generated UUID v4
  providerId: string; // References Provedor HierarchyAccount.id
  providerName: string;
  credits?: number;
  amount: number; // Em Reais (R$)
  paymentMethod: 'PIX';
  paymentStatus: OrderPaymentStatus;
  gatewayTransactionId: string;
  metadata?: any;
  pixQrCodeUrl?: string;
  pixCopiaECola?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LynxGatewayConfig {
  apiKey: string;
  secret: string;
  webhookUrl: string;
  environment: 'sandbox' | 'production';
  pricePerCredit: number; // R$ por crédito
}

export interface ProviderItem {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'blocked';
  createdAt: string;
  plan: string;
  expiration: string;
}

export type AccountStatus = 'ATIVA' | 'BLOQUEADA' | 'SUSPENDED' | 'Ativo' | 'Bloqueado' | 'Suspenso';

export interface HierarchyAccount {
  updatedAt?: string;
  ownerType?: string;
  id: string;
  name: string;
  email: string;
  parentId?: string;
  parentName?: string;
  role: AdminRole;
  status: AccountStatus;
  createdAt: string;
}

export interface CreditBalance {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerType?: string;
  balance: number;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TransactionType = 'DEPOSIT' | 'TRANSFER' | 'USAGE' | 'REFUND' | 'TODOS' | 'PURCHASE' | 'ADMIN_ADJUSTMENT' | 'LICENSE_ACTIVATION' | 'LICENSE_RENEWAL';

export interface CreditTransaction {
  amount?: number;
  id: string;
  transactionUuid: string;
  transactionType: TransactionType;
  fromOwnerId?: string;
  fromOwnerName: string;
  toOwnerId: string;
  toOwnerName: string;
  credits?: number;
  description: string;
  createdAt: string;
}

export interface ServerCodeItem {
  id: string;
  code: string;
  name: string;
  providerId: string;
  status: 'active' | 'blocked';
  createdAt: string;
}

export type LicenseStatus = 'TRIAL' | 'ATIVA' | 'SUSPENSA' | 'EXPIRADA' | 'BLOQUEADA' | 'CANCELADA';

export interface LicenseDevice {
  deviceId: string;
  platform: string;
  model: string;
  firstAccessAt: string;
  lastAccessAt: string;
}

export interface LicenseItem {
  id: string;
  code: string;
  name: string; // Nome
  username: string; // Usuário (login)
  email: string;
  password?: string;
  origin: 'SELF_SERVICE' | 'SUPER_ADMIN' | 'PROVIDER' | 'RESELLER' | 'SUB_RESELLER';
  ownerId: string;
  ownerType: string;
  status: LicenseStatus;
  createdAt: string;
  expiresAt: string;
  devicesAllowed: number;
  maxServers: number;
  deviceId: string | null; // Legacy single device support
  registeredDevices?: LicenseDevice[];
  updatedAt: string;
  
  // Legacy fields for backward compatibility
  authorizedDns?: string[];
  userId?: string;
  userName?: string;
  providerId?: string;
  providerName?: string;
  resellerId?: string;
  resellerName?: string;
  planId?: string;
  planName?: string;
  days?: number;
  creditCost?: number;
}

export interface LicensePlan {
  id: string;
  nome: string;
  dias: number;
  
  /** 
   * Créditos Consumidos:
   * Utilizado exclusivamente pelas Revendas e Sub-Revendas.
   * Evitar futuras confusões durante a manutenção.
   */
  creditCost: number;
  
  /**
   * Preço de Venda:
   * Utilizado exclusivamente pelo Portal SELF_SERVICE.
   */
  sellPrice: number;
  
  maxDevices: number;
  maxDns: number;
  status: 'ATIVO' | 'INATIVO';
  createdAt: string;
  updatedAt: string;
}

export interface ProviderPlan {
  updatedAt?: string;
  createdAt?: string;
  id: string;
  name: string;
  maxActiveUsers: number;
  monthlyPrice: number;
  setupFee: number;
  status: 'ATIVA' | 'INACTIVE' | 'ATIVO' | 'INATIVO';
}

export interface ProviderSubscription {
  id: string;
  providerId: string;
  providerName: string;
  planId: string;
  planName: string;
  status: 'ATIVA' | 'INACTIVE' | 'PAST_DUE';
  startDate: string;
  nextBillingDate: string;
}

export interface AccountDns {
  id: string;
  domain: string;
  ownerId: string;
  ownerName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ATIVO' | 'INATIVO';
  createdAt: string;
  updatedAt: string;
  ownerType?: string;
  provider_code?: number;
  notes?: string;
  server_url?: string;
  server_name?: string;
  dnsUrl?: string;
}

export type EndUserStatus = 'ATIVA' | 'BLOQUEADA' | 'EXPIRADA' | 'Ativo' | 'Bloqueado' | 'Suspenso';

export interface EndUserItem {
  id: string;
  name: string;
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  providerId: string;
  providerName: string;
  resellerId?: string;
  resellerName?: string;
  status: string;
  createdAt: string;
  maxDevices?: number;
  originId?: string;
  originType?: string;
  connections?: number;
  authorizedDns?: string[];
  notes?: string;
  licenseCode?: string;
  lastAccess?: string;
  isDeleted?: boolean;
  directPurchaseAllowed?: boolean;
  deviceLockEnabled?: boolean;
  maxDevicesAllowed?: number;
}

export interface ProviderThemeConfig {
  primaryColor: string;
  logoUrl: string;
  backgroundImageUrl: string;
  welcomeMessage: string;
}

const INITIAL_HIERARCHY_ACCOUNTS: HierarchyAccount[] = [];
const INITIAL_CREDIT_BALANCES: CreditBalance[] = [];
const INITIAL_CREDIT_TRANSACTIONS: CreditTransaction[] = [];
const INITIAL_CREDIT_ORDERS: CreditOrder[] = [];
const INITIAL_LYNX_CONFIG: LynxGatewayConfig = {
  apiKey: 'lynx_live_a1b2c3d4e5f6g7h8i9j0',
  secret: 'lynx_sec_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
  webhookUrl: 'https://ais-dev/api/v1/lynx/webhook',
  environment: 'sandbox',
  pricePerCredit: 2.50,
};

const INITIAL_PROVIDERS: ProviderItem[] = [];

const INITIAL_SERVER_CODES: ServerCodeItem[] = [];

const INITIAL_THEMES: Record<string, ProviderThemeConfig> = {};

const INITIAL_LICENSE_PLANS: LicensePlan[] = [];

function parsePtBrDate(dateStr: string): Date {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

function formatPtBrDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function getDaysRemaining(expiryStr: string): number {
  const expiry = parsePtBrDate(expiryStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateNewExpirationDate(currentExpiryStr: string, daysToAdd: number, currentStatus: LicenseStatus): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentExpiry = parsePtBrDate(currentExpiryStr);

  let baseDate: Date;
  if ((currentStatus === 'ATIVA' || currentStatus === 'TRIAL') && currentExpiry.getTime() > today.getTime()) {
    baseDate = currentExpiry;
  } else {
    baseDate = today;
  }

  const newDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return formatPtBrDate(newDate);
}

const INITIAL_LICENSES: LicenseItem[] = [];

const INITIAL_PROVIDER_PLANS: ProviderPlan[] = [];

const INITIAL_PROVIDER_SUBSCRIPTIONS: ProviderSubscription[] = [];

const INITIAL_ACCOUNT_DNS: AccountDns[] = [];

const INITIAL_END_USERS: EndUserItem[] = [];

function generateLicenseCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to recursively collect all descendant account IDs for scope filtering (parent_id)
function getAllDescendantIds(accounts: HierarchyAccount[], startId: string): Set<string> {
  const result = new Set<string>();
  result.add(startId);

  const queue = [startId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = accounts.filter((a) => a.parentId === currentId);
    for (const child of children) {
      if (!result.has(child.id)) {
        result.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return result;
}

export const AdminPanel: React.FC = () => {
  // Auth state with Module 12 5-Level Roles
  const [currentUser,  setCurrentUser] = useState<AdminUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Core State
  const {
    accounts, setAccounts,
    balances, setBalances,
    transactions, setTransactions,
    licenses, setLicenses,
    plans, setPlans,
    providerPlans, setProviderPlans,
    providerSubscriptions, setProviderSubscriptions,
    accountDnsList, setAccountDnsList,
    endUsers, setEndUsers,
    orders, setOrders,
    systemSettings, setSystemSettings,
    loading: dataLoading,
    reload
  } = useSupabaseData(currentUser);

  const handlers = useAdminHandlers(currentUser, reload, accounts, transactions, endUsers);
  const { toastMessage, setToastMessage, visibleEndUsers, handleDeleteEndUser, handleSimulateDeviceLogin, handleCreatePixOrder, setBuyCreditsAmount, buyCreditsAmount, lynxConfig, setLynxConfig, activePixOrder, setActivePixOrder, handleSimulateLynxWebhook, orderSearch, setOrderSearch, orderStatusFilter, setOrderStatusFilter, hierarchyRoleFilter, setHierarchyRoleFilter, handleLogout, creditSearch, setCreditSearch, creditTypeFilter, setCreditTypeFilter, showCreateAccountModal, setShowCreateAccountModal, editingAccountId, setEditingAccountId, newAccName, setNewAccName, newAccEmail, setNewAccEmail, newAccOwnerType, setNewAccOwnerType,  newAccParentId, setNewAccParentId, newAccPassword, setNewAccPassword, newAccStatus, setNewAccStatus, newAccPlanId, setNewAccPlanId, showCreditModal, setShowCreditModal, creditModalMode, setCreditModalMode, creditTargetAccId, setCreditTargetAccId, creditAmount, setCreditAmount, creditDescription, setCreditDescription, showToast, currentUserBalanceRecord, visibleTransactions, visibleAccounts, downstreamTargetAccounts, handleToggleAccountStatus, handleDeleteAccount, handleToggleLicenseStatus, handleDeleteLicense, handleRemoveDevice, handleCreateAccount, handleExecuteCreditOperation, handleActivateLicense, handleRenewLicense, handleSavePlan, handleSaveEndUser, handleToggleEndUserStatus, handleResetEndUserPassword, resetDnsForm, handleSaveDns, handleM3UUpload, handleFullUrlChange, handleTestConnection, handleSaveProviderPlan, newEndUserCredentials, setNewEndUserCredentials } = handlers;

  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Session error:", error);
        setIsAuthLoading(false);
        return;
      }
      if (session) {
        // Fetch user role
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data, error }) => {
          if (error) {
            console.error("Profile error:", error);
            setIsAuthLoading(false);
          } else if (data) {
            const roleMap: any = { 'PROVIDER': 'PROVEDOR', 'RESELLER': 'REVENDA', 'SUB_RESELLER': 'SUBREVENDA', 'END_USER': 'USUARIO_FINAL' };
            setCurrentUser({
              id: data.id,
              name: data.full_name || data.email,
              email: data.email,
              role: roleMap[data.role] || data.role,
              accountId: data.id
            });
            setIsAuthLoading(false);
          } else {
            setIsAuthLoading(false);
          }
        });
      } else {
        setIsAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            const roleMap: any = { 'PROVIDER': 'PROVEDOR', 'RESELLER': 'REVENDA', 'SUB_RESELLER': 'SUBREVENDA', 'END_USER': 'USUARIO_FINAL' };
            setCurrentUser({
              id: data.id,
              name: data.full_name || data.email,
              email: data.email,
              role: roleMap[data.role] || data.role,
              accountId: data.id
            });
          }
        });
      } else {
        setCurrentUser(null);
        setIsAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Active Tab: Includes Module 17 business mode tabs
  type MainMenu = 'dashboard' | 'providers' | 'resellers' | 'users' | 'finance' | 'settings' | 'dns' | 'plans' | 'licenses' | 'my-license' | 'renew' | 'my-device' | 'my-dns' | 'profile' | 'commercial-policy' | 'reports';
  const [activeMenu, setActiveMenu] = useState<MainMenu>('dashboard');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [dualLoginInputType, setDualLoginInputType] = useState('CODE');
  const [lic, setLic] = useState<any>(null);


  const [activeTab, setActiveTab] = useState<
    | 'end-users'
    | 'provider-plans'
    | 'dns-management'
    | 'dual-login-tester'
    | 'buy-credits'
    | 'orders'
    | 'lynx-config'
    | 'credits'
    | 'hierarchy'
    | 'licenses'
    | 'dashboard'
    | 'providers'
    | 'codes'
    | 'settings'
    | 'security-audit'
    | 'database'
    | 'deploy'
    | 'homologation'
  >('end-users');

  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [serverCodes, setServerCodes] = useState<ServerCodeItem[]>([]);

  // Dual Login API Tester State (MÓDULO 17)
  const [dualLoginInputCode, setDualLoginInputCode] = useState<string>('100');
  const [dualLoginUsername, setDualLoginUsername] = useState<string>('');
  const [dualLoginPassword, setDualLoginPassword] = useState<string>('');
  const [dualLoginDeviceId, setDualLoginDeviceId] = useState<string>('SIMULATED_DEVICE_123');
  const [dualLoginResult, setDualLoginResult] = useState<any>(null);

  // Servidor (DNS) Modal & Form State
  const [showNewDnsModal, setShowNewDnsModal] = useState<boolean>(false);
  const [dnsRegMethod, setDnsRegMethod] = useState<'XTREAM' | 'URL' | 'M3U'>('XTREAM');
  const [dnsFormName, setDnsFormName] = useState<string>('');
  const [dnsFormUrl, setDnsFormUrl] = useState<string>('');
  const [dnsFormUser, setDnsFormUser] = useState<string>('');
  const [dnsFormPass, setDnsFormPass] = useState<string>('');
  const [dnsFormFullUrl, setDnsFormFullUrl] = useState<string>('');
  const [dnsFormNotes, setDnsFormNotes] = useState<string>('');
  const [dnsFormOwnerId, setDnsFormOwnerId] = useState<string>('acc-prov-100');
  const [dnsTestStatus, setDnsTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED'>('IDLE');

  const handleFullUrlChangeLocal = (val: string) => {
    setDnsFormFullUrl(val);
    if (val) {
      const parsed = parseServerInput(val, dnsFormUser, dnsFormPass);
      if (parsed) {
        if (parsed.baseUrl) setDnsFormUrl(parsed.baseUrl);
        if (parsed.username) setDnsFormUser(parsed.username);
        if (parsed.password) setDnsFormPass(parsed.password);
      }
    }
  };

  const handleTestConnectionLocal = async () => {
    setDnsTestStatus('TESTING');
    let targetUrl = dnsFormUrl;
    let targetUser = dnsFormUser;
    let targetPass = dnsFormPass;

    if (dnsFormFullUrl) {
      const parsed = parseServerInput(dnsFormFullUrl, dnsFormUser, dnsFormPass);
      if (parsed) {
        targetUrl = parsed.baseUrl;
        targetUser = parsed.username;
        targetPass = parsed.password;
        setDnsFormUrl(parsed.baseUrl);
        setDnsFormUser(parsed.username);
        setDnsFormPass(parsed.password);
      }
    }

    const res = await testXtreamConnection(targetUrl, targetUser, targetPass);
    if (res.success) {
      setDnsTestStatus('SUCCESS');
      showToast(`✓ ${res.message}`);
    } else {
      setDnsTestStatus('FAILED');
      showToast(`❌ ${res.message}`);
    }
  };


  // MÓDULO CN-04 State
  const [commercialPolicy, setCommercialPolicy] = useState({
    trialDays: 7,
    maxDevicesPerLicense: 2,
    maxDnsPerLicense: 3,
    maxDnsPerProvider: 10,
    creditValue: 1.50,
    costPerDns: 1,
    costPerExtraDevice: 1,
  });
  // Provider Plan Form State
  const [showNewPlanModal, setShowNewPlanModal] = useState<boolean>(false);
  const [planFormMaxUsers, setPlanFormMaxUsers] = useState<number>(500);
  const [planFormPrice, setPlanFormPrice] = useState<number>(299);
  const [planFormSetup, setPlanFormSetup] = useState<number>(500);

  // Module 16 End-Users State & Filters

  const [endUserFilter, setEndUserFilter] = useState<
    'TODOS' | 'ATIVO' | 'BLOQUEADO' | 'SUSPENSO' | 'EXPIRADA' | '7_DIAS' | '30_DIAS' | 'SEM_LICENCA'
  >('TODOS');
  const [endUserSearch, setEndUserSearch] = useState<string>('');

  // Modals & Form State for Module 16 End-Users
  const [showEndUserModal, setShowEndUserModal] = useState<boolean>(false);
  const [editingEndUser,  setEditingEndUser] = useState<EndUserItem | null>(null);
  const [endUserFormName, setEndUserFormName] = useState<string>('');
  const [endUserFormUsername, setEndUserFormUsername] = useState<string>('');
  const [endUserFormPassword, setEndUserFormPassword] = useState<string>('');
  const [endUserFormPhone, setEndUserFormPhone] = useState<string>('');
  const [endUserFormEmail, setEndUserFormEmail] = useState<string>('');
  const [endUserFormNotes, setEndUserFormNotes] = useState<string>('');
  const [endUserFormDnsList, setEndUserFormDnsList] = useState<string[]>([]);
  const [endUserFormMaxDevices, setEndUserFormMaxDevices] = useState<number>(1);
  const [endUserFormMaxServers, setEndUserFormMaxServers] = useState<number>(1);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [editingDns, setEditingDns] = useState<any>(null);
  const [dnsFormCode, setDnsFormCode] = useState('');
  const [endUserFormResellerId, setEndUserFormResellerId] = useState<string>('');
  const [endUserFormStatus, setEndUserFormStatus] = useState<EndUserStatus>('Ativo');
  const [endUserFormPlanId, setEndUserFormPlanId] = useState<string>('');
  const [endUserFormPortalAccess, setEndUserFormPortalAccess] = useState<boolean>(false);
  const [endUserActivationType, setEndUserActivationType] = useState<'ACTIVE' | 'TRIAL'>('ACTIVE');
  const [hasLinkedLicense, setHasLinkedLicense] = useState<boolean>(true);

  const [selectedUserForDetails, setSelectedUserForDetails] = useState<EndUserItem | null>(null);
  const [showPasswordInDetails, setShowPasswordInDetails] = useState<boolean>(false);

  const [selectedUserForResetPassword, setSelectedUserForResetPassword] = useState<EndUserItem | null>(null);
  const [resetGeneratedPassword, setResetGeneratedPassword] = useState<string>('');

  useEffect(() => {
    if (plans && plans.length > 0 && !endUserFormPlanId) {
      const active = plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null);
      if (active.length > 0) {
        setEndUserFormPlanId(active[0].id);
      }
    }
  }, [plans, endUserFormPlanId]);

  // Module 15 License & Plan Filters
  const [licenseFilter, setLicenseFilter] = useState<'TODOS' | 'TRIAL' | 'ATIVA' | 'EXPIRADA' | 'BLOQUEADA' | 'CANCELLED' | '7_DIAS' | '30_DIAS'>('TODOS');
  const [licenseSearch, setLicenseSearch] = useState<string>('');

  // Modals for Module 15
  const [showActivateLicenseModal, setShowActivateLicenseModal] = useState<boolean>(false);
  const [activateUserName, setActivateUserName] = useState<string>('');
  const [activatePlanId, setActivatePlanId] = useState<string>('plan-30d');
  const [activateServerCode, setActivateServerCode] = useState<string>('100');

  const [showRenewLicenseModal, setShowRenewLicenseModal] = useState<boolean>(false);
  const [selectedLicenseForRenewal, setSelectedLicenseForRenewal] = useState<LicenseItem | null>(null);
  const [renewPlanId, setRenewPlanId] = useState<string>('plan-30d');
  
  const [showDeviceModal, setShowDeviceModal] = useState<boolean>(false);
  const [selectedLicenseForDevices, setSelectedLicenseForDevices] = useState<LicenseItem | null>(null);

  const [showPlansModal, setShowPlansModal] = useState<boolean>(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planFormName, setPlanFormName] = useState<string>('');
  const [planFormDays, setPlanFormDays] = useState<number>(30);
  const [planFormCreditCost, setPlanFormCreditCost] = useState<number>(1);
  const [planFormSellPrice, setPlanFormSellPrice] = useState<number>(0);
  const [planFormMaxDevices, setPlanFormMaxDevices] = useState<number>(1);
  const [planFormMaxDns, setPlanFormMaxDns] = useState<number>(1);
  const [planFormStatus, setPlanFormStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');

  const handleProviderSubscribe = async (pp: any) => {
    showToast("Pagamento temporariamente indisponível. Integração com o Gateway em configuração.");
  }

  if (isAuthLoading) {
    return (
      <div className="w-full min-h-[600px] flex items-center justify-center bg-[#000000]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6A00FF]"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="w-full min-h-[600px] flex items-center justify-center p-6 bg-[#000000]">
        <div className="bg-[#111111] border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#6A00FF]/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto">
              <Coins size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">StreamFlix SaaS</h2>
            <p className="text-xs text-gray-400">Painel de Gestão Administrativa & Multi-Tenancy</p>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
              if (authError) {
                alert(`Erro Auth: ${authError.message}`);
                return;
              }
              
              if (authData.user) {
                const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
                if (profileError) {
                  alert(`Erro Profile: Profile não encontrado ou erro de leitura. Detalhe: ${profileError.message}`);
                  return;
                }
                if (!profile) {
                  alert(`Erro Profile: Profile ausente para UUID ${authData.user.id}`);
                  return;
                }
                if (profile.status !== 'ACTIVE') {
                  alert(`Erro Profile: Usuário não está ativo. Status atual: ${profile.status}`);
                  return;
                }
                if (profile.deleted_at !== null) {
                  alert(`Erro Profile: Usuário foi deletado.`);
                  return;
                }
                // (Role could be SUPER_ADMIN, PROVEDOR, REVENDA, etc.)
                // Login OK. The onAuthStateChange listener will handle setting the currentUser state.
                showToast("Login efetuado com sucesso!");
              }
            } catch (err: any) {
              alert(err.message || 'Erro ao realizar login.');
            }
          }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">E-mail</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Senha</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500" required />
            </div>
            <button type="submit" className="w-full py-3 bg-[#6A00FF] hover:bg-[#801aff] text-white font-bold rounded-lg text-xs shadow-lg transition-all cursor-pointer">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }
  return (
    
    <div className="flex flex-col h-[calc(100vh-80px)] w-full text-white bg-[#000000] font-sans">
      {/* TOPBAR */}
      <header className="h-14 bg-[#000000] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-white">
            <Coins size={18} className="text-gray-300" />
            <h1 className="text-sm font-semibold tracking-tight">StreamFlix SaaS</h1>
            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-lg border ${
              currentUser.role === 'SUPER_ADMIN' ? 'bg-white/5 text-gray-300 border-white/10'
              : currentUser.role === 'PROVEDOR' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : currentUser.role === 'REVENDA' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {currentUser.role}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="bg-[#000000] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/10 w-48 transition-all"
            />
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-3">
            
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#222222] flex items-center justify-center font-medium text-gray-300 text-xs">
                    {currentUser.name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-gray-300 hidden sm:block">{currentUser.name}</span>
            </div>
            <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                title="Sair"
            >
                <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR - MENU LATERAL */}
        <aside className="w-56 bg-[#000000] border-r border-white/10 flex flex-col shrink-0 overflow-y-auto">

      {/* SIDEBAR - MENU LATERAL */}
      

        <nav className="flex-1 p-3 space-y-1">
          {(() => {
                        const roleMenus = {
              SUPER_ADMIN: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'providers', label: 'Provedores', icon: Building2 },
                { id: 'resellers', label: 'Revendas', icon: Network },
                { id: 'users', label: 'Usuários Finais', icon: Users },
                { id: 'commercial-policy', label: 'Config. Comerciais', icon: ShieldCheck },
                { id: 'reports', label: 'Relatórios', icon: FileText },
                { id: 'settings', label: 'Configurações', icon: Sliders },
              ],
              PROVEDOR: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'users', label: 'Usuários Finais', icon: Users },
                { id: 'dns-management', label: 'Servidores (DNS)', icon: Globe },
                { id: 'plans', label: 'Plano', icon: FileText },
                { id: 'profile', label: 'Minha Conta', icon: User },
              ],
              REVENDA: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'users', label: 'Usuários Finais', icon: Users },
                { id: 'resellers', label: 'Sub-Revendas', icon: Network },
                { id: 'dns-management', label: 'Servidores (DNS)', icon: Globe },
                { id: 'finance', label: 'Comprar Créditos', icon: Coins },
                { id: 'profile', label: 'Minha Conta', icon: User },
              ],
              SUBREVENDA: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'users', label: 'Usuários Finais', icon: Users },
                { id: 'dns-management', label: 'Servidores (DNS)', icon: Globe },
                { id: 'profile', label: 'Minha Conta', icon: User },
              ],
              USUARIO_FINAL: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'my-license', label: 'Minha Licença', icon: KeyRound },
                { id: 'my-dns', label: 'Servidores (DNS)', icon: Globe },
                { id: 'renew', label: 'Renovar Licença', icon: ShoppingBag },
                { id: 'profile', label: 'Minha Conta', icon: User },
              ],
            };
            const currentMenus = roleMenus[currentUser.role] || roleMenus['SUPER_ADMIN'];
            return currentMenus.map(menu => (
              <button
                key={menu.id}
                onClick={() => {
                  setActiveMenu(menu.id as MainMenu);
                  switch (menu.id) {
                    case 'dashboard': 
                      setActiveTab('dashboard'); 
                      break;
                    case 'providers': 
                      setActiveTab('hierarchy'); 
                      setHierarchyRoleFilter('PROVEDOR');
                      break;
                    case 'resellers': 
                      setActiveTab('hierarchy'); 
                      setHierarchyRoleFilter(currentUser.role === 'SUPER_ADMIN' ? 'REVENDA' : 'TODOS');
                      break;
                    case 'users': setActiveTab('end-users'); break;
                    case 'finance': setActiveTab('credits'); break;
                    case 'commercial-policy': setActiveTab('commercial-policy'); break;
                    case 'reports': setActiveTab('dashboard'); break; // Fallback
                    case 'settings': setActiveTab('settings'); break;
                    case 'dns': setActiveTab('dns-management'); break;
                    case 'dns-management': setActiveTab('dns-management'); break;
                    case 'plans': setActiveTab('provider-plans'); break;
                    case 'licenses': setActiveTab('licenses'); break;
                    case 'my-license': setActiveTab('licenses'); break;
                    case 'renew': setActiveTab('buy-credits'); break;
                    case 'my-device': setActiveTab('dual-login-tester'); break;
                    case 'my-dns': setActiveTab('dns-management'); break;
                    case 'profile': setActiveTab('settings'); break;
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMenu === menu.id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <menu.icon size={16} />
                <span>{menu.label}</span>
              </button>
            ));
          })()}
        </nav>
        
        {/* User Info & Role Switcher in Sidebar Bottom */}

      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#6A00FF] text-white px-4 py-3 rounded-lg shadow-sm border border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 size={18} />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}


          {(() => {
            const subtabsConfig = {
              dashboard: [],
              providers: [],
              resellers: [],
              users: [],
              finance: [
                { id: 'credits', label: 'Extrato', icon: Coins },
                { id: 'buy-credits', label: 'Comprar Créditos', icon: ShoppingBag, requiredRole: ['REVENDA', 'USUARIO_FINAL'] },
                { id: 'orders', label: 'Pedidos', icon: Receipt, requiredRole: ['SUPER_ADMIN', 'REVENDA'] },
                { id: 'provider-plans', label: 'Planos de Provedor', icon: Building2, requiredRole: ['SUPER_ADMIN'] },
              ],
              settings: [
                { id: 'commercial-policy', label: 'Política Comercial', icon: ShieldCheck },
                { id: 'settings', label: 'Configurações', icon: Sliders },
                { id: 'dns-management', label: 'Servidores (DNS)', icon: Globe },
                { id: 'dual-login-tester', label: 'Testador Login', icon: KeyRound },
                { id: 'lynx-config', label: 'Gateway Lynx', icon: Sliders },
                { id: 'security-audit', label: 'Segurança & Auditoria', icon: Shield },
                { id: 'database', label: 'DB & Migrations', icon: Database },
                { id: 'deploy', label: 'Deploy & Produção', icon: Server },
                { id: 'homologation', label: 'Homologação', icon: CheckCircle2 },
              ],
              dns: [
                { id: 'dns-management', label: 'Servidores (DNS)', icon: Globe }
              ],
              plans: [
                { id: 'provider-plans', label: 'Meus Planos', icon: FileText }
              ],
              licenses: [],
              'my-license': [],
              renew: [],
              'my-device': [],
              'my-dns': [],
              profile: [],
            };
            
            const currentSubtabs = subtabsConfig[activeMenu] || [];
            const visibleSubtabs = currentSubtabs.filter(t => !t.requiredRole || t.requiredRole.includes(currentUser.role));
            
            if (visibleSubtabs.length === 0) return null;
            
            return (
              <div className="flex items-center bg-[#000000] p-2 rounded-lg border border-white/10 shadow-sm overflow-x-auto gap-2 mb-6">
                {visibleSubtabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-[#000000] border border-white/10 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <tab.icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            );
          })()}

          {/* MÓDULOS RESTAURADOS */}
          {activeTab === 'dashboard' && (
            <DashboardModule
              currentUser={currentUser}
              accounts={Array.isArray(accounts) ? accounts : []}
              balances={Array.isArray(balances) ? balances : []}
              transactions={Array.isArray(transactions) ? transactions : []}
              providers={[]} 
              serverCodes={[]}
              licenses={Array.isArray(licenses) ? licenses : []}
              plans={Array.isArray(plans) ? plans : []}
              providerPlans={Array.isArray(providerPlans) ? providerPlans : []}
              providerSubscriptions={Array.isArray(providerSubscriptions) ? providerSubscriptions : []}
              accountDnsList={Array.isArray(accountDnsList) ? accountDnsList : []}
              endUsers={Array.isArray(endUsers) ? endUsers : []}
              creditOrders={[]}
              showToast={showToast}
            />
          )}

          {activeTab === 'commercial-policy' && (
            <CommercialSettingsModule
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <PlatformSettingsModule
              currentUser={currentUser}
              providerPlans={providerPlans}
              setProviderPlans={setProviderPlans}
              plans={plans}
              setPlans={setPlans}
              accountDnsList={accountDnsList}
              setAccountDnsList={setAccountDnsList}
              showToast={showToast}
            />
          )}

          {activeTab === 'security-audit' && (
            <SecurityAuditModule
              currentUser={currentUser}
              accounts={accounts}
              showToast={showToast}
            />
          )}

          {activeTab === 'database' && (
            <SupabaseDatabaseModule
              currentUser={currentUser}
              accounts={accounts}
              showToast={showToast}
            />
          )}

          {activeTab === 'deploy' && (
            <DeployEnvironmentModule
              currentUser={currentUser}
              accounts={accounts}
              showToast={showToast}
            />
          )}

          {activeTab === 'homologation' && (
            <HomologationModule
              currentUser={currentUser}
              accounts={accounts}
              showToast={showToast}
            />
          )}

          {activeTab === 'buy-credits' && currentUser && (
            <BuyCreditsTab
              currentUser={currentUser}
              setActiveTab={setActiveTab}
              currentBalance={currentUserBalanceRecord?.balance || 0}
            />
          )}
          
          {/* MÓDULO HIERARQUIA: PROVEDORES E REVENDAS */}
          {activeTab === 'hierarchy' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {hierarchyRoleFilter === 'PROVEDOR' ? 'Provedores' : 'Revendas'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {hierarchyRoleFilter === 'PROVEDOR' 
                      ? 'Gerenciamento de provedores de infraestrutura.'
                      : 'Gerenciamento da rede de revendas comerciais.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (hierarchyRoleFilter === 'PROVEDOR') {
                      setNewAccOwnerType('PROVEDOR');
                    } else if (currentUser.role === 'REVENDA') {
                      setNewAccOwnerType('SUBREVENDA');
                    } else {
                      setNewAccOwnerType('REVENDA');
                    }
                    setNewAccName('');
                    setNewAccEmail('');
                    
                    setNewAccParentId(currentUser.role === 'REVENDA' ? currentUser.accountId : '');
                    setShowCreateAccountModal(true);
                  }}
                  className="px-4 py-2 bg-white text-black hover:bg-gray-200 text-xs font-bold rounded-lg shadow-sm border border-white/10 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {hierarchyRoleFilter === 'PROVEDOR' ? <Building2 size={16} /> : <Network size={16} />}
                  <span>{hierarchyRoleFilter === 'PROVEDOR' ? 'Criar Provedor' : currentUser.role === 'REVENDA' ? 'Criar Sub-Revenda' : 'Criar Revenda'}</span>
                </button>
              </div>

              <div className="bg-[#000000] border border-white/10 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-3">Nome da Conta</th>
                        <th className="p-3">Email Responsável</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Código do Provedor</th>
                        <th className="p-3 text-right">Saldo de Créditos</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-gray-300">
                      {visibleAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">
                            Nenhum registro encontrado.
                          </td>
                        </tr>
                      ) : (
                        visibleAccounts.map((acc: any) => (
                          <tr key={acc.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3 font-medium text-white">{acc.full_name || acc.name || 'Sem nome'}</td>
                            <td className="p-3">{acc.email}</td>
                            <td className="p-3">
                              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold">
                                {acc?.role === 'PROVIDER' ? 'PROVEDOR' : acc?.role === 'RESELLER' ? 'REVENDA' : acc?.role === 'SUB_RESELLER' ? 'SUBREVENDA' : acc?.role}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-gray-400">{acc.provider_code || '-'}</td>
                            <td className="p-3 text-right font-bold text-emerald-400">{acc.creditBalance}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${acc.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {acc.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                               <button onClick={() => {
                                 setEditingAccountId(acc.id);
                                 setNewAccName(acc.full_name || acc.name || '');
                                 setNewAccEmail(acc.email || '');
                                 setNewAccStatus(acc.status || 'ACTIVE');
                                 setNewAccOwnerType(acc.role === 'PROVIDER' ? 'PROVEDOR' : acc.role === 'RESELLER' ? 'REVENDA' : acc.role === 'SUB_RESELLER' ? 'SUBREVENDA' : acc.role);
                                 setNewAccParentId(acc.parent_id || '');
                                 if (acc.role === 'PROVIDER' || acc.role === 'PROVEDOR') {
                                   const sub = providerSubscriptions.find((s: any) => s.provider_id === acc.id);
                                   setNewAccPlanId(sub?.plan_id || '');
                                 }
                                 setShowCreateAccountModal(true);
                               }} className="text-blue-400 hover:text-blue-300 p-1 cursor-pointer" title="Editar Conta"><Pencil size={14} /></button>
                               <button onClick={() => { setCreditTargetAccId(acc.id); setCreditModalMode('ADD'); setShowCreditModal(true); }} className="text-emerald-400 hover:text-emerald-300 p-1 cursor-pointer" title="Adicionar Créditos"><Coins size={14} /></button>
                               <button onClick={() => handleToggleAccountStatus(acc.id, acc.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')} className={`${acc.status === 'ACTIVE' ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'} p-1 cursor-pointer`} title={acc.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}><CheckCircle2 size={14} /></button>
                               <button onClick={() => handleDeleteAccount(acc.id)} className="text-red-400 hover:text-red-300 p-1 cursor-pointer" title="Excluir"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* FALLBACK PARA MENUS NÃO RECONHECIDOS/AUSENTES */}
          {!['dashboard', 'commercial-policy', 'settings', 'security-audit', 'database', 'deploy', 'homologation', 'buy-credits', 'end-users', 'provider-plans', 'dns-management', 'dual-login-tester', 'hierarchy'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-[#000000] border border-white/10 rounded-lg shadow-sm">
              <AlertCircle size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-semibold">Selecione uma opção no menu.</p>
              <p className="text-sm opacity-70">O módulo selecionado não possui conteúdo nesta versão.</p>
            </div>
          )}

          {/* MODULE 16: SUBTAB - GESTÃO DE USUÁRIOS FINAIS */}
      {activeTab === 'end-users' && (
        <div className="space-y-6">
          {/* Header & KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#000000] border border-white/10 rounded-lg p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Usuários</span>
                <Users size={16} className="text-gray-300" />
              </div>
              <div className="text-2xl font-semibold text-white">
                {endUsers.filter((u) => !u.isDeleted && (currentUser.role === 'SUPER_ADMIN' || getAllDescendantIds(accounts, currentUser.accountId).has(u.providerId) || (u.resellerId && getAllDescendantIds(accounts, currentUser.accountId).has(u.resellerId)))).length}
              </div>
              <p className="text-xs text-gray-500 font-mono">Cadastrados na Árvore</p>
            </div>

            <div className="bg-[#000000] border border-emerald-500/20 rounded-lg p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Ativos</span>
                <UserCheck size={16} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-semibold text-emerald-400">
                {endUsers.filter((u) => !u.isDeleted && u.status === 'Ativo' && (currentUser.role === 'SUPER_ADMIN' || getAllDescendantIds(accounts, currentUser.accountId).has(u.providerId) || (u.resellerId && getAllDescendantIds(accounts, currentUser.accountId).has(u.resellerId)))).length}
              </div>
              <p className="text-xs text-emerald-500/70 font-mono">Em operação normal</p>
            </div>

            <div className="bg-[#000000] border border-red-500/20 rounded-lg p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Bloqueados</span>
                <UserX size={16} className="text-red-400" />
              </div>
              <div className="text-2xl font-semibold text-red-400">
                {endUsers.filter((u) => !u.isDeleted && u.status === 'Bloqueado' && (currentUser.role === 'SUPER_ADMIN' || getAllDescendantIds(accounts, currentUser.accountId).has(u.providerId) || (u.resellerId && getAllDescendantIds(accounts, currentUser.accountId).has(u.resellerId)))).length}
              </div>
              <p className="text-xs text-red-500/70 font-mono">Acesso bloqueado</p>
            </div>

            <div className="bg-[#000000] border border-amber-500/20 rounded-lg p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Suspensos</span>
                <ShieldAlert size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-semibold text-amber-400">
                {endUsers.filter((u) => !u.isDeleted && u.status === 'Suspenso' && (currentUser.role === 'SUPER_ADMIN' || getAllDescendantIds(accounts, currentUser.accountId).has(u.providerId) || (u.resellerId && getAllDescendantIds(accounts, currentUser.accountId).has(u.resellerId)))).length}
              </div>
              <p className="text-xs text-amber-500/70 font-mono">Aguardando ativação</p>
            </div>

            <div className="bg-[#000000] border border-purple-500/20 rounded-lg p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Vencendo ≤ 7d</span>
                <Clock size={16} className="text-purple-400" />
              </div>
              <div className="text-2xl font-semibold text-purple-300">
                {endUsers.filter((u) => {
                  if (u.isDeleted) return false;
                  if (currentUser.role !== 'SUPER_ADMIN') {
                    const accs = getAllDescendantIds(accounts, currentUser.accountId);
                    if (!accs.has(u.providerId) && (!u.resellerId || !accs.has(u.resellerId))) return false;
                  }
                  const lic = licenses.find((l) => l.end_user_id === u.id);
                  if (!lic || lic.status !== 'ACTIVE') return false;
                  const days = getDaysRemaining(lic.expires_at);
                  return days >= 0 && days <= 7;
                }).length}
              </div>
              <p className="text-xs text-purple-400/70 font-mono">Atenção renovação</p>
            </div>

            <div className="bg-[#000000] border border-gray-700 rounded-lg p-4 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Sem Licença</span>
                <KeyRound size={16} className="text-gray-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-300">
                {endUsers.filter((u) => {
                  if (u.isDeleted) return false;
                  if (currentUser.role !== 'SUPER_ADMIN') {
                    const accs = getAllDescendantIds(accounts, currentUser.accountId);
                    if (!accs.has(u.providerId) && (!u.resellerId || !accs.has(u.resellerId))) return false;
                  }
                  return !licenses.some((l) => l.end_user_id === u.id);
                }).length}
              </div>
              <p className="text-xs text-gray-500 font-mono">Necessita ativação</p>
            </div>
          </div>

          {/* Search, Filters & Action Bar */}
          <div className="bg-[#000000] border border-white/10 rounded-lg p-4 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={endUserSearch}
                  onChange={(e) => setEndUserSearch(e.target.value)}
                  placeholder="Pesquisar por Nome, Usuário, Telefone ou UUID..."
                  className="w-full bg-[#000000] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => {
                    setEditingEndUser(null);
                    setEndUserFormName('');
                    setEndUserFormUsername('');
                    setEndUserFormPassword('');
                    setEndUserFormPhone('');
                    setEndUserFormEmail('');
                    setEndUserFormNotes('');
                    const activePlans = plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null);
                    setEndUserFormPlanId(activePlans[0]?.id || '');
                    setEndUserFormDnsList([]);
                    setEndUserFormStatus('Ativo');
                    setEndUserFormPortalAccess(false);
                    setEndUserActivationType('ACTIVE');
                    setHasLinkedLicense(true);
                    setShowEndUserModal(true);
                  }}
                  className="px-4 py-2 bg-white text-black hover:from-[#801aff] hover:to-[#b066ff] text-white text-xs font-bold rounded-lg shadow-sm border border-white/10 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <UserPlus size={16} />
                  <span>Cadastrar Usuário Final</span>
                </button>
              </div>
            </div>

            {/* Sub-Filters Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-white/5 text-xs font-bold">
              <span className="text-gray-400 text-xs mr-2 flex items-center gap-1 shrink-0">
                <Filter size={12} /> Filtros:
              </span>
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'ATIVO', label: 'Ativos' },
                { id: 'BLOQUEADO', label: 'Bloqueados' },
                { id: 'SUSPENSO', label: 'Suspensos' },
                { id: 'EXPIRADA', label: 'Licença Vencida' },
                { id: '7_DIAS', label: 'Vence em 7 dias' },
                { id: '30_DIAS', label: 'Vence em 30 dias' },
                { id: 'SEM_LICENCA', label: 'Sem Licença' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setEndUserFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs ${
                    endUserFilter === f.id
                      ? 'bg-[#6A00FF] text-white shadow-sm'
                      : 'bg-[#000000] text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* End Users Table */}
          <div className="bg-[#000000] border border-white/10 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users size={16} className="text-gray-300" />
                <span>Listagem de Usuários Finais (Isolamento de Árvore Ativo)</span>
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                Exibindo <strong>{visibleEndUsers.length}</strong> usuário(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#000000] text-gray-400 text-xs font-medium border-b border-white/10 text-gray-400 text-xs font-medium border-b border-white/10">
                  <tr>
                    <th className="p-3">Nome / Usuário</th>
                    <th className="p-3">Servidor</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Licença (UUID)</th>
                    <th className="p-3">Validade</th>
                    <th className="p-3">Revenda Responsável</th>
                    <th className="p-3">Último Acesso</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {visibleEndUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500 italic text-xs">
                        Nenhum usuário final encontrado com os filtros aplicados nesta subárvore.
                      </td>
                    </tr>
                  ) : (
                    visibleEndUsers.map((u) => {
                      const userLic = licenses.find((l) => l.end_user_id === u.id);
                      const daysRem = userLic ? getDaysRemaining(userLic.expires_at) : null;

                      return (
                        <tr key={u.id} className="hover:bg-white/[0.02] even:bg-white/[0.01] transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white text-sm">{u.full_name || u.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                @{u.username}
                              </span>
                              {u.phone && <span className="text-xs text-gray-400 font-mono">{u.phone}</span>}
                            </div>
                          </td>

                          <td className="p-3 font-mono text-xs">
                            <span className="bg-white/5 text-gray-200 px-2 py-1 rounded border border-white/10">{u.authorizedDns?.length || 0} DNS</span>
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                u.status === 'Ativo'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                  : u.status === 'Bloqueado'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>

                          <td className="p-3 font-mono text-xs">
                            {userLic?.code ? (
                              <div className="flex items-center gap-1 text-gray-300 font-bold">
                                <span className="truncate max-w-[120px]">{userLic.code}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(userLic.code);
                                    showToast('UUID da licença copiado!');
                                  }}
                                  className="text-gray-400 hover:text-white p-0.5"
                                  title="Copiar UUID"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic text-xs">Sem licença associada</span>
                            )}
                          </td>

                          <td className="p-3">
                            {userLic ? (
                              <div>
                                <span className="font-bold text-white block">{new Date(userLic.expires_at).toLocaleDateString()}</span>
                                <span
                                  className={`text-xs font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                                    userLic.status === 'EXPIRADA' || (daysRem !== null && daysRem <= 0)
                                      ? 'bg-red-500/20 text-red-400'
                                      : daysRem !== null && daysRem <= 7
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                  }`}
                                >
                                  {userLic.status === 'EXPIRADA' || (daysRem !== null && daysRem <= 0)
                                    ? 'EXPIRADA'
                                    : `${daysRem} dias restantes`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">—</span>
                            )}
                          </td>

                          <td className="p-3 text-xs">
                            <div className="font-bold text-gray-200">{u.resellerName || u.providerName}</div>
                            <div className="text-xs text-gray-400">{u.providerName}</div>
                          </td>

                          <td className="p-3 text-xs text-gray-400 font-mono">{u.lastAccess}</td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedUserForDetails(u)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Ver Detalhes do Usuário"
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                onClick={async () => {
                                  setEditingEndUser(u);
                                  // Quick preview fallback
                                  setEndUserFormName(u.full_name || u.name || '');
                                  setEndUserFormUsername(u.username || '');
                                  setEndUserFormPassword('');
                                  setEndUserFormPhone(u.phone || '');
                                  setEndUserFormEmail(u.email || '');
                                  setEndUserFormNotes(u.notes || '');
                                  setEndUserFormDnsList(u.authorizedDns || []);
                                  setEndUserFormStatus(u.status || 'Ativo');
                                  setEndUserFormPlanId('');
                                  setEndUserFormPortalAccess(u.portal_access ?? false);
                                  setEndUserActivationType('ACTIVE');
                                  setHasLinkedLicense(true);
                                  setShowEndUserModal(true);

                                  try {
                                    const dto = await getEndUserDTO(u.id);
                                    if (dto) {
                                      setEndUserFormName(dto.full_name || dto.name || '');
                                      setEndUserFormUsername(dto.username || '');
                                      setEndUserFormPhone(dto.phone || '');
                                      setEndUserFormEmail(dto.email || '');
                                      setEndUserFormNotes(dto.internal_notes || dto.notes || '');
                                      setEndUserFormStatus(dto.status || 'Ativo');
                                      setEndUserFormPlanId(dto.plan_id || dto.planId || '');
                                      setEndUserFormDnsList(dto.selected_server_ids || dto.authorizedDns || []);
                                      setEndUserFormPortalAccess(dto.portal_access ?? false);
                                      setHasLinkedLicense(dto.has_license ?? true);
                                    }
                                  } catch (err) {
                                    console.error('Erro ao carregar DTO do usuário final:', err);
                                  }
                                }}
                                className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Editar Usuário"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                onClick={() => handleToggleEndUserStatus(u.id, u.status)}
                                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                  u.status === 'Ativo'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                }`}
                                title={u.status === 'Ativo' ? 'Bloquear Usuário' : 'Desbloquear Usuário'}
                              >
                                {u.status === 'Ativo' ? <Lock size={14} /> : <UserCheck size={14} />}
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedUserForResetPassword(u);
                                  setResetGeneratedPassword(`SF#${Math.floor(100000 + Math.random() * 900000)}`);
                                }}
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Redefinir Senha (Reset)"
                              >
                                <KeyRound size={14} />
                              </button>

                              <button
                                onClick={() => handleDeleteEndUser(u.id)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Excluir Usuário (Exclusão Lógica)"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MÓDULO 17: TAB MODO PROVEDOR (PLANOS & ASSINATURAS) */}
      {activeTab === 'provider-plans' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 z-10">
              <div className="inline-flex items-center gap-2 bg-[#6A00FF]/20 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-gray-300">
                <Building2 size={14} />
                <span>MÓDULO 17 — MODO PROVEDOR (ASSINATURA MENSAL)</span>
              </div>
              <h3 className="text-xl font-semibold text-white tracking-tight">Arquitetura de Negócio: Provedores</h3>
              <p className="text-xs text-gray-400 max-w-2xl">
                Os Provedores operam no modelo SaaS recorrente com taxa de implantação e mensalidade fixa por quantidade máxima de usuários ativos. Não consomem créditos da plataforma.
              </p>
            </div>

            {currentUser.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => setShowNewPlanModal(true)}
                className="px-5 py-3 bg-white hover:bg-gray-200 text-black font-medium text-xs rounded-lg  transition-all flex items-center gap-2 cursor-pointer shrink-0 z-10"
              >
                <Plus size={16} />
                <span>CRIAR PLANO DE PROVEDOR</span>
              </button>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#000000] border border-white/10 rounded-lg p-4 shadow-sm space-y-1">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Planos de Provedor</span>
              <div className="text-2xl font-semibold text-white">{providerPlans.length}</div>
              <p className="text-xs text-gray-300 font-mono">Disponíveis na Plataforma</p>
            </div>

            <div className="bg-[#000000] border border-emerald-500/20 rounded-lg p-4 shadow-sm space-y-1">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Assinaturas Ativas</span>
              <div className="text-2xl font-semibold text-emerald-400">{providerSubscriptions.filter((s) => s.status === 'ATIVA').length}</div>
              <p className="text-xs text-emerald-500/70 font-mono">Provedores em Dia</p>
            </div>

            <div className="bg-[#000000] border border-purple-500/20 rounded-lg p-4 shadow-sm space-y-1">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Receita Recorrente (MRR Est.)</span>
              <div className="text-2xl font-semibold text-purple-300">
                R$ {providerSubscriptions.reduce((acc, curr) => acc + curr.monthlyPrice, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-purple-400/70 font-mono">Faturamento Mensal</p>
            </div>

            <div className="bg-[#000000] border border-blue-500/20 rounded-lg p-4 shadow-sm space-y-1">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Capacidade Total Ativos</span>
              <div className="text-2xl font-semibold text-blue-400">
                {providerSubscriptions.reduce((acc, curr) => acc + curr.maxActiveUsers, 0).toLocaleString()}
              </div>
              <p className="text-xs text-blue-400/70 font-mono">Limite Global Sumarizado</p>
            </div>
          </div>

          {/* Table 1: Provider Plans (provider_plans) */}
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h4 className="text-base font-semibold text-white flex items-center gap-2">
                <Sliders size={18} className="text-gray-300" />
                <span>Tabela de Planos de Provedor (<code className="text-gray-300">provider_plans</code>)</span>
              </h4>
              <span className="text-xs text-gray-400 font-mono">Gerenciado pelo Super Admin</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 font-bold uppercase text-xs tracking-wider">
                    <th className="py-3 px-4">Plano</th>
                    <th className="py-3 px-4">Max. Usuários Ativos</th>
                    <th className="py-3 px-4">Mensalidade</th>
                    <th className="py-3 px-4">Taxa de Implantação</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {providerPlans.map((pp) => (
                    <tr key={pp.id} className="hover:bg-white/[0.02] even:bg-white/[0.01] transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{pp.name}</td>
                      <td className="py-3 px-4 text-emerald-400 font-mono font-bold">{pp.maxActiveUsers.toLocaleString()} usuários</td>
                      <td className="py-3 px-4 text-white font-mono font-bold">R$ {pp.monthlyPrice.toFixed(2)} / mês</td>
                      <td className="py-3 px-4 text-gray-300 font-mono">R$ {pp.setupFee.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/30">
                          {pp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {currentUser.role === 'SUPER_ADMIN' && (
                          <button
                            onClick={() => showToast(`Plano ${pp.name} selecionado para edição.`)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {currentUser.role === 'PROVEDOR' && (
                          <button
                            onClick={() => handleProviderSubscribe(pp)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Assinar via PIX
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Provider Subscriptions */}
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h4 className="text-base font-semibold text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>Assinaturas Contratadas por Provedores</span>
              </h4>
              <span className="text-xs text-gray-400 font-mono">Controle de Limites Ativos & Inadimplência</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 font-bold uppercase text-xs tracking-wider">
                    <th className="py-3 px-4">Provedor</th>
                    <th className="py-3 px-4">Plano Contratado</th>
                    <th className="py-3 px-4">Uso de Usuários Ativos</th>
                    <th className="py-3 px-4">Valor Mensal</th>
                    <th className="py-3 px-4">Próximo Vencimento</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {providerSubscriptions.filter(sub => currentUser.role === 'SUPER_ADMIN' || sub.providerId === currentUser.accountId).map((sub) => {
                    const activeCount = endUsers.filter(
                      (u) => !u.isDeleted && u.originType === 'PROVEDOR' && u.originId === sub.providerId && u.status === 'Ativo'
                    ).length;

                    const usagePercentage = Math.min(100, Math.round((activeCount / sub.maxActiveUsers) * 100));

                    return (
                      <tr key={sub.id} className="hover:bg-white/[0.02] even:bg-white/[0.01] transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{sub.providerName}</td>
                        <td className="py-3 px-4 text-gray-300 font-bold">{sub.planName}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-gray-300 font-bold">{activeCount} / {sub.maxActiveUsers}</span>
                              <span className="text-gray-400">{usagePercentage}%</span>
                            </div>
                            <div className="w-32 bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  usagePercentage >= 90 ? 'bg-red-500' : usagePercentage >= 75 ? 'bg-amber-500' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${usagePercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white font-mono font-bold">R$ {sub.monthlyPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-gray-300 font-mono">{sub.nextDueDate}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                              sub.status === 'ATIVA'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/20 text-red-400 border-red-500/40'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MÓDULO 17: TAB SERVIDORES (DNS) ISOLADA */}
      {activeTab === 'dns-management' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-[#6A00FF]/20 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-gray-300">
                <Globe size={14} />
                <span>MÓDULO 17 — ISOLAMENTO DE Servidor (DNS) POR ÁRVORE</span>
              </div>
              <h3 className="text-xl font-semibold text-white tracking-tight">Gerenciamento de Servidores (DNS)</h3>
              <p className="text-xs text-gray-400 max-w-2xl">
                Nenhum administrador ou aplicativo pode visualizar usuários de outra árvore. Cada servidor Servidor (DNS) é associado estritamente à sua conta proprietária.
              </p>
            </div>

            <button
              onClick={() => setShowNewDnsModal(true)}
              className="px-5 py-3 bg-white hover:bg-gray-200 text-black font-medium text-xs rounded-lg  transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>ADICIONAR SERVIDOR (DNS)</span>
            </button>
          </div>

          {/* Servidor (DNS) Cards / Table */}
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 font-bold uppercase text-xs tracking-wider">
                    <th className="py-3 px-4">Nome / Conta</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Última conexão</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {accountDnsList.filter(dns => currentUser.role === 'SUPER_ADMIN' || dns.ownerId === currentUser.accountId).map((dns) => (
                    <tr key={dns.id} className="hover:bg-white/[0.02] even:bg-white/[0.01] transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{dns.ownerName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold border ${
                            dns.ownerType === 'PROVEDOR'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'

                              : dns.ownerType === 'REVENDA'
                              ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {dns.ownerType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300 font-mono font-bold">{dns.dnsUrl}</td>
                      
                      <td className="py-3 px-4 text-gray-400 italic">{dns.notes || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/30">
                          {dns.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                         <button
                            onClick={() => {
                               const textToCopy = `Servidor: ${dns.server_name || dns.serverCode}\nUsuário: ${dns.serverUsername || ''}\nSenha: ${dns.serverPassword || ''}`;
                               navigator.clipboard.writeText(textToCopy);
                               showToast('Acesso copiado para a área de transferência!');
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded border border-white/10 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Copiar Código, Usuário e Senha (Sem expor Xtream)"
                         >
                             <Copy size={12} /> Copiar Acesso
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MÓDULO 17: TAB TESTADOR DUPLO LOGIN API */}
      {activeTab === 'dual-login-tester' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#6A00FF]/20 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-gray-300">
              <KeyRound size={14} />
              <span>MÓDULO 17 — REFORULAÇÃO DO LOGIN</span>
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight">Testador do Duplo Fluxo de Autenticação</h3>
            <p className="text-xs text-gray-400 max-w-3xl">
              Teste o endpoint <code className="text-gray-300">POST /api/v1/auth/device-login</code> utilizando o Código da Licença do Usuário Final.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Simulator */}
            <div className="lg:col-span-5 bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-5">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Sliders size={16} className="text-gray-300" />
                <span>Simulação de Entrada de Aplicativo</span>
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Plano / Licença</label>
                  {plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null).length === 0 ? (
                    <div className="w-full bg-[#000000] border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400 font-medium">
                      Nenhum Plano de Licença ativo foi cadastrado pelo Super Admin.
                    </div>
                  ) : (
                  <select
                    value={endUserFormPlanId}
                    onChange={(e) => setEndUserFormPlanId(e.target.value)}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                    required
                  >
                    <option value="" disabled>Selecione um plano</option>
                    {plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null).map((p) => {
                      if (!p.name || !p.validity_days) {
                        console.error('Plano inválido:', p);
                        return <option key={p.id} value={p.id}>Plano inválido</option>;
                      }
                      
                      let label = '';
                      if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'PROVEDOR') {
                        label = `${p.name} — ${p.validity_days} dias`;
                      } else {
                        if (p.reseller_credit_cost === undefined || p.reseller_credit_cost === null) {
                           console.error('Plano com custo inválido:', p);
                           return <option key={p.id} value={p.id}>Plano inválido</option>;
                        }
                        label = `${p.name} — ${p.validity_days} dias — ${p.reseller_credit_cost} créditos`;
                      }
                      
                      return (
                        <option key={p.id} value={p.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  )}
                </div>
                {(currentUser.role === 'REVENDA' || currentUser.role === 'SUBREVENDA') && (
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-300 block mb-1">Selecione os Servidores (DNS) da Licença</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-[#000000] border border-white/10 rounded-lg">
                    {accountDnsList.filter(dns => dns.ownerId === currentUser.accountId).length === 0 ? (
                      <span className="text-gray-500 text-xs italic">Nenhum Servidor (DNS) cadastrado.</span>
                    ) : (
                      accountDnsList.filter(dns => dns.ownerId === currentUser.accountId).map((dns) => (
                        <label key={dns.id} className="flex items-center gap-2 text-xs text-white bg-white/5 px-2 py-1 rounded cursor-pointer hover:bg-white/10 transition-colors">
                          <input
                            type="checkbox"
                            checked={endUserFormDnsList.includes(dns.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEndUserFormDnsList([...endUserFormDnsList, dns.id]);
                              } else {
                                setEndUserFormDnsList(endUserFormDnsList.filter(d => d !== dns.id));
                              }
                            }}
                            className="accent-[#9C4DFF]"
                          />
                          {dns.dnsUrl}
                        </label>
                      ))
                    )}
                  </div>
                </div>
                )}
                
                {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'PROVEDOR') && (
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-300 block mb-1">Quantidade de Dispositivos (Telas simultâneas)</label>
                  <input
                    type="number"
                    min="1"
                    value={endUserFormMaxDevices}
                    onChange={(e) => setEndUserFormMaxDevices(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                    required
                  />
                </div>
                )}
                
                {currentUser.role === 'SUPER_ADMIN' && (
                <div className="col-span-1 sm:col-span-2">
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="accent-[#9C4DFF]"
                    />
                    Permitir acesso ao Portal do Cliente (Self-Service)
                  </label>
                </div>
                )}


                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Status do Usuário</label>
                  <select
                    value={endUserFormStatus}
                    onChange={(e) => setEndUserFormStatus(e.target.value as EndUserStatus)}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Bloqueado">Bloqueado</option>
                    <option value="Suspenso">Suspenso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Observações Internas</label>
                <textarea
                  value={endUserFormNotes}
                  onChange={(e) => setEndUserFormNotes(e.target.value)}
                  placeholder="Anotações internas sobre preferências ou histórico do cliente..."
                  rows={2}
                  className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowEndUserModal(false);
                    setEditingEndUser(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    const formData = {
                      name: endUserFormName,
                      username: endUserFormUsername,
                      password: endUserFormPassword,
                      planId: endUserFormPlanId,
                      max_devices: endUserFormMaxDevices,
                      max_servers: endUserFormMaxServers,
                      email: endUserFormEmail,
                      notes: endUserFormNotes,
                      status: endUserFormStatus
                    };
                    handleSaveEndUser(e, formData);
                  }}
                  disabled={plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null).length === 0}
                  className={`px-5 py-2 font-bold text-xs rounded-lg shadow-sm border border-white/10 ${plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null).length === 0 ? 'bg-white/20 text-gray-400 cursor-not-allowed' : 'bg-white text-black hover:from-[#801aff] hover:to-[#b066ff] cursor-pointer'}`}
                >
                  {editingEndUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAÇÃO DE CONTA HIERARQUIA */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 max-w-md w-full shadow-sm animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 mb-4">
              {editingAccountId ? 'Editar Conta' : 'Criar Nova Conta'} - {newAccOwnerType}
            </h3>
            <div className="space-y-4">
              {hierarchyRoleFilter !== 'PROVEDOR' && currentUser.role === 'SUPER_ADMIN' && !editingAccountId && (
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Tipo de Conta</label>
                <select value={newAccOwnerType} onChange={(e) => setNewAccOwnerType(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30">
                  <option value="REVENDA">Revenda</option>
                  <option value="SUBREVENDA">Sub-Revenda</option>
                </select>
              </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Nome Completo / Razão Social</label>
                <input type="text" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Email de Acesso</label>
                <input type="email" value={newAccEmail} onChange={(e) => setNewAccEmail(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30" required />
              </div>
              {!editingAccountId && (
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Senha Inicial</label>
                <input type="password" value={newAccPassword} onChange={(e) => setNewAccPassword(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30" required />
              </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Status</label>
                <select value={newAccStatus} onChange={(e) => setNewAccStatus(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30">
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>
              {newAccOwnerType === 'PROVEDOR' && (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Código do Provedor</label>
                  <input type="text" value="gerado automaticamente" disabled className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono cursor-not-allowed focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Plano de Provedor</label>
                  <select value={newAccPlanId} onChange={(e) => setNewAccPlanId(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30">
                    <option value="">Selecione um plano</option>
                    {providerPlans?.filter(p => p.status === 'ACTIVE' && p.deleted_at === null).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </>
              )}
              {newAccOwnerType === 'SUBREVENDA' && (
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Revenda Responsável</label>
                <select value={newAccParentId} onChange={(e) => setNewAccParentId(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30">
                  <option value="">Selecione a Revenda</option>
                  {accounts.filter(acc => acc?.role === 'RESELLER' && acc.status === 'ACTIVE').map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.full_name || acc.name}</option>
                  ))}
                </select>
              </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6 border-t border-white/10 pt-4">
              <button onClick={() => { setShowCreateAccountModal(false); setEditingAccountId(null); }} className="px-4 py-2 bg-white/5 text-gray-300 text-xs font-bold rounded-lg hover:bg-white/10 transition-colors cursor-pointer">Cancelar</button>
              <button onClick={(e) => { handleCreateAccount(e); }} className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">{editingAccountId ? 'Salvar Alterações' : 'Criar Conta'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRO DE USUÁRIO FINAL */}
      {showEndUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 max-w-lg w-full shadow-sm animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 mb-4">
              {editingEndUser ? 'Editar Usuário Final' : 'Cadastrar Usuário Final'}
            </h3>

            {editingEndUser && !hasLinkedLicense && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 font-medium">
                ⚠️ Usuário sem licença vinculada
              </div>
            )}

            <div className="space-y-4">
              {/* Tipo de Ativação (Trial vs Licença Ativa) - Apenas no cadastro e se não for PROVEDOR */}
              {!editingEndUser && currentUser.role !== 'PROVEDOR' && currentUser.role !== 'PROVIDER' && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-2">
                  <label className="text-xs font-bold text-gray-300 block">Tipo de Ativação</label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs text-white cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="endUserActivationType"
                        value="ACTIVE"
                        checked={endUserActivationType === 'ACTIVE'}
                        onChange={() => setEndUserActivationType('ACTIVE')}
                        className="accent-[#9C4DFF]"
                      />
                      Licença Ativa
                    </label>
                    <label className="flex items-center gap-2 text-xs text-white cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="endUserActivationType"
                        value="TRIAL"
                        checked={endUserActivationType === 'TRIAL'}
                        onChange={() => setEndUserActivationType('TRIAL')}
                        className="accent-[#9C4DFF]"
                      />
                      Trial (Teste Gratuito)
                    </label>
                  </div>

                  {endUserActivationType === 'TRIAL' && (
                    <div className="mt-2 p-2.5 bg-[#801aff]/15 border border-[#801aff]/30 rounded-lg text-xs text-purple-200">
                      <div className="font-bold flex items-center gap-1 text-purple-300 mb-1">
                        ✨ Modo Trial Selecionado
                      </div>
                      <p className="text-gray-300">
                        • Não consome créditos da revenda.
                      </p>
                      <p className="text-gray-300">
                        • Validade calculada: <span className="font-bold text-white">
                          {
                            (() => {
                              const selPlan = plans.find(p => p.id === endUserFormPlanId);
                              const trialSetting = systemSettings?.find((s: any) => s.setting_key === 'trial_days_default');
                              const defaultTrialDays = trialSetting?.setting_value ? parseInt(trialSetting.setting_value, 10) : 7;
                              const days = (selPlan?.trial_days && selPlan.trial_days > 0) ? selPlan.trial_days : defaultTrialDays;
                              const expDate = new Date();
                              expDate.setDate(expDate.getDate() + days);
                              return `${days} dia(s) (expira em ${expDate.toLocaleDateString('pt-BR')})`;
                            })()
                          }
                        </span> (somente leitura).
                      </p>
                      <p className="text-gray-300">
                        • Limite: 1 dispositivo por padrão.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Nome Completo</label>
                  <input type="text" value={endUserFormName} onChange={(e) => setEndUserFormName(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Usuário de Acesso (Username)</label>
                  <input type="text" value={endUserFormUsername} onChange={(e) => setEndUserFormUsername(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-white/30" />
                </div>
                {!editingEndUser && (
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Senha (Password)</label>
                  <input type="password" value={endUserFormPassword} onChange={(e) => setEndUserFormPassword(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-white/30" />
                </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Telefone (WhatsApp)</label>
                  <input type="text" value={endUserFormPhone} onChange={(e) => setEndUserFormPhone(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Email</label>
                  <input type="email" value={endUserFormEmail} onChange={(e) => setEndUserFormEmail(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Status</label>
                  <select value={endUserFormStatus} onChange={(e) => setEndUserFormStatus(e.target.value as any)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30">
                    <option value="Ativo">Ativo</option>
                    <option value="Bloqueado">Bloqueado</option>
                    <option value="Suspenso">Suspenso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Plano / Licença</label>
                {plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null).length === 0 ? (
                  <div className="w-full bg-[#000000] border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400 font-medium">
                    Nenhum Plano de Licença ativo foi cadastrado pelo Super Admin.
                  </div>
                ) : (
                <select
                  value={endUserFormPlanId}
                  onChange={(e) => setEndUserFormPlanId(e.target.value)}
                  className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                  required
                >
                  <option value="" disabled>Selecione um plano</option>
                  {plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null).map((p) => {
                    let label = '';
                    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'PROVEDOR' || currentUser.role === 'PROVIDER') {
                      label = `${p.name} — ${p.validity_days} dias`;
                    } else {
                      label = `${p.name} — ${p.validity_days} dias — ${p.reseller_credit_cost || 0} créditos`;
                    }
                    return (
                      <option key={p.id} value={p.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                )}
              </div>

              {(currentUser.role === 'REVENDA' || currentUser.role === 'SUBREVENDA' || currentUser.role === 'PROVEDOR' || currentUser.role === 'RESELLER' || currentUser.role === 'SUB_RESELLER' || currentUser.role === 'PROVIDER') && (
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Selecione os Servidores (DNS) da Licença</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-[#000000] border border-white/10 rounded-lg">
                  {accountDnsList.filter(dns => dns.ownerId === currentUser.accountId).length === 0 ? (
                    <span className="text-gray-500 text-xs italic">Nenhum Servidor (DNS) cadastrado.</span>
                  ) : (
                    accountDnsList.filter(dns => dns.ownerId === currentUser.accountId).map((dns) => (
                      <label key={dns.id} className="flex items-center gap-2 text-xs text-white bg-white/5 px-2 py-1 rounded cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={endUserFormDnsList.includes(dns.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEndUserFormDnsList([...endUserFormDnsList, dns.id]);
                            } else {
                              setEndUserFormDnsList(endUserFormDnsList.filter(d => d !== dns.id));
                            }
                          }}
                          className="accent-[#9C4DFF]"
                        />
                        {dns.dnsUrl}
                      </label>
                    ))
                  )}
                </div>
              </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-xs text-white cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    id="endUserPortalAccess"
                    checked={endUserFormPortalAccess}
                    onChange={(e) => setEndUserFormPortalAccess(e.target.checked)}
                    className="accent-[#9C4DFF]"
                  />
                  Permitir acesso ao Portal do Cliente (Self-Service)
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Observações Internas</label>
                <textarea value={endUserFormNotes} onChange={(e) => setEndUserFormNotes(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 border-t border-white/10 pt-4">
              <button onClick={() => { setShowEndUserModal(false); setEditingEndUser(null); }} className="px-4 py-2 bg-white/5 text-gray-300 text-xs font-bold rounded-lg hover:bg-white/10 transition-colors cursor-pointer">Cancelar</button>
              <button onClick={async (e) => { 
                const statusToSend = (!editingEndUser && endUserActivationType === 'TRIAL') ? 'TRIAL' : endUserFormStatus;
                const formData = {
                  id: editingEndUser?.id,
                  name: endUserFormName,
                  full_name: endUserFormName,
                  username: endUserFormUsername,
                  password: endUserFormPassword,
                  phone: endUserFormPhone,
                  email: endUserFormEmail,
                  status: statusToSend,
                  notes: endUserFormNotes,
                  internal_notes: endUserFormNotes,
                  planId: endUserFormPlanId,
                  plan_id: endUserFormPlanId,
                  selected_server_ids: endUserFormDnsList,
                  portal_access: endUserFormPortalAccess
                };
                const success = await handleSaveEndUser(e, formData);
                if (success) {
                  setShowEndUserModal(false);
                }
              }} className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">{editingEndUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: DETALHES COMPLETOS DO USUÁRIO FINAL */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 max-w-2xl w-full shadow-sm space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#6A00FF]/20 text-gray-300 flex items-center justify-center font-bold border border-[#6A00FF]/30">
                  <UserCheck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{selectedUserForDetails.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        selectedUserForDetails.status === 'Ativo'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                          : selectedUserForDetails.status === 'Bloqueado'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {selectedUserForDetails.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono">
                    @{selectedUserForDetails.username} • ID: {selectedUserForDetails.id}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedUserForDetails(null)} className="text-gray-400 hover:text-white p-1">
                <XCircle size={20} />
              </button>
            </div>

            {/* Profile Grid Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#000000] p-4 rounded-lg border border-white/5 space-y-2">
                <h4 className="font-bold text-purple-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus size={14} /> Dados Pessoais & Acesso
                </h4>
                <div className="space-y-1 text-gray-300">
                  <div><strong className="text-gray-400">Nome:</strong> {selectedUserForDetails.name}</div>
                  <div><strong className="text-gray-400">Usuário:</strong> <code className="text-gray-300">@{selectedUserForDetails.username}</code></div>
                  <div className="flex items-center gap-2">
                    <strong className="text-gray-400">Senha:</strong>
                    <code className="text-amber-300 font-mono">
                      {showPasswordInDetails ? selectedUserForDetails.password : '••••••••'}
                    </code>
                    <button
                      onClick={() => setShowPasswordInDetails(!showPasswordInDetails)}
                      className="text-gray-400 hover:text-white p-0.5"
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                  <div><strong className="text-gray-400">Telefone:</strong> {selectedUserForDetails.phone || 'Não informado'}</div>
                  <div><strong className="text-gray-400">E-mail:</strong> {selectedUserForDetails.email || 'Não informado'}</div>
                  <div><strong className="text-gray-400">DNS:</strong> {selectedUserForDetails.authorizedDns?.length || 0} associadas</div>
                </div>
              </div>

              <div className="bg-[#000000] p-4 rounded-lg border border-white/5 space-y-2">
                <h4 className="font-bold text-purple-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <GitFork size={14} /> Hierarquia & Responsáveis
                </h4>
                <div className="space-y-1 text-gray-300">
                  <div><strong className="text-gray-400">Provedor Principal:</strong> {selectedUserForDetails.providerName}</div>
                  <div><strong className="text-gray-400">Revenda Responsável:</strong> {selectedUserForDetails.resellerName || selectedUserForDetails.providerName}</div>
                  <div><strong className="text-gray-400">Data de Cadastro:</strong> {selectedUserForDetails.createdAt}</div>
                  <div><strong className="text-gray-400">Último Acesso:</strong> {selectedUserForDetails.lastAccess}</div>
                </div>
              </div>
            </div>

            {/* License Details Section */}
            {(() => {
              const userLic = licenses.find((l) => l.end_user_id === selectedUserForDetails.id);
              const plan = userLic ? plans.find(p => p.id === userLic.plan_id) : null;
              const daysRem = userLic ? getDaysRemaining(userLic.expires_at) : null;

              return (
                <div className="bg-[#000000] p-4 rounded-lg border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound size={14} /> Licença de Uso Associada
                    </h4>
                    {userLic && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">
                        {userLic.status}
                      </span>
                    )}
                  </div>

                  {userLic ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#000000] p-3 rounded-lg border border-white/5">
                      <div>
                        <span className="text-gray-400 text-xs block">Código da Licença</span>
                        <div className="font-mono text-gray-300 font-bold truncate">{userLic.code}</div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs block">Plano & Duração</span>
                        <div className="font-bold text-white">{plan?.name || 'Plano Desconhecido'} ({plan?.validity_days || 0} dias)</div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs block">Data de Vencimento</span>
                        <div className="font-bold text-amber-300">{new Date(userLic.expires_at).toLocaleDateString()} ({daysRem} dias)</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300 flex items-center justify-between">
                      <span>Este usuário não possui nenhuma licença ativa vinculada no momento.</span>
                      <button
                        onClick={() => {
                          setSelectedUserForDetails(null);
                          setActiveTab('licenses');
                        }}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-xs"
                      >
                        Ativar Licença
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Audit History / Transactions Log for this user */}
            <div className="bg-[#000000] p-4 rounded-lg border border-white/5 space-y-2">
              <h4 className="font-bold text-purple-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Receipt size={14} /> Histórico de Auditoria & Alterações
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {transactions.filter((t) => t.toOwnerId === selectedUserForDetails.id || t.description.includes(selectedUserForDetails.username)).length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Nenhum evento registrado no livro-razão de auditoria para este usuário.</p>
                ) : (
                  transactions
                    .filter((t) => t.toOwnerId === selectedUserForDetails.id || t.description.includes(selectedUserForDetails.username))
                    .map((t) => (
                      <div key={t.id} className="p-2 bg-[#000000] rounded-lg text-xs text-gray-300 flex items-center justify-between">
                        <span className="font-medium text-gray-200">{t.description}</span>
                        <span className="text-xs text-gray-500 font-mono shrink-0 ml-2">{t.createdAt}</span>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Modal Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleToggleEndUserStatus(selectedUserForDetails.id, selectedUserForDetails.status);
                    setSelectedUserForDetails({
                      ...selectedUserForDetails,
                      status: selectedUserForDetails.status === 'Ativo' ? 'Bloqueado' : 'Ativo',
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    selectedUserForDetails.status === 'Ativo'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  {selectedUserForDetails.status === 'Ativo' ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                </button>

                <button
                  onClick={() => {
                    const u = selectedUserForDetails;
                    setSelectedUserForDetails(null);
                    setSelectedUserForResetPassword(u);
                    setResetGeneratedPassword(`SF#${Math.floor(100000 + Math.random() * 900000)}`);
                  }}
                  className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Redefinir Senha
                </button>
              </div>

              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="px-5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: REDEFINIÇÃO DE SENHA (RESET) */}
      {selectedUserForResetPassword && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 max-w-md w-full shadow-sm space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Redefinir Senha de Acesso</h3>
                  <p className="text-xs text-gray-400">Usuário: @{selectedUserForResetPassword.username}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUserForResetPassword(null)} className="text-gray-400 hover:text-white p-1">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleResetEndUserPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Nova Senha Gerada</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={resetGeneratedPassword}
                    onChange={(e) => setResetGeneratedPassword(e.target.value)}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-white/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setResetGeneratedPassword(`SF#${Math.floor(100000 + Math.random() * 900000)}`)}
                    className="px-3 py-2 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded-lg text-xs font-bold shrink-0"
                    title="Gerar Nova Senha Aleatória"
                  >
                    Gerar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">A ação será registrada no log de auditoria do sistema.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedUserForResetPassword(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!resetGeneratedPassword) return;
                    
                    const btn = e.currentTarget;
                    btn.disabled = true;
                    btn.innerText = 'Redefinindo...';
                    
                    try {
                      const res = await fetch('/api/admin/reset-user-password', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
                        },
                        body: JSON.stringify({ userId: selectedUserForResetPassword.id, newPassword: resetGeneratedPassword })
                      });
                      
                      const data = await res.json();
                      if (data.success) {
                        showToast('Senha redefinida com sucesso.');
                        setSelectedUserForResetPassword(null);
                      } else {
                        showToast(data.error || 'Erro ao redefinir a senha.');
                      }
                    } catch (err: any) {
                       showToast('Erro de conexão com o servidor.');
                    } finally {
                       btn.disabled = false;
                       btn.innerText = 'Confirmar Redefinição';
                    }
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm border border-white/10 cursor-pointer disabled:opacity-50"
                >
                  Confirmar Redefinição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* MODAL CADASTRO DE SERVIDOR (DNS) */}
      {showNewDnsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 max-w-lg w-full shadow-sm space-y-5 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#6A00FF]/20 text-gray-300 flex items-center justify-center font-bold border border-[#6A00FF]/30">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Cadastrar Servidor (DNS)</h3>
                  <p className="text-xs text-gray-400">Associe o Servidor (DNS) à sua conta proprietária</p>
                </div>
              </div>
              <button onClick={() => { setShowNewDnsModal(false); resetDnsForm(); }} className="text-gray-400 hover:text-white p-1">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="bg-[#111111] p-4 rounded-lg border border-white/10 mb-4">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Sparkles size={14} className="text-emerald-400"/> Identificação Automática</h4>
                <p className="text-xs text-gray-400">
                    Você pode cadastrar utilizando <strong>Xtream (URL + Usuário + Senha)</strong>, <strong>URL Completa Xtream</strong> ou <strong>Arquivo M3U</strong>.
                    O sistema identificará automaticamente o formato informado.
                </p>
            </div>

            <form onSubmit={(e) => handleSaveDns(e, { name: dnsFormName, url: dnsFormUrl, username: dnsFormUser, password: dnsFormPass, fullUrl: dnsFormFullUrl, notes: dnsFormNotes, ownerId: dnsFormOwnerId, method: dnsRegMethod, id: editingDns?.id })} className="space-y-4">
              <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                  <button type="button" onClick={() => setDnsRegMethod('XTREAM')} className={`flex-1 py-2 text-xs font-bold rounded ${dnsRegMethod === 'XTREAM' ? 'bg-[#6A00FF] text-white' : 'text-gray-400 hover:text-white'}`}>Xtream Manual</button>
                  <button type="button" onClick={() => setDnsRegMethod('URL')} className={`flex-1 py-2 text-xs font-bold rounded ${dnsRegMethod === 'URL' ? 'bg-[#6A00FF] text-white' : 'text-gray-400 hover:text-white'}`}>URL Completa</button>
                  <button type="button" onClick={() => setDnsRegMethod('M3U')} className={`flex-1 py-2 text-xs font-bold rounded ${dnsRegMethod === 'M3U' ? 'bg-[#6A00FF] text-white' : 'text-gray-400 hover:text-white'}`}>Arquivo M3U</button>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Conta Proprietária *</label>
                <select
                  value={dnsFormOwnerId}
                  onChange={(e) => setDnsFormOwnerId(e.target.value)}
                  className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                >
                  <option value={currentUser.accountId}>Minha Conta ({currentUser.name})</option>
                  {currentUser.role === 'SUPER_ADMIN' && accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.ownerType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Nome do Servidor *</label>
                <input
                  type="text"
                  value={dnsFormName}
                  onChange={(e) => setDnsFormName(e.target.value)}
                  placeholder="Ex: Servidor Principal"
                  className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              {dnsRegMethod === 'M3U' && (
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Enviar Arquivo M3U</label>
                    <input
                      type="file"
                      accept=".m3u,.m3u8"
                      onChange={handleM3UUpload}
                      className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#6A00FF]/20 file:text-[#6A00FF] hover:file:bg-[#6A00FF]/30"
                    />
                  </div>
              )}

              {dnsRegMethod === 'URL' && (
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">URL Completa Xtream</label>
                    <input
                      type="text"
                      value={dnsFormFullUrl}
                      onChange={(e) => handleFullUrlChangeLocal(e.target.value)}
                      placeholder="http://servidor.com:8080/player_api.php?username=user&password=pass"
                      className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                    />
                  </div>
              )}

              <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 mt-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">URL Base *</label>
                    <input
                      type="url"
                      value={dnsFormUrl}
                      onChange={(e) => setDnsFormUrl(e.target.value)}
                      placeholder="http://servidor.com:8080"
                      className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Usuário Xtream *</label>
                        <input
                          type="text"
                          value={dnsFormUser}
                          onChange={(e) => setDnsFormUser(e.target.value)}
                          className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Senha Xtream *</label>
                        <input
                          type="password"
                          value={dnsFormPass}
                          onChange={(e) => setDnsFormPass(e.target.value)}
                          className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                          required
                        />
                      </div>
                  </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Observações</label>
                <input
                  type="text"
                  value={dnsFormNotes}
                  onChange={(e) => setDnsFormNotes(e.target.value)}
                  placeholder="Ex: Servidor de Borda de alta performance"
                  className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                />
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg mt-2">
                 <button
                    type="button"
                    onClick={handleTestConnectionLocal}
                    className="px-4 py-2 bg-[#6A00FF] hover:bg-[#6A00FF]/80 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center gap-2 transition-all"
                 >
                    {dnsTestStatus === 'TESTING' ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
                    Testar Conexão
                 </button>
                 <div className="flex-1 text-right">
                    {dnsTestStatus === 'SUCCESS' && <span className="text-emerald-400 text-xs font-bold flex items-center justify-end gap-1"><CheckCircle2 size={14}/> Conectado</span>}
                    {dnsTestStatus === 'FAILED' && <span className="text-red-400 text-xs font-bold flex items-center justify-end gap-1"><AlertCircle size={14}/> Falha na conexão</span>}
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setShowNewDnsModal(false); resetDnsForm(); }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={dnsTestStatus !== 'SUCCESS'}
                  className={`px-5 py-2 font-medium text-xs rounded-lg shadow-sm transition-all ${dnsTestStatus === 'SUCCESS' ? 'bg-white hover:bg-gray-200 text-black cursor-pointer' : 'bg-white/20 text-gray-400 cursor-not-allowed'}`}
                >
                  Salvar Servidor (DNS)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
{/* MODAL MÓDULO 17: CADASTRO DE PLANO DE PROVEDOR (provider_plans) */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 max-w-md w-full shadow-sm space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#6A00FF]/20 text-gray-300 flex items-center justify-center font-bold border border-[#6A00FF]/30">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Novo Plano de Provedor (Mód. 17)</h3>
                  <p className="text-xs text-gray-400">Defina os limites de usuários ativos e taxas recorrentes</p>
                </div>
              </div>
              <button onClick={() => setShowNewPlanModal(false)} className="text-gray-400 hover:text-white p-1">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveProviderPlan(e, { maxUsers: planFormMaxUsers, price: planFormPrice, setup: planFormSetup })} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Quantidade Máxima de Usuários Ativos *</label>
                <input
                  type="number"
                  min="10"
                  value={planFormMaxUsers}
                  onChange={(e) => setPlanFormMaxUsers(parseInt(e.target.value) || 10)}
                  className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Valor da Mensalidade (R$) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planFormPrice}
                  onChange={(e) => setPlanFormPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Taxa de Implantação (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planFormSetup}
                  onChange={(e) => setPlanFormSetup(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-5 py-2 bg-white hover:bg-gray-200 text-black font-medium text-xs rounded-lg shadow-sm cursor-pointer"
                >
                  Salvar Plano Provedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>

      {newEndUserCredentials && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 max-w-md w-full shadow-sm animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-emerald-400 border-b border-white/10 pb-3 mb-4">
              Acesso Criado com Sucesso
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-gray-400">Código da Licença</label>
                <div className="text-lg font-mono text-white bg-white/5 px-3 py-2 rounded-lg mt-1">{newEndUserCredentials.licenseCode}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">Usuário</label>
                <div className="text-lg font-mono text-white bg-white/5 px-3 py-2 rounded-lg mt-1">{newEndUserCredentials.username}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">Senha</label>
                <div className="text-lg font-mono text-white bg-white/5 px-3 py-2 rounded-lg mt-1">{newEndUserCredentials.password}</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const txt = `Código: ${newEndUserCredentials.licenseCode}\nUsuário: ${newEndUserCredentials.username}\nSenha: ${newEndUserCredentials.password}`;
                  navigator.clipboard.writeText(txt);
                  showToast('Acesso copiado para a área de transferência');
                }} 
                className="flex-1 px-4 py-2 bg-[#6A00FF] text-white text-xs font-bold rounded-lg hover:bg-[#5900D9] transition-colors cursor-pointer"
              >
                COPIAR ACESSO
              </button>
              <button 
                onClick={() => setNewEndUserCredentials(null)} 
                className="flex-1 px-4 py-2 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
