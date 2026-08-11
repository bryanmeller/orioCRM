import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Terminal,
  Database,
  KeyRound,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Filter,
  Server,
  Zap,
  HardDrive,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  CreditCard,
  Globe,
  FileCode,
  Download,
  Trash2,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Sliders,
  Eye,
  Settings
} from 'lucide-react';
import { AdminUser, HierarchyAccount } from '../AdminPanel/AdminPanel';

interface SecurityAuditModuleProps {
  currentUser: AdminUser | null;
  accounts: HierarchyAccount[];
  showToast: (msg: string) => void;
}

export interface AuditLogRecord {
  uuid: string;
  userEmail: string;
  role: string;
  ip: string;
  userAgent: string;
  device: string;
  date: string;
  time: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'LOGIN_FAILURE'
    | 'CADASTRO'
    | 'EDICAO'
    | 'EXCLUSAO_LOGICA'
    | 'TRANSFERENCIA_CREDITOS'
    | 'COMPRA_CREDITOS'
    | 'COMPRA_LICENCA'
    | 'RENOVACAO'
    | 'BLOQUEIO'
    | 'DESBLOQUEIO'
    | 'TROCA_SENHA'
    | 'ALTERACAO_CONFIG'
    | 'CADASTRO_DNS'
    | 'REMOCAO_DNS';
  result: 'SUCCESS' | 'BLOCKED' | 'FAILED' | 'WARNING';
  details: string;
}

export interface ActiveSession {
  sessionId: string;
  userEmail: string;
  role: string;
  ip: string;
  device: string;
  loginTime: string;
  lastActive: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  jwtExpHours: number;
}

export const SecurityAuditModule: React.FC<SecurityAuditModuleProps> = ({
  currentUser,
  accounts,
  showToast,
}) => {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Active Sub-Tab for Security Module
  const [activeTab, setActiveTab] = useState<
    | 'health'
    | 'audit'
    | 'middleware'
    | 'sessions'
    | 'ratelimit'
    | 'cache_db'
    | 'backup'
    | 'api_docs'
  >('health');

  // --- 1. HEALTH MONITOR STATE ---
  const [healthMetrics, setHealthMetrics] = useState({
    apiStatus: 'ONLINE' as 'ONLINE' | 'OFFLINE' | 'DEGRADED',
    apiLatencyMs: 18,
    dbStatus: 'ONLINE' as 'ONLINE' | 'OFFLINE' | 'DEGRADED',
    dbLatencyMs: 4,
    dbConnections: 24,
    dbMaxConnections: 100,
    lynxStatus: 'ONLINE' as 'ONLINE' | 'OFFLINE' | 'DEGRADED',
    lynxLatencyMs: 42,
    cacheStatus: 'ONLINE' as 'ONLINE' | 'OFFLINE' | 'DEGRADED',
    cacheHitRate: 98.4,
    cacheMemoryMb: 64,
    storageStatus: 'ONLINE' as 'ONLINE' | 'OFFLINE' | 'DEGRADED',
    storageUsedGb: 14.2,
    storageTotalGb: 100,
    queueStatus: 'ONLINE' as 'ONLINE' | 'OFFLINE' | 'DEGRADED',
    queuePendingJobs: 0,
    lastCheckTime: new Date().toLocaleTimeString('pt-BR'),
  });

  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);

  const handleRefreshHealth = () => {
    setIsRefreshingHealth(true);
    setTimeout(() => {
      setHealthMetrics((prev) => ({
        ...prev,
        apiLatencyMs: Math.floor(Math.random() * 15) + 12,
        dbLatencyMs: Math.floor(Math.random() * 5) + 2,
        lynxLatencyMs: Math.floor(Math.random() * 30) + 30,
        cacheHitRate: Number((97.5 + Math.random() * 2).toFixed(1)),
        lastCheckTime: new Date().toLocaleTimeString('pt-BR'),
      }));
      setIsRefreshingHealth(false);
      showToast('Diagnóstico de Saúde da Plataforma atualizado com sucesso!');
    }, 600);
  };

  // --- 2. AUDIT TRAIL LOGS STATE ---
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([
    {
      uuid: 'aud-a1b2c3d4-001',
      userEmail: 'superadmin@streamflix.tv',
      role: 'SUPER_ADMIN',
      ip: '189.120.45.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0',
      device: 'Desktop Chrome (Windows)',
      date: '29/07/2026',
      time: '10:45:12',
      action: 'ALTERACAO_CONFIG',
      result: 'SUCCESS',
      details: 'Módulo 20: Atualizadas configurações globais e chave Lynx Gateway.',
    },
    {
      uuid: 'aud-a1b2c3d4-002',
      userEmail: 'provedor_sp@streamflix.tv',
      role: 'PROVEDOR',
      ip: '201.88.34.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      device: 'MacBook Pro (macOS)',
      date: '29/07/2026',
      time: '10:30:00',
      action: 'TRANSFERENCIA_CREDITOS',
      result: 'SUCCESS',
      details: 'Transferidos 50 créditos para Revenda "Revenda Master Sul".',
    },
    {
      uuid: 'aud-a1b2c3d4-003',
      userEmail: 'client_app_8812',
      role: 'END_USER',
      ip: '177.42.19.88',
      userAgent: 'StreamFlixApp/2.1.0 (Android TV v12)',
      device: 'Smart TV Android',
      date: '29/07/2026',
      time: '10:18:44',
      action: 'RENOVACAO',
      result: 'SUCCESS',
      details: 'Licença LNX-9988 renovada por +365 dias via Lynx PIX.',
    },
    {
      uuid: 'aud-a1b2c3d4-004',
      userEmail: 'unknown_attacker@ip.br',
      role: 'GUEST',
      ip: '45.130.12.9',
      userAgent: 'Python-urllib/3.10',
      device: 'Automated Script',
      date: '29/07/2026',
      time: '09:50:22',
      action: 'LOGIN_FAILURE',
      result: 'BLOCKED',
      details: 'Bloqueio preventivo ativado após 5 tentativas mal-sucedidas.',
    },
    {
      uuid: 'aud-a1b2c3d4-005',
      userEmail: 'revenda_sul@streamflix.tv',
      role: 'REVENDA',
      ip: '200.180.12.99',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5)',
      device: 'iPhone 15 Pro (iOS)',
      date: '29/07/2026',
      time: '09:12:05',
      action: 'CADASTRO_DNS',
      result: 'SUCCESS',
      details: 'Cadastrada nova Servidor (DNS) alternativa: http://play-sul.streamflix.tv:8080.',
    },
    {
      uuid: 'aud-a1b2c3d4-006',
      userEmail: 'provedor_sp@streamflix.tv',
      role: 'PROVEDOR',
      ip: '201.88.34.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      device: 'MacBook Pro (macOS)',
      date: '29/07/2026',
      time: '08:40:19',
      action: 'BLOQUEIO',
      result: 'SUCCESS',
      details: 'SubRevenda ID "subrev-02" bloqueada por violação de termos.',
    },
    {
      uuid: 'aud-a1b2c3d4-007',
      userEmail: 'superadmin@streamflix.tv',
      role: 'SUPER_ADMIN',
      ip: '189.120.45.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      device: 'Desktop Chrome (Windows)',
      date: '29/07/2026',
      time: '03:00:15',
      action: 'LOGIN',
      result: 'SUCCESS',
      details: 'Autenticação bem-sucedida via 2FA e verificação IP autorizada.',
    },
  ]);

  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // Filtered Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchAction = auditActionFilter === 'ALL' || log.action === auditActionFilter;
    const q = auditSearchQuery.toLowerCase();
    const matchSearch =
      !q ||
      log.userEmail.toLowerCase().includes(q) ||
      log.ip.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q);
    return matchAction && matchSearch;
  });

  // --- 3. MIDDLEWARE SECURITY TESTER ---
  const [middlewareSim, setMiddlewareSim] = useState({
    userRole: 'PROVEDOR',
    targetAccountRole: 'REVENDA',
    targetAccountOwnerId: 'prov-01',
    businessMode: 'PROVEDOR',
    originType: 'PROVEDOR_ORIGIN',
    jwtValid: true,
    accountStatus: 'ACTIVE',
  });

  const [simResult, setSimResult] = useState<{
    allowed: boolean;
    pipelineSteps: { name: string; passed: boolean; message: string }[];
  } | null>(null);

  const handleRunMiddlewareCheck = () => {
    const steps = [
      {
        name: '1. Assinatura e Validade do JWT',
        passed: middlewareSim.jwtValid,
        message: middlewareSim.jwtValid ? 'Token JWT válido e assinado com chave RS256' : 'Token ausente, expirado ou com assinatura inválida',
      },
      {
        name: '2. Status da Conta no Banco de Dados',
        passed: middlewareSim.accountStatus === 'ACTIVE',
        message: middlewareSim.accountStatus === 'ACTIVE' ? 'Conta em estado ATIVO no PostgreSQL' : 'Conta SUSPENSA ou BLOQUEADA no sistema',
      },
      {
        name: '3. Isolamento da Árvore Hierárquica',
        passed: true,
        message: 'Acesso restrito estritamente a sub-contas pertencentes ao mesmo ramo',
      },
      {
        name: '4. Compatibilidade do Business Mode & Origem',
        passed: true,
        message: `Origem [${middlewareSim.originType}] validada para o modo [${middlewareSim.businessMode}]`,
      },
      {
        name: '5. Controle de Acesso Baseado em Papéis (RBAC)',
        passed: true,
        message: `Permissões de ${middlewareSim.userRole} concedidas para gerenciar ${middlewareSim.targetAccountRole}`,
      },
    ];

    const overallAllowed = steps.every((s) => s.passed);

    setSimResult({
      allowed: overallAllowed,
      pipelineSteps: steps,
    });

    showToast(overallAllowed ? 'Middleware de Segurança: ACESSO PERMITIDO (200 OK)' : 'Middleware de Segurança: ACESSO NEGADO (403 FORBIDDEN)');
  };

  // --- 4. ACTIVE SESSIONS STATE ---
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([
    {
      sessionId: 'sess-88129a01',
      userEmail: 'superadmin@streamflix.tv',
      role: 'SUPER_ADMIN',
      ip: '189.120.45.102',
      device: 'Chrome 126 / Windows 11',
      loginTime: '29/07/2026 08:30:00',
      lastActive: 'Há 1 minuto',
      status: 'ACTIVE',
      jwtExpHours: 24,
    },
    {
      sessionId: 'sess-77210b02',
      userEmail: 'provedor_sp@streamflix.tv',
      role: 'PROVEDOR',
      ip: '201.88.34.12',
      device: 'Safari 17 / macOS Sonoma',
      loginTime: '29/07/2026 09:15:22',
      lastActive: 'Há 4 minutos',
      status: 'ACTIVE',
      jwtExpHours: 24,
    },
    {
      sessionId: 'sess-66109c03',
      userEmail: 'revenda_master@streamflix.tv',
      role: 'REVENDA',
      ip: '177.20.101.55',
      device: 'Firefox 125 / Ubuntu Linux',
      loginTime: '29/07/2026 07:10:40',
      lastActive: 'Há 18 minutos',
      status: 'ACTIVE',
      jwtExpHours: 24,
    },
  ]);

  const [sessionMaxConcurrent, setSessionMaxConcurrent] = useState<number>(3);
  const [inactivityAutoLogoutMinutes, setInactivityAutoLogoutMinutes] = useState<number>(30);

  const handleRevokeSession = (sessionId: string) => {
    setActiveSessions((prev) =>
      prev.map((s) => (s.sessionId === sessionId ? { ...s, status: 'REVOKED' } : s))
    );
    showToast(`Sessão ID ${sessionId} revogada! Token JWT adicionado à lista de revogação.`);
  };

  // --- 5. RATE LIMIT STATE ---
  const [rateLimitConfig, setRateLimitConfig] = useState({
    maxRequestsPerMinPublic: 60,
    maxRequestsPerMinAuthenticated: 300,
    maxRequestsPerMinSuperAdmin: 1000,
    windowSizeSeconds: 60,
    blockDurationMinutes: 15,
  });

  // --- 6. CACHE & DB PERFORMANCE STATE ---
  const [cacheBuckets, setCacheBuckets] = useState([
    { key: 'CONFIG_GLOBALS', items: 1, hitRate: '99.8%', ttlSeconds: 3600, status: 'WARM' },
    { key: 'PROVEDOR_PLANS', items: 12, hitRate: '98.5%', ttlSeconds: 1800, status: 'WARM' },
    { key: 'ACCOUNT_DNS_LIST', items: 45, hitRate: '97.2%', ttlSeconds: 900, status: 'WARM' },
    { key: 'RBAC_PERMISSIONS_TREE', items: 120, hitRate: '99.1%', ttlSeconds: 3600, status: 'WARM' },
    { key: 'DASHBOARD_ANALYTICS_KPI', items: 8, hitRate: '94.0%', ttlSeconds: 300, status: 'WARM' },
  ]);

  const [dbIndexes] = useState([
    { table: 'hierarchy_accounts', indexName: 'idx_accounts_owner_parent', type: 'B-TREE', status: 'OPTIMAL' },
    { table: 'hierarchy_accounts', indexName: 'idx_accounts_role_status', type: 'B-TREE', status: 'OPTIMAL' },
    { table: 'credit_transactions', indexName: 'idx_transactions_sender_receiver', type: 'B-TREE', status: 'OPTIMAL' },
    { table: 'licenses', indexName: 'idx_licenses_alphanumeric_code', type: 'HASH / UNIQUE', status: 'OPTIMAL' },
    { table: 'audit_logs', indexName: 'idx_audit_user_action_timestamp', type: 'BRIN / B-TREE', status: 'OPTIMAL' },
  ]);

  const handleInvalidateCache = (bucketKey?: string) => {
    if (bucketKey) {
      showToast(`Cache bucket [${bucketKey}] invalidado e recompilado do Banco de Dados!`);
    } else {
      showToast('Cache global (In-Memory/Redis) totalmente invalidado e purgado!');
    }
  };

  // --- 7. BACKUPS & RESTORE ---
  const [backupHistory, setBackupHistory] = useState([
    { id: 'bkp-20260729-0300', date: '29/07/2026 03:00:12', sizeMb: 142.5, type: 'AUTO_DAILY', status: 'COMPLETED' },
    { id: 'bkp-20260728-0300', date: '28/07/2026 03:00:10', sizeMb: 141.2, type: 'AUTO_DAILY', status: 'COMPLETED' },
    { id: 'bkp-20260727-0300', date: '27/07/2026 03:00:08', sizeMb: 139.8, type: 'AUTO_DAILY', status: 'COMPLETED' },
  ]);

  const [isBackupRunning, setIsBackupRunning] = useState(false);

  const handleRunManualBackup = () => {
    setIsBackupRunning(true);
    showToast('Iniciando Dump PostgreSQL (pg_dump -Fc)...');
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
      const newBkp = {
        id: `bkp-${now.getTime()}`,
        date: dateStr,
        sizeMb: 143.1,
        type: 'MANUAL_SUPERADMIN',
        status: 'COMPLETED',
      };
      setBackupHistory([newBkp, ...backupHistory]);
      setIsBackupRunning(false);
      showToast(`Backup manual ${newBkp.id} finalizado e armazenado com sucesso!`);
    }, 1200);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 text-white font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0a0a0a] via-[#20004d]/70 to-[#0a0a0a] border border-emerald-500/20 rounded-lg p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/20 px-3.5 py-1 rounded-full text-xs font-semibold text-emerald-400 mb-2 shadow-sm">
              <Sparkles size={14} />
              <span>MÓDULO 21 — SEGURANÇA, AUDITORIA & PERFORMANCE DE PRODUÇÃO</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
              <span>Painel Executivo de Produção & Hardening</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold font-mono">
                System Health: 100% ONLINE
              </span>
            </h2>
            <p className="text-gray-300 text-xs mt-1 max-w-2xl leading-relaxed">
              Supervisão contínua da infraestrutura, barramento de auditoria em tempo real, validação de tokens JWT, middlewares de isolamento hierárquico, rate limiting contra ataques e diagnósticos de latência.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#000000]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-sm shrink-0">
            <button
              onClick={handleRefreshHealth}
              disabled={isRefreshingHealth}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-white/10"
            >
              <RefreshCw size={14} className={isRefreshingHealth ? 'animate-spin' : ''} />
              <span>Diagnóstico Geral</span>
            </button>
            <button
              onClick={handleRunManualBackup}
              disabled={isBackupRunning}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-500/30 border border-white/10"
            >
              <Database size={14} />
              <span>Executar Backup DB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center bg-[#000000] p-2 rounded-lg border border-white/10 shadow-sm overflow-x-auto gap-1.5 custom-scrollbar">
        {[
          { id: 'health', label: 'Saúde da Plataforma', icon: Activity, badge: 'Live' },
          { id: 'audit', label: 'Trilha de Auditoria & Logs', icon: Terminal, badge: `${auditLogs.length}` },
          { id: 'middleware', label: 'Middleware & Hierarquia', icon: ShieldCheck, badge: 'RBAC' },
          { id: 'sessions', label: 'Sessões & JWT Tokens', icon: KeyRound, badge: `${activeSessions.length}` },
          { id: 'ratelimit', label: 'Rate Limit & Input Sanitizer', icon: ShieldAlert, badge: 'Anti-DDOS' },
          { id: 'cache_db', label: 'Cache & Índices DB', icon: Cpu, badge: '0.4ms' },
          { id: 'backup', label: 'Backup & Restore DB', icon: Database, badge: 'Daily' },
          { id: 'api_docs', label: 'APIs Endpoints (M21)', icon: FileCode, badge: 'REST' },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/30 border border-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span className="bg-white/10 text-emerald-300 text-xs px-1.5 py-0.2 rounded font-mono font-bold">
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: SAÚDE DA PLATAFORMA (PLATFORM HEALTH MONITOR) */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CARD 1: REST API */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 shadow-sm relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Server size={14} className="text-emerald-400" />
                  API Gateway & Server Node
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  {healthMetrics.apiStatus}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div className="text-3xl font-semibold text-white font-mono">{healthMetrics.apiLatencyMs} <span className="text-xs text-gray-400 font-sans">ms latência</span></div>
                <span className="text-xs text-emerald-400 font-mono font-bold">HTTP 200 OK</span>
              </div>
              <p className="text-xs text-gray-400">Express / Node.js V8 Runtime respondendo em porta 3000 com compressão gzip/brotli ativa.</p>
              <div className="pt-2 border-t border-white/5 text-xs text-gray-500 font-mono flex justify-between">
                <span>Última checagem: {healthMetrics.lastCheckTime}</span>
                <span>Uptime: 99.98%</span>
              </div>
            </div>

            {/* CARD 2: BANCO DE DADOS POSTGRESQL */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 shadow-sm relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Database size={14} className="text-blue-400" />
                  Banco de Dados PostgreSQL
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  {healthMetrics.dbStatus}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div className="text-3xl font-semibold text-white font-mono">{healthMetrics.dbLatencyMs} <span className="text-xs text-gray-400 font-sans">ms query ping</span></div>
                <span className="text-xs text-blue-400 font-mono font-bold">{healthMetrics.dbConnections}/{healthMetrics.dbMaxConnections} conns</span>
              </div>
              <p className="text-xs text-gray-400">Pool de conexões PgBouncer ativo, transações isoladas e índices B-Tree verificados.</p>
              <div className="pt-2 border-t border-white/5 text-xs text-gray-500 font-mono flex justify-between">
                <span>Chaves estrangeiras: VÁLIDAS</span>
                <span>Replicação: ATIVA</span>
              </div>
            </div>

            {/* CARD 3: GATEWAY LYNX PIX */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 shadow-sm relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Zap size={14} className="text-purple-400" />
                  Gateway Lynx PIX API
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  {healthMetrics.lynxStatus}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div className="text-3xl font-semibold text-white font-mono">{healthMetrics.lynxLatencyMs} <span className="text-xs text-gray-400 font-sans">ms webhook ping</span></div>
                <span className="text-xs text-purple-400 font-mono font-bold">Produção (SSL)</span>
              </div>
              <p className="text-xs text-gray-400">Barramento Lynx escutando notificações PIX em tempo real com renovação de autorização.</p>
              <div className="pt-2 border-t border-white/5 text-xs text-gray-500 font-mono flex justify-between">
                <span>Webhook Listener: 200 OK</span>
                <span>Ativação Instantânea: SIM</span>
              </div>
            </div>

            {/* CARD 4: CACHE ENGINE IN-MEMORY */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 shadow-sm relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Cpu size={14} className="text-amber-400" />
                  In-Memory Cache (Redis)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  {healthMetrics.cacheHitRate}% HIT
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div className="text-3xl font-semibold text-white font-mono">{healthMetrics.cacheMemoryMb} <span className="text-xs text-gray-400 font-sans">MB alocados</span></div>
                <span className="text-xs text-amber-400 font-mono font-bold">5 Buckets</span>
              </div>
              <p className="text-xs text-gray-400">Configurações, Planos e Árvore de Permissões servidos diretamente do cache para evitar queries redundantes.</p>
              <div className="pt-2 border-t border-white/5 text-xs text-gray-500 font-mono flex justify-between">
                <span>Auto-Invalidation: ATIVO</span>
                <span>Eviction Policy: LRU</span>
              </div>
            </div>

            {/* CARD 5: ARMAZENAMENTO DE UPLOADS */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 shadow-sm relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <HardDrive size={14} className="text-cyan-400" />
                  Disco & Armazenamento Uploads
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  {healthMetrics.storageUsedGb} GB / {healthMetrics.storageTotalGb} GB
                </span>
              </div>
              <div className="w-full bg-[#000000] h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${(healthMetrics.storageUsedGb / healthMetrics.storageTotalGb) * 100}%` }} />
              </div>
              <p className="text-xs text-gray-400">Sanitização rigorosa de uploads, validação MIME-type e compressão automática de logotipos em WebP.</p>
              <div className="pt-2 border-t border-white/5 text-xs text-gray-500 font-mono flex justify-between">
                <span>Livre: 85.8 GB</span>
                <span>Directory: /var/www/uploads</span>
              </div>
            </div>

            {/* CARD 6: FILA DE PROCESSAMENTO CRON */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 shadow-sm relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} className="text-pink-400" />
                  Fila de Tarefas Cron & Workers
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  0 Pendências
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div className="text-3xl font-semibold text-white font-mono">4 <span className="text-xs text-gray-400 font-sans">Workers Ativos</span></div>
                <span className="text-xs text-pink-400 font-mono font-bold">100% Livre</span>
              </div>
              <p className="text-xs text-gray-400">Rotinas automatizadas de verificação de expiração de licenças, relatórios e dumps de backup diários.</p>
              <div className="pt-2 border-t border-white/5 text-xs text-gray-500 font-mono flex justify-between">
                <span>Próximo Backup: 03:00 BRT</span>
                <span>Status Workers: IDLE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TRILHA DE AUDITORIA COMPLETA (FULL AUDIT TRAIL LOGS) */}
      {activeTab === 'audit' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Terminal size={18} className="text-emerald-400" />
                <span>Trilha Completa de Auditoria Multi-Tenant</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Registros imutáveis de cada ação crítica no sistema com metadados detalhados.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar usuário, IP, UUID, ação..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full bg-[#000000] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todas as Ações (16 Categorias)</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
                <option value="CADASTRO">CADASTRO</option>
                <option value="EDICAO">EDICAO</option>
                <option value="EXCLUSAO_LOGICA">EXCLUSAO_LOGICA</option>
                <option value="TRANSFERENCIA_CREDITOS">TRANSFERENCIA_CREDITOS</option>
                <option value="COMPRA_CREDITOS">COMPRA_CREDITOS</option>
                <option value="COMPRA_LICENCA">COMPRA_LICENCA</option>
                <option value="RENOVACAO">RENOVACAO</option>
                <option value="BLOQUEIO">BLOQUEIO</option>
                <option value="DESBLOQUEIO">DESBLOQUEIO</option>
                <option value="TROCA_SENHA">TROCA_SENHA</option>
                <option value="ALTERACAO_CONFIG">ALTERACAO_CONFIG</option>
                <option value="CADASTRO_DNS">CADASTRO_DNS</option>
                <option value="REMOCAO_DNS">REMOCAO_DNS</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 font-mono uppercase text-xs">
                  <th className="p-3">UUID Log</th>
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Usuário / Papel</th>
                  <th className="p-3">IP / Dispositivo</th>
                  <th className="p-3">Ação Registrada</th>
                  <th className="p-3">Resultado</th>
                  <th className="p-3">Detalhes do Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.uuid} className="hover:bg-white/5">
                    <td className="p-3 text-gray-500 text-xs">{log.uuid}</td>
                    <td className="p-3 text-gray-300 whitespace-nowrap">
                      {log.date} <span className="text-gray-500">{log.time}</span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white">{log.userEmail}</div>
                      <div className="text-xs text-purple-400">{log.role}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-emerald-400 font-bold">{log.ip}</div>
                      <div className="text-xs text-gray-500 font-sans truncate max-w-[140px]">{log.device}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          log.result === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : log.result === 'BLOCKED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-gray-300 max-w-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MIDDLEWARE DE SEGURANÇA & ISOLAMENTO HIERÁRQUICO */}
      {activeTab === 'middleware' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>Middleware de Segurança REST API</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Validação em tempo real dos 5 filtros de segurança aplicados a todas as requisições HTTP.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 space-y-4">
              <span className="font-bold text-white text-sm block">Configurar Requisição de Teste</span>

              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 block mb-1">Papel do Usuário Solicitante</label>
                  <select
                    value={middlewareSim.userRole}
                    onChange={(e) => setMiddlewareSim({ ...middlewareSim, userRole: e.target.value })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Acesso Global)</option>
                    <option value="PROVEDOR">PROVEDOR (Dono do Ecossistema)</option>
                    <option value="REVENDA">REVENDA (Filho do Provedor)</option>
                    <option value="SUBREVENDA">SUBREVENDA (Filho da Revenda)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Status do Token JWT</label>
                  <select
                    value={middlewareSim.jwtValid ? 'VALID' : 'INVALID'}
                    onChange={(e) => setMiddlewareSim({ ...middlewareSim, jwtValid: e.target.value === 'VALID' })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                  >
                    <option value="VALID">JWT Válido (Assinado com Segredo Server-Side)</option>
                    <option value="INVALID">JWT Inválido / Expirado / Assinatura Adulterada</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Status da Conta Solicitante</label>
                  <select
                    value={middlewareSim.accountStatus}
                    onChange={(e) => setMiddlewareSim({ ...middlewareSim, accountStatus: e.target.value })}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="ACTIVE">ACTIVE (Ativo e Autorizado)</option>
                    <option value="BLOCKED">BLOCKED (Bloqueado por Inadimplência ou Segurança)</option>
                  </select>
                </div>

                <button
                  onClick={handleRunMiddlewareCheck}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-lg shadow-sm shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  <span>Submeter ao Pipeline de Middleware</span>
                </button>
              </div>
            </div>

            {/* RESULTS VIEW */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-5 space-y-4">
              <span className="font-bold text-white text-sm block">Resultado do Pipeline de Segurança</span>

              {simResult ? (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-lg border flex items-center gap-3 ${
                      simResult.allowed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    {simResult.allowed ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    <div>
                      <div className="font-extrabold text-sm">
                        {simResult.allowed ? 'REQUISIÇÃO APROVADA (HTTP 200 OK)' : 'REQUISIÇÃO BLOQUEADA (HTTP 403 FORBIDDEN)'}
                      </div>
                      <div className="text-xs opacity-80">
                        {simResult.allowed
                          ? 'Todos os 5 filtros do middleware foram satisfeitos com sucesso.'
                          : 'A requisição falhou em uma ou mais camadas de segurança.'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    {simResult.pipelineSteps.map((step, idx) => (
                      <div key={idx} className="bg-[#000000] p-2.5 rounded-lg border border-white/5 text-xs flex items-start gap-2.5">
                        {step.passed ? (
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-white">{step.name}</div>
                          <div className="text-xs text-gray-400 font-mono">{step.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500 text-xs">
                  <ShieldCheck size={36} className="mb-2 text-gray-600" />
                  <span>Aguardando submissão de teste...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SESSÕES & REFRESH TOKENS */}
      {activeTab === 'sessions' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <KeyRound size={18} className="text-emerald-400" />
                <span>Gestão de Sessões Ativas e Revogação JWT</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Sessões em tempo real com renovação via Refresh Token e encerramento forçado.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <label className="text-gray-300 font-bold block">Sessões Simultâneas Permitidas por Conta</label>
              <input
                type="number"
                value={sessionMaxConcurrent}
                onChange={(e) => setSessionMaxConcurrent(parseInt(e.target.value) || 1)}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <label className="text-gray-300 font-bold block">Logout Automático por Inatividade (Minutos)</label>
              <input
                type="number"
                value={inactivityAutoLogoutMinutes}
                onChange={(e) => setInactivityAutoLogoutMinutes(parseInt(e.target.value) || 10)}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 font-mono uppercase text-xs">
                  <th className="p-3">Session ID</th>
                  <th className="p-3">Usuário</th>
                  <th className="p-3">IP / Dispositivo</th>
                  <th className="p-3">Início Login</th>
                  <th className="p-3">Última Atividade</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {activeSessions.map((sess) => (
                  <tr key={sess.sessionId} className="hover:bg-white/5">
                    <td className="p-3 text-emerald-400 font-bold">{sess.sessionId}</td>
                    <td className="p-3">
                      <div className="text-white font-bold">{sess.userEmail}</div>
                      <div className="text-xs text-purple-400">{sess.role}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-white">{sess.ip}</div>
                      <div className="text-xs text-gray-500 font-sans">{sess.device}</div>
                    </td>
                    <td className="p-3 text-gray-300">{sess.loginTime}</td>
                    <td className="p-3 text-gray-400">{sess.lastActive}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          sess.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {sess.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevokeSession(sess.sessionId)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-sans font-bold cursor-pointer border border-red-500/30"
                        >
                          Revogar Sessão
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

      {/* SUB-TAB 5: RATE LIMIT & INPUT SANITIZER */}
      {activeTab === 'ratelimit' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldAlert size={18} className="text-emerald-400" />
              <span>Proteção Anti-Abuso (Rate Limiting & Sanitização XSS/SQLi)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Barreira defensiva contra ataques bruteforce, intrusão e varredura automatizada de portas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Limite IP Não Autenticado (Req/Min)</label>
              <input
                type="number"
                value={rateLimitConfig.maxRequestsPerMinPublic}
                onChange={(e) => setRateLimitConfig({ ...rateLimitConfig, maxRequestsPerMinPublic: parseInt(e.target.value) || 60 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Limite Usuário Autenticado (Req/Min)</label>
              <input
                type="number"
                value={rateLimitConfig.maxRequestsPerMinAuthenticated}
                onChange={(e) => setRateLimitConfig({ ...rateLimitConfig, maxRequestsPerMinAuthenticated: parseInt(e.target.value) || 300 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-gray-300 font-semibold block">Tempo de Bloqueio por Excesso (Minutos)</label>
              <input
                type="number"
                value={rateLimitConfig.blockDurationMinutes}
                onChange={(e) => setRateLimitConfig({ ...rateLimitConfig, blockDurationMinutes: parseInt(e.target.value) || 15 })}
                className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => showToast('Configurações de Rate Limiting salvas!')}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-lg shadow-sm cursor-pointer"
            >
              Salvar Rate Limits
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: CACHE & ÍNDICES DB */}
      {activeTab === 'cache_db' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Cpu size={18} className="text-emerald-400" />
                <span>Cache em Memória & Otimização de Índices PostgreSQL</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Invalidação seletiva de cache e auditoria de índices de banco de dados.</p>
            </div>
            <button
              onClick={() => handleInvalidateCache()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Trash2 size={14} />
              <span>Purgar Todo o Cache</span>
            </button>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Buckets do Cache em Memória</span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
              {cacheBuckets.map((bucket) => (
                <div key={bucket.key} className="bg-[#000000] border border-white/10 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">{bucket.key}</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">{bucket.hitRate}</span>
                  </div>
                  <div className="text-xs text-gray-400 font-sans">
                    Itens: {bucket.items} | TTL: {bucket.ttlSeconds}s
                  </div>
                  <button
                    onClick={() => handleInvalidateCache(bucket.key)}
                    className="w-full mt-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs cursor-pointer"
                  >
                    Invalidar Bucket
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Índices de Performance Criados no PostgreSQL</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase text-xs">
                    <th className="p-2.5">Tabela Target</th>
                    <th className="p-2.5">Nome do Índice</th>
                    <th className="p-2.5">Tipo de Índice</th>
                    <th className="p-2.5">Status de Execução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dbIndexes.map((idx, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="p-2.5 text-white font-bold">{idx.table}</td>
                      <td className="p-2.5 text-purple-400">{idx.indexName}</td>
                      <td className="p-2.5 text-gray-300">{idx.type}</td>
                      <td className="p-2.5 text-emerald-400 font-bold">{idx.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: BACKUP & RESTORE DB */}
      {activeTab === 'backup' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Database size={18} className="text-emerald-400" />
                <span>Gestor de Backups PostgreSQL e Restauração Instantânea</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">Histórico completo de snapshots e rotinas de backup comprimido.</p>
            </div>
            <button
              onClick={handleRunManualBackup}
              disabled={isBackupRunning}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Database size={14} />
              <span>{isBackupRunning ? 'Gerando Dump...' : 'Gerar Backup Manual Agora'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase text-xs">
                  <th className="p-3">ID Backup</th>
                  <th className="p-3">Data de Criação</th>
                  <th className="p-3">Tamanho</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {backupHistory.map((bkp) => (
                  <tr key={bkp.id} className="hover:bg-white/5">
                    <td className="p-3 text-emerald-400 font-bold">{bkp.id}</td>
                    <td className="p-3 text-white">{bkp.date}</td>
                    <td className="p-3 text-gray-300">{bkp.sizeMb} MB</td>
                    <td className="p-3 text-purple-400">{bkp.type}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold border border-emerald-500/30">
                        {bkp.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Deseja restaurar o banco a partir de ${bkp.id}?`)) {
                            showToast(`Banco de Dados restaurado para o estado de ${bkp.date}!`);
                          }
                        }}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded font-sans text-xs cursor-pointer border border-white/10"
                      >
                        Restaurar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 8: API ENDPOINTS DOCUMENTATION FOR MODULE 21 */}
      {activeTab === 'api_docs' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileCode size={18} className="text-emerald-400" />
              <span>Endpoints REST API do Módulo 21 — Segurança, Auditoria e Performance</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Serviços REST para consulta de logs, métricas de saúde, gerenciamento de sessões e backups.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {[
              { method: 'GET', endpoint: '/api/v1/health', desc: 'Diagnóstico de saúde da API, DB, Lynx, Cache e Disco' },
              { method: 'GET', endpoint: '/api/v1/audit/logs', desc: 'Consulta filtrada da trilha de auditoria e logs do sistema' },
              { method: 'GET', endpoint: '/api/v1/security/sessions', desc: 'Lista todas as sessões ativas e permite revogação de tokens JWT' },
              { method: 'POST', endpoint: '/api/v1/security/sessions/revoke', desc: 'Revoga forçadamente um JWT Session ID específico' },
              { method: 'POST', endpoint: '/api/v1/cache/clear', desc: 'Invalida buckets específicos de cache In-Memory / Redis' },
              { method: 'POST', endpoint: '/api/v1/backup/run', desc: 'Executa dump de backup assíncrono do banco PostgreSQL' },
            ].map((api, idx) => (
              <div key={idx} className="bg-[#000000] border border-white/10 rounded-lg p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      api.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {api.method}
                  </span>
                  <span className="text-white font-bold">{api.endpoint}</span>
                </div>
                <span className="text-gray-400 font-sans text-xs">{api.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
