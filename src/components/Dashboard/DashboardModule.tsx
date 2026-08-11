import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Coins,
  Building2,
  Globe,
  KeyRound,
  ShoppingBag,
  TrendingUp,
  BarChart2,
  PieChart,
  FileText,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  DollarSign,
  Activity,
  Award,
  Sliders,
  X,
  Printer,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Eye,
  RefreshCw,
  GitFork,
  Check,
  Receipt
} from 'lucide-react';
import {
  AdminUser,
  HierarchyAccount,
  CreditBalance,
  CreditTransaction,
  ProviderItem,
  ServerCodeItem,
  LicenseItem,
  LicensePlan,
  ProviderPlan,
  ProviderSubscription,
  AccountDns,
  EndUserItem,
  CreditOrder
} from '../AdminPanel/AdminPanel';

interface DashboardModuleProps {
  currentUser: AdminUser | null;
  accounts: HierarchyAccount[];
  balances: CreditBalance[];
  transactions: CreditTransaction[];
  providers: ProviderItem[];
  serverCodes: ServerCodeItem[];
  licenses: LicenseItem[];
  plans: LicensePlan[];
  providerPlans: ProviderPlan[];
  providerSubscriptions: ProviderSubscription[];
  accountDnsList: AccountDns[];
  endUsers: EndUserItem[];
  creditOrders?: CreditOrder[];
  showToast: (msg: string) => void;
  onRenewLicense?: (license: LicenseItem) => void;
}

export type TimeFilterPeriod = 'HOJE' | 'ONTEM' | '7_DIAS' | '30_DIAS' | '90_DIAS' | 'PERSONALIZADO';
export type ReportType =
  | 'USUARIOS'
  | 'LICENCAS'
  | 'CREDITOS'
  | 'ASSINATURAS'
  | 'DNS'
  | 'PAGAMENTOS'
  | 'COMPRAS'
  | 'DISPOSITIVOS';

// Helper to recursively collect all descendant account IDs for scope filtering (parent_id)
function getAllDescendants(accounts: HierarchyAccount[], startId: string): Set<string> {
  const result = new Set<string>();
  result.add(startId);
  const queue = [startId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const children = accounts.filter((a) => a.parentId === curr);
    for (const child of children) {
      if (!result.has(child.id)) {
        result.add(child.id);
        queue.push(child.id);
      }
    }
  }
  return result;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  currentUser,
  accounts,
  balances,
  transactions,
  providers,
  serverCodes,
  licenses,
  plans,
  providerPlans,
  providerSubscriptions,
  accountDnsList,
  endUsers,
  creditOrders = [],
  showToast,
  onRenewLicense,
}) => {
  // Navigation & View Mode
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'charts' | 'reports' | 'alerts' | 'apis'>('overview');

  // Time & Date Filter State
  const [timeFilter, setTimeFilter] = useState<TimeFilterPeriod>('30_DIAS');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-07-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-07-29');

  // Global Search Filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Report Module Selection & Pagination State
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('USUARIOS');
  const [reportPage, setReportPage] = useState<number>(1);
  const [reportPageSize] = useState<number>(10);

  // PDF Preview Modal State
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState<boolean>(false);

  // Calculate scope account IDs based on hierarchy (parent_id isolation)
  const accessibleAccountIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    if (currentUser.role === 'SUPER_ADMIN') {
      return new Set(accounts.map((a) => a.id));
    }
    return getAllDescendants(accounts, currentUser.accountId);
  }, [currentUser, accounts]);

  // Scope Filtered Datasets
  const scopedAccounts = useMemo(() => {
    return accounts.filter((a) => accessibleAccountIds.has(a.id));
  }, [accounts, accessibleAccountIds]);

  const scopedEndUsers = useMemo(() => {
    if (!currentUser) return [];
    return endUsers.filter((u) => {
      if (u.isDeleted) return false;
      if (currentUser.role === 'SUPER_ADMIN') return true;
      if (accessibleAccountIds.has(u.providerId)) return true;
      if (u.resellerId && accessibleAccountIds.has(u.resellerId)) return true;
      if (u.originId && accessibleAccountIds.has(u.originId)) return true;
      return false;
    });
  }, [endUsers, currentUser, accessibleAccountIds]);

  const scopedLicenses = useMemo(() => {
    if (!currentUser) return [];
    return licenses.filter((l) => {
      if (currentUser.role === 'SUPER_ADMIN') return true;
      if (accessibleAccountIds.has(l.providerId)) return true;
      if (l.resellerId && accessibleAccountIds.has(l.resellerId)) return true;
      return false;
    });
  }, [licenses, currentUser, accessibleAccountIds]);

  const scopedTransactions = useMemo(() => {
    if (!currentUser) return [];
    return transactions.filter((tx) => {
      if (currentUser.role === 'SUPER_ADMIN') return true;
      const isFrom = tx.fromOwnerId ? accessibleAccountIds.has(tx.fromOwnerId) : false;
      const isTo = accessibleAccountIds.has(tx.toOwnerId);
      return isFrom || isTo;
    });
  }, [transactions, currentUser, accessibleAccountIds]);

  const scopedDnsList = useMemo(() => {
    if (!currentUser) return [];
    return accountDnsList.filter((d) => {
      if (currentUser.role === 'SUPER_ADMIN') return true;
      return accessibleAccountIds.has(d.ownerId);
    });
  }, [accountDnsList, currentUser, accessibleAccountIds]);

  const scopedOrders = useMemo(() => {
    if (!currentUser) return [];
    return creditOrders.filter((o) => {
      if (currentUser.role === 'SUPER_ADMIN') return true;
      return accessibleAccountIds.has(o.providerId);
    });
  }, [creditOrders, currentUser, accessibleAccountIds]);

  // Search Filtered End-Users
  const searchFilteredEndUsers = useMemo(() => {
    if (!searchQuery.trim()) return scopedEndUsers;
    const q = searchQuery.toLowerCase();
    return scopedEndUsers.filter((u) => {
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.licenseUuid && u.licenseUuid.toLowerCase().includes(q)) ||
        false
      );
    });
  }, [scopedEndUsers, searchQuery]);

  // Compute Role-Based KPIs
  const roleMetrics = useMemo(() => {
    if (!currentUser) return null;

    const role = currentUser.role;

    if (role === 'SUPER_ADMIN') {
      const qtdProvedores = accounts.filter((a) => a.ownerType === 'PROVEDOR').length;
      const qtdRevendas = accounts.filter((a) => a.ownerType === 'REVENDA').length;
      const qtdSubRevendas = accounts.filter((a) => a.ownerType === 'SUBREVENDA').length;
      const totalUsuarios = scopedEndUsers.length;
      const licAtivas = scopedLicenses.filter((l) => l.status === 'ATIVA').length;
      const licExpiradas = scopedLicenses.filter((l) => l.status === 'EXPIRADA').length;

      const totalCreditosVendidos = transactions
        .filter((t) => t.transactionType === 'CREDIT_PURCHASE')
        .reduce((sum, t) => sum + t.amount, 0);

      const receitaCreditos = creditOrders
        .filter((o) => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + o.amount, 0);

      const receitaMensalidades = providerSubscriptions
        .filter((s) => s.status === 'ATIVA')
        .reduce((sum, s) => sum + s.monthlyPrice, 0);

      const assinaturasAtivas = providerSubscriptions.filter((s) => s.status === 'ATIVA').length;
      const assinaturasVencidas = providerSubscriptions.filter((s) => s.status === 'INADIMPLENTE').length;

      return {
        role,
        qtdProvedores,
        qtdRevendas,
        qtdSubRevendas,
        totalUsuarios,
        licAtivas,
        licExpiradas,
        totalCreditosVendidos,
        receitaCreditos,
        receitaMensalidades,
        receitaTotal: receitaCreditos + receitaMensalidades,
        assinaturasAtivas,
        assinaturasVencidas,
      };
    }

    if (role === 'PROVEDOR') {
      const sub = providerSubscriptions.find((s) => s.providerId === currentUser.accountId) || {
        planName: 'Enterprise Flex',
        maxActiveUsers: 2000,
        nextDueDate: '15/08/2026',
      };
      const usuariosAtivos = scopedEndUsers.filter((u) => u.status === 'Ativo').length;
      const limiteContratado = sub.maxActiveUsers;
      const espacoDisponivel = Math.max(0, limiteContratado - usuariosAtivos);
      const licAtivas = scopedLicenses.filter((l) => l.status === 'ATIVA').length;
      const licExpiradas = scopedLicenses.filter((l) => l.status === 'EXPIRADA').length;
      const dnsCadastradas = scopedDnsList.length;

      return {
        role,
        planoContratado: sub.planName,
        usuariosAtivos,
        limiteContratado,
        espacoDisponivel,
        licAtivas,
        licExpiradas,
        dnsCadastradas,
        proximoVencimento: sub.nextDueDate,
      };
    }

    if (role === 'REVENDA') {
      const bal = balances.find((b) => b.ownerId === currentUser.accountId)?.balance || 0;
      const licCriadas = scopedLicenses.length;
      const licRenovadas = transactions.filter(
        (t) => t.fromOwnerId === currentUser.accountId && t.transactionType === 'LICENSE_RENEWAL'
      ).length;
      const usuariosAtivos = scopedEndUsers.filter((u) => u.status === 'Ativo').length;
      const subRevendas = accounts.filter((a) => a.parentId === currentUser.accountId && a.ownerType === 'SUBREVENDA').length;
      const dnsCadastradas = scopedDnsList.length;

      return {
        role,
        saldoCreditos: bal,
        licCriadas,
        licRenovadas,
        usuariosAtivos,
        subRevendas,
        dnsCadastradas,
      };
    }

    if (role === 'SUBREVENDA') {
      const bal = balances.find((b) => b.ownerId === currentUser.accountId)?.balance || 0;
      const usuariosAtivos = scopedEndUsers.filter((u) => u.status === 'Ativo').length;
      const licTotais = scopedLicenses.length;
      const dnsCadastradas = scopedDnsList.length;
      const ultimasAtivacoes = scopedLicenses.filter((l) => l.status === 'ATIVA').length;

      return {
        role,
        saldo: bal,
        usuarios: usuariosAtivos,
        licencas: licTotais,
        dns: dnsCadastradas,
        ultimasAtivacoes,
      };
    }

    // USUARIO_FINAL
    const myEndUser = scopedEndUsers[0] || {
      username: currentUser.name,
      status: 'Ativo',
      authorizedDns: [],
      lastAccess: '29/07/2026 10:15',
    };
    const myLic = scopedLicenses[0] || {
      status: 'ATIVA',
      planName: 'Plano Anual Premium 365d',
      expiresAt: '31/12/2026',
      uuid: '123e4567-e89b-12d3-a456-426614174000',
    };
    const myDns = scopedDnsList[0]?.dnsUrl || 'http://play.streamflix.tv:8080';

    return {
      role,
      username: myEndUser.username,
      status: myEndUser.status,
      plano: myLic.planName || 'Anual Premium',
      validade: myLic.expiresAt || '31/12/2026',
      deviceId: '84:A9:38:C2:F1:00',
      dnsUtilizada: myDns,
      ultimoAcesso: myEndUser.lastAccess,
      historicoComprasCount: 3,
    };
  }, [currentUser, accounts, scopedEndUsers, scopedLicenses, balances, transactions, providerSubscriptions, scopedDnsList, creditOrders]);

  // Top Lists Calculations
  const topLists = useMemo(() => {
    // 1. Revendas com mais licenças
    const revendaMap = new Map<string, { name: string; count: number }>();
    scopedLicenses.forEach((l) => {
      if (l.resellerId && l.resellerName) {
        const curr = revendaMap.get(l.resellerId) || { name: l.resellerName, count: 0 };
        curr.count += 1;
        revendaMap.set(l.resellerId, curr);
      }
    });
    const topRevendas = Array.from(revendaMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 2. Provedores com mais usuários
    const providerMap = new Map<string, { name: string; count: number }>();
    scopedEndUsers.forEach((u) => {
      if (u.providerId && u.providerName) {
        const curr = providerMap.get(u.providerId) || { name: u.providerName, count: 0 };
        curr.count += 1;
        providerMap.set(u.providerId, curr);
      }
    });
    const topProvedores = Array.from(providerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Servidor (DNS) mais utilizadas
    const dnsMap = new Map<string, { url: string; code: string; count: number }>();
    scopedDnsList.forEach((d) => {
      const curr = dnsMap.get(d.dnsUrl) || { url: d.dnsUrl, code: "DNS", count: 0 };
      curr.count += 1;
      dnsMap.set(d.dnsUrl, curr);
    });
    const topDns = Array.from(dnsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Planos mais vendidos
    const planMap = new Map<string, { name: string; count: number }>();
    scopedLicenses.forEach((l) => {
      const name = l.planName || `${l.days || 30} Dias`;
      const curr = planMap.get(name) || { name, count: 0 };
      curr.count += 1;
      planMap.set(name, curr);
    });
    const topPlanos = Array.from(planMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      topRevendas,
      topProvedores,
      topDns,
      topPlanos,
    };
  }, [scopedLicenses, scopedEndUsers, scopedDnsList]);

  // Alerts Computations
  const alertsList = useMemo(() => {
    const list: Array<{ id: string; type: string; title: string; desc: string; severity: 'high' | 'medium' | 'low' }> = [];

    // 1. Licenças Vencendo (<= 7 dias)
    const expiringLicenses = scopedLicenses.filter((l) => {
      if (l.status !== 'ATIVA') return false;
      const parts = l.expiresAt.split('/');
      if (parts.length === 3) {
        const expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const today = new Date();
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 15;
      }
      return false;
    });

    if (expiringLicenses.length > 0) {
      list.push({
        id: 'alt-lic-expiring',
        type: 'Licenças Vencendo',
        title: `${expiringLicenses.length} Licença(s) Vencendo nos Próximos Dias`,
        desc: `Verifique os usuários ${expiringLicenses.slice(0, 3).map((l) => l.userName).join(', ')} para garantir a renovação do serviço.`,
        severity: 'high',
      });
    }

    // 2. Assinaturas Provedor Vencendo / Inadimplentes
    const delinquentSubs = providerSubscriptions.filter((s) => s.status === 'INADIMPLENTE');
    if (delinquentSubs.length > 0) {
      list.push({
        id: 'alt-sub-delinquent',
        type: 'Assinaturas Vencendo',
        title: `${delinquentSubs.length} Provedor(es) com Assinatura Inadimplente`,
        desc: `Provedor(es): ${delinquentSubs.map((s) => s.providerName).join(', ')}. Notificação de suspensão enviada.`,
        severity: 'high',
      });
    }

    // 3. Créditos Baixos (< 50 CR)
    const lowCreditAccounts = balances.filter((b) => b.balance < 50 && accessibleAccountIds.has(b.ownerId));
    if (lowCreditAccounts.length > 0) {
      list.push({
        id: 'alt-low-credits',
        type: 'Créditos Baixos',
        title: `${lowCreditAccounts.length} Conta(s) com Saldo de Créditos Abaixo de 50 CR`,
        desc: `Contas afetadas: ${lowCreditAccounts.map((b) => b.ownerName).join(', ')}. Sugira a compra via Lynx PIX.`,
        severity: 'medium',
      });
    }

    // 4. Pagamentos Pendentes
    const pendingOrders = creditOrders.filter((o) => o.paymentStatus === 'PENDING' && accessibleAccountIds.has(o.providerId));
    if (pendingOrders.length > 0) {
      list.push({
        id: 'alt-pending-payments',
        type: 'Pagamentos Pendentes',
        title: `${pendingOrders.length} Pedido(s) Lynx PIX Aguardando Pagamento`,
        desc: `Valor acumulado em aberto: R$ ${pendingOrders.reduce((sum, o) => sum + o.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        severity: 'low',
      });
    }

    // 5. Dispositivos Inativos
    const inactiveUsers = scopedEndUsers.filter((u) => u.lastAccess === 'Nunca' || u.status === 'Bloqueado');
    if (inactiveUsers.length > 0) {
      list.push({
        id: 'alt-inactive-devices',
        type: 'Dispositivos Inativos',
        title: `${inactiveUsers.length} Dispositivo(s) Inativos ou Bloqueados`,
        desc: `Usuários finais sem conexões ativas recentes no código de servidor configurado.`,
        severity: 'low',
      });
    }

    return list;
  }, [scopedLicenses, providerSubscriptions, balances, accessibleAccountIds, creditOrders, scopedEndUsers]);

  // Report Data Stream Computations
  const activeReportData = useMemo(() => {
    switch (selectedReportType) {
      case 'USUARIOS':
        return scopedEndUsers.map((u) => ({
          col1: u.name,
          col2: u.username,
          col3: u.authorizedDns?.length + " DNS",
          col4: u.status,
          col5: u.providerName,
          col6: u.resellerName || 'Direto Provedor',
          col7: u.createdAt,
          col8: u.lastAccess,
        }));
      case 'LICENCAS':
        return scopedLicenses.map((l) => ({
          col1: l.uuid.slice(0, 8) + '...',
          col2: l.userName,
          col3: l.planName || '30 Dias',
          col4: l.status,
          col5: l.providerName,
          col6: l.resellerName || 'Direto',
          col7: l.createdAt,
          col8: l.expiresAt,
        }));
      case 'CREDITOS':
        return scopedTransactions.map((t) => ({
          col1: t.transactionUuid.slice(0, 8) + '...',
          col2: t.fromOwnerName,
          col3: t.toOwnerName,
          col4: `${t.amount} CR`,
          col5: t.transactionType,
          col6: t.description,
          col7: t.createdAt,
          col8: 'Concluído',
        }));
      case 'ASSINATURAS':
        return providerSubscriptions.map((s) => ({
          col1: s.providerName,
          col2: s.planName,
          col3: `${s.maxActiveUsers} Usuários`,
          col4: `R$ ${s.monthlyPrice.toFixed(2)}`,
          col5: s.status,
          col6: s.nextDueDate,
          col7: s.createdAt,
          col8: 'Ativação Manual',
        }));
      case 'DNS':
        return scopedDnsList.map((d) => ({
          col1: d.dnsUrl,
          col2: "Ativo",
          col3: d.ownerName,
          col4: d.ownerType,
          col5: d.status,
          col6: d.notes || '-',
          col7: d.createdAt,
          col8: 'Ativo',
        }));
      case 'PAGAMENTOS':
        return scopedOrders.map((o) => ({
          col1: o.orderUuid.slice(0, 8) + '...',
          col2: o.providerName,
          col3: `${o.credits} CR`,
          col4: `R$ ${o.amount.toFixed(2)}`,
          col5: o.paymentStatus,
          col6: o.paymentMethod,
          col7: o.createdAt,
          col8: o.gatewayTransactionId,
        }));
      case 'COMPRAS':
        return scopedOrders
          .filter((o) => o.paymentStatus === 'PAID')
          .map((o) => ({
            col1: o.orderUuid,
            col2: o.providerName,
            col3: `${o.credits} CR`,
            col4: `R$ ${o.amount.toFixed(2)}`,
            col5: 'CONFIRMADO_LYNX',
            col6: 'PIX Instantâneo',
            col7: o.createdAt,
            col8: 'Ativado em DB',
          }));
      case 'DISPOSITIVOS':
        return scopedEndUsers.map((u) => ({
          col1: `DEV-${u.id}`,
          col2: u.username,
          col3: u.authorizedDns?.length + " DNS",
          col4: u.status === 'Ativo' ? 'CONECTADO' : 'DESCONECTADO',
          col5: u.maxDevicesAllowed ? `${u.maxDevicesAllowed} Max Devices` : '1 Device',
          col6: u.deviceLockEnabled ? 'LOCK_ATIVO' : 'LOCK_LIVRE',
          col7: u.lastAccess,
          col8: 'Android TV / FireTV',
        }));
      default:
        return [];
    }
  }, [selectedReportType, scopedEndUsers, scopedLicenses, scopedTransactions, providerSubscriptions, scopedDnsList, scopedOrders]);

  // Paginated Report Rows
  const paginatedReportRows = useMemo(() => {
    const start = (reportPage - 1) * reportPageSize;
    return activeReportData.slice(start, start + reportPageSize);
  }, [activeReportData, reportPage, reportPageSize]);

  const totalReportPages = Math.ceil(activeReportData.length / reportPageSize) || 1;

  // Export File Generators
  const handleExportCsv = () => {
    if (activeReportData.length === 0) {
      showToast('Nenhum dado disponível para exportar.');
      return;
    }
    const headers = ['Coluna 1', 'Coluna 2', 'Coluna 3', 'Coluna 4', 'Coluna 5', 'Coluna 6', 'Data', 'Status'];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...activeReportData.map((e) => Object.values(e).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_${selectedReportType.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Relatório ${selectedReportType} exportado com sucesso em CSV!`);
  };

  const handleExportExcel = () => {
    if (activeReportData.length === 0) {
      showToast('Nenhum dado disponível para exportar.');
      return;
    }
    // Formatted CSV with UTF-8 BOM for Microsoft Excel compatibility
    const headers = ['Identificador/Nome', 'Detalhe/Usuário', 'Código/Pacote', 'Status/Valor', 'Proprietário/Escopo', 'Origem/Notas', 'Data Registro', 'Observação'];
    const rowStrings = activeReportData.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(';')
    );
    const content = '\uFEFF' + [headers.join(';'), ...rowStrings].join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_${selectedReportType.toLowerCase()}_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Relatório ${selectedReportType} gerado em formato Excel com codificação UTF-8!`);
  };

  const handleExportPdf = () => {
    setShowPdfPreviewModal(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 text-white font-sans">
      {/* Top Banner: Context & Role Scope Info */}
      <div className="bg-gradient-to-r from-[#0a0a0a] via-[#1c004d]/60 to-[#0a0a0a] border border-white/10 rounded-lg p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6A00FF]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#6A00FF]/25 border border-white/10 px-3.5 py-1 rounded-full text-xs font-semibold text-gray-300 mb-2 shadow-sm">
              <BarChart2 size={14} />
              <span>MÓDULO 19 — DASHBOARD INTELIGENTE & RELATÓRIOS MULTI-TENANT</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
              <span>Visão Executiva & Indicadores de Desempenho</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                Escopo: {currentUser?.role}
              </span>
            </h2>
            <p className="text-gray-300 text-xs mt-1 max-w-2xl leading-relaxed">
              Exibição isolada por hierarquia (<code className="text-gray-300 font-mono">parent_id</code>). Métricas em tempo real, rankings de crescimento, alertas diagnósticos e módulo de exportação em múltiplos formatos.
            </p>
          </div>

          {/* Quick Time Period Selector */}
          <div className="bg-[#000000]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg flex flex-wrap items-center gap-2 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mr-1">Período:</span>
            {(['HOJE', 'ONTEM', '7_DIAS', '30_DIAS', '90_DIAS', 'PERSONALIZADO'] as TimeFilterPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setTimeFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeFilter === p
                    ? 'bg-[#6A00FF] text-white shadow-sm shadow-[#6A00FF]/40 border border-white/10'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {p === 'HOJE'
                  ? 'Hoje'
                  : p === 'ONTEM'
                  ? 'Ontem'
                  : p === '7_DIAS'
                  ? '7 Dias'
                  : p === '30_DIAS'
                  ? '30 Dias'
                  : p === '90_DIAS'
                  ? '90 Dias'
                  : 'Personalizado'}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Picker Inputs if Personalizado */}
        {timeFilter === 'PERSONALIZADO' && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Data Inicial:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Data Final:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-[#000000] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <button
              onClick={() => showToast(`Filtro aplicado de ${customStartDate} até ${customEndDate}`)}
              className="px-3.5 py-1.5 bg-[#6A00FF] hover:bg-[#801aff] text-white font-sans font-bold rounded-lg shadow-sm cursor-pointer"
            >
              Aplicar Intervalo
            </button>
          </div>
        )}
      </div>

      {/* Subtab Navigation Bar */}
      <div className="flex items-center bg-[#000000] p-2 rounded-lg border border-white/10 shadow-sm overflow-x-auto gap-2">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'overview'
              ? 'bg-white text-black shadow-sm border border-white/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard size={15} />
          <span>Dashboard & KPIs ({currentUser?.role})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('charts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'charts'
              ? 'bg-white text-black shadow-sm border border-white/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <TrendingUp size={15} />
          <span>Gráficos & Análises Mensais</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'reports'
              ? 'bg-white text-black shadow-sm border border-white/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText size={15} />
          <span>Módulo de Relatórios (CSV/Excel/PDF)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'alerts'
              ? 'bg-white text-black shadow-sm border border-white/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell size={15} />
          <span>Alertas & Diagnósticos ({alertsList.length})</span>
          {alertsList.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.2 rounded-full font-semibold animate-pulse">
              {alertsList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('apis')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'apis'
              ? 'bg-white text-black shadow-sm border border-white/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders size={15} />
          <span>Endpoints REST API Dashboard</span>
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="bg-[#000000] border border-white/10 rounded-lg p-4 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-gray-300" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Busca Inteligente por Nome, Código, UUID, Usuário, Telefone ou E-mail..."
          className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder:text-gray-500 font-sans"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      {/* SUBTAB 1: ROLE-SPECIFIC DASHBOARD OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* ROLE 1: SUPER ADMIN DASHBOARD */}
          {currentUser?.role === 'SUPER_ADMIN' && roleMetrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-[#000000] border border-purple-500/30 rounded-lg p-4 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Provedores</span>
                    <Building2 size={16} className="text-gray-300" />
                  </div>
                  <div className="text-2xl font-semibold text-white">{roleMetrics.qtdProvedores}</div>
                  <p className="text-xs text-purple-400 font-mono">Assinaturas Contratuais</p>
                </div>

                <div className="bg-[#000000] border border-blue-500/30 rounded-lg p-4 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Revendas</span>
                    <GitFork size={16} className="text-blue-400" />
                  </div>
                  <div className="text-2xl font-semibold text-white">{roleMetrics.qtdRevendas}</div>
                  <p className="text-xs text-blue-400 font-mono">Multi-Nível Nível 3</p>
                </div>

                <div className="bg-[#000000] border border-amber-500/30 rounded-lg p-4 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-bold uppercase tracking-wider">SubRevendas</span>
                    <Users size={16} className="text-amber-400" />
                  </div>
                  <div className="text-2xl font-semibold text-white">{roleMetrics.qtdSubRevendas}</div>
                  <p className="text-xs text-amber-400 font-mono">Multi-Nível Nível 4</p>
                </div>

                <div className="bg-[#000000] border border-emerald-500/30 rounded-lg p-4 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Usuários Finais</span>
                    <Users size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-2xl font-semibold text-emerald-400">{roleMetrics.totalUsuarios}</div>
                  <p className="text-xs text-emerald-500 font-mono">Smart TV / Mobile</p>
                </div>

                <div className="bg-[#000000] border border-teal-500/30 rounded-lg p-4 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Licenças Ativas</span>
                    <CheckCircle2 size={16} className="text-teal-400" />
                  </div>
                  <div className="text-2xl font-semibold text-teal-400">{roleMetrics.licAtivas}</div>
                  <p className="text-xs text-teal-500 font-mono">Em operação</p>
                </div>

                <div className="bg-[#000000] border border-red-500/30 rounded-lg p-4 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Licenças Expiradas</span>
                    <Clock size={16} className="text-red-400" />
                  </div>
                  <div className="text-2xl font-semibold text-red-400">{roleMetrics.licExpiradas}</div>
                  <p className="text-xs text-red-500 font-mono">Aguardando renovação</p>
                </div>
              </div>

              {/* Super Admin Revenue & Financial Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#000000] border border-emerald-500/20 rounded-lg p-5 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receita Total de Créditos</span>
                    <DollarSign size={20} className="text-emerald-400" />
                  </div>
                  <div className="text-3xl font-semibold text-emerald-400">
                    R$ {roleMetrics.receitaCreditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-400">Via Lynx Gateway PIX Instantâneo</p>
                </div>

                <div className="bg-[#000000] border border-white/10 rounded-lg p-5 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receita Mensalidades Provedor</span>
                    <Building2 size={20} className="text-gray-300" />
                  </div>
                  <div className="text-3xl font-semibold text-gray-300">
                    R$ {roleMetrics.receitaMensalidades.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-400">Planos de capacidade mensal</p>
                </div>

                <div className="bg-[#000000] border border-purple-500/20 rounded-lg p-5 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Créditos Injetados</span>
                    <Coins size={20} className="text-purple-400" />
                  </div>
                  <div className="text-3xl font-semibold text-white">
                    {roleMetrics.totalCreditosVendidos.toLocaleString()} <span className="text-xs text-purple-400">CR</span>
                  </div>
                  <p className="text-xs text-gray-400">Créditos ativos em circulação</p>
                </div>

                <div className="bg-[#000000] border border-blue-500/40 rounded-lg p-5 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assinaturas Provedores</span>
                    <CheckCircle2 size={20} className="text-blue-400" />
                  </div>
                  <div className="text-2xl font-semibold text-white">
                    {roleMetrics.assinaturasAtivas} Ativas / <span className="text-red-400">{roleMetrics.assinaturasVencidas} Vencidas</span>
                  </div>
                  <p className="text-xs text-gray-400">Taxa de adimplência 95%</p>
                </div>
              </div>
            </div>
          )}

          {/* ROLE 2: PROVEDOR DASHBOARD */}
          {currentUser?.role === 'PROVEDOR' && roleMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-[#000000] border border-emerald-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Plano Contratado</span>
                <div className="text-xl font-semibold text-emerald-400">{roleMetrics.planoContratado}</div>
                <p className="text-xs text-emerald-500 font-mono">Próx. Venc: {roleMetrics.proximoVencimento}</p>
              </div>

              <div className="bg-[#000000] border border-blue-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Usuários Ativos</span>
                <div className="text-2xl font-semibold text-white">{roleMetrics.usuariosAtivos}</div>
                <p className="text-xs text-blue-400 font-mono">Limite: {roleMetrics.limiteContratado}</p>
              </div>

              <div className="bg-[#000000] border border-purple-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Espaço Disponível</span>
                <div className="text-2xl font-semibold text-purple-400">{roleMetrics.espacoDisponivel}</div>
                <p className="text-xs text-purple-400 font-mono">Vagas para novos cadastros</p>
              </div>

              <div className="bg-[#000000] border border-teal-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Licenças Ativas</span>
                <div className="text-2xl font-semibold text-teal-400">{roleMetrics.licAtivas}</div>
                <p className="text-xs text-teal-500 font-mono">Expiradas: {roleMetrics.licExpiradas}</p>
              </div>

              <div className="bg-[#000000] border border-amber-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">DNS Cadastradas</span>
                <div className="text-2xl font-semibold text-amber-400">{roleMetrics.dnsCadastradas}</div>
                <p className="text-xs text-amber-400 font-mono">Servidores de streaming</p>
              </div>
            </div>
          )}

          {/* ROLE 3: REVENDA DASHBOARD */}
          {currentUser?.role === 'REVENDA' && roleMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-[#000000] border border-emerald-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Saldo Créditos</span>
                <div className="text-2xl font-semibold text-emerald-400">{roleMetrics.saldoCreditos} CR</div>
                <p className="text-xs text-emerald-500 font-mono">Disponível imediato</p>
              </div>

              <div className="bg-[#000000] border border-[#6A00FF]/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Licenças Criadas</span>
                <div className="text-2xl font-semibold text-gray-300">{roleMetrics.licCriadas}</div>
                <p className="text-xs text-purple-400 font-mono">No histórico</p>
              </div>

              <div className="bg-[#000000] border border-blue-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Licenças Renovadas</span>
                <div className="text-2xl font-semibold text-blue-400">{roleMetrics.licRenovadas}</div>
                <p className="text-xs text-blue-400 font-mono">Ciclos concluídos</p>
              </div>

              <div className="bg-[#000000] border border-teal-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Usuários Ativos</span>
                <div className="text-2xl font-semibold text-teal-400">{roleMetrics.usuariosAtivos}</div>
                <p className="text-xs text-teal-500 font-mono">Conectados</p>
              </div>

              <div className="bg-[#000000] border border-amber-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">SubRevendas</span>
                <div className="text-2xl font-semibold text-amber-400">{roleMetrics.subRevendas}</div>
                <p className="text-xs text-amber-400 font-mono">Abaixo da sua conta</p>
              </div>

              <div className="bg-[#000000] border border-purple-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">DNS Cadastradas</span>
                <div className="text-2xl font-semibold text-purple-400">{roleMetrics.dnsCadastradas}</div>
                <p className="text-xs text-purple-400 font-mono">Servidores de domínio</p>
              </div>
            </div>
          )}

          {/* ROLE 4: SUBREVENDA DASHBOARD */}
          {currentUser?.role === 'SUBREVENDA' && roleMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-[#000000] border border-emerald-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Saldo de Créditos</span>
                <div className="text-2xl font-semibold text-emerald-400">{roleMetrics.saldo} CR</div>
                <p className="text-xs text-emerald-500 font-mono">Para ativação de clientes</p>
              </div>

              <div className="bg-[#000000] border border-blue-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Usuários Ativos</span>
                <div className="text-2xl font-semibold text-white">{roleMetrics.usuarios}</div>
                <p className="text-xs text-blue-400 font-mono">Clientes finais</p>
              </div>

              <div className="bg-[#000000] border border-[#6A00FF]/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Licenças Totais</span>
                <div className="text-2xl font-semibold text-gray-300">{roleMetrics.licencas}</div>
                <p className="text-xs text-purple-400 font-mono">Ativas e expiradas</p>
              </div>

              <div className="bg-[#000000] border border-amber-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">DNS Configurada</span>
                <div className="text-2xl font-semibold text-amber-400">{roleMetrics.dns}</div>
                <p className="text-xs text-amber-400 font-mono">Servidores vinculados</p>
              </div>

              <div className="bg-[#000000] border border-teal-500/30 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Ativações Recentes</span>
                <div className="text-2xl font-semibold text-teal-400">{roleMetrics.ultimasAtivacoes}</div>
                <p className="text-xs text-teal-500 font-mono">Últimos 30 dias</p>
              </div>
            </div>
          )}

          {/* ROLE 5: USUARIO FINAL DASHBOARD */}
          {currentUser?.role === 'USUARIO_FINAL' && roleMetrics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-[#000000] border border-emerald-500/30 rounded-lg p-4 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                  <div className={`text-xl font-semibold ${roleMetrics.status === 'ATIVA' ? 'text-emerald-400' : roleMetrics.status === 'TRIAL' ? 'text-blue-400' : 'text-red-400'}`}>{roleMetrics.status}</div>
                </div>

                <div className="bg-[#000000] border border-[#6A00FF]/30 rounded-lg p-4 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Plano Atual</span>
                  <div className="text-lg font-semibold text-gray-300 truncate">{licenses.find(l => l.userId === currentUser.accountId)?.planName || 'TRIAL'}</div>
                </div>

                <div className="bg-[#000000] border border-[#6A00FF]/30 rounded-lg p-4 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Dias Rest. / Venc.</span>
                  <div className="text-xl font-semibold text-white">{roleMetrics.diasRestantes} d</div>
                  <p className="text-xs text-purple-400 font-mono truncate">{licenses.find(l => l.userId === currentUser.accountId)?.expiresAt}</p>
                </div>

                <div className="bg-[#000000] border border-blue-500/30 rounded-lg p-4 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Dispositivos</span>
                  <div className="text-xl font-semibold text-white font-mono">{roleMetrics.dispositivos}</div>
                  <p className="text-[10px] text-blue-400 font-mono">Utilizados / Permitidos</p>
                </div>

                <div className="bg-[#000000] border border-amber-500/30 rounded-lg p-4 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Servidores (DNS)</span>
                  <div className="text-xl font-semibold text-amber-400 font-mono truncate">{roleMetrics.servidoresDns}</div>
                  <p className="text-[10px] text-amber-400 font-mono">Utilizados / Permitidos</p>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                 <button 
                   onClick={() => {
                     const myLic = licenses.find(l => l.userId === currentUser?.accountId);
                     if (myLic && onRenewLicense) onRenewLicense(myLic);
                   }}
                   className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-sm shadow-emerald-900/50 flex items-center gap-2 cursor-pointer">
                   <KeyRound size={16} />
                   <span>Renovar Licença Agora</span>
                 </button>
              </div>
            </div>
          )}

          {/* TOP LISTAS & RANKINGS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Top 1: Revendas com mais licenças */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Top Revendas (Licenças)</span>
                <Award size={16} className="text-gray-300" />
              </h4>

              <div className="space-y-2">
                {topLists.topRevendas.length > 0 ? (
                  topLists.topRevendas.map((item, idx) => (
                    <div key={idx} className="bg-[#000000] p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#6A00FF]/20 text-gray-300 font-mono font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-gray-200 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">{item.count} Lic.</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">Sem dados registrados.</p>
                )}
              </div>
            </div>

            {/* Top 2: Provedores com mais usuários */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Top Provedores (Usuários)</span>
                <Building2 size={16} className="text-blue-400" />
              </h4>

              <div className="space-y-2">
                {topLists.topProvedores.length > 0 ? (
                  topLists.topProvedores.map((item, idx) => (
                    <div key={idx} className="bg-[#000000] p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-gray-200 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-blue-400">{item.count} Usr.</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">Sem dados registrados.</p>
                )}
              </div>
            </div>

            {/* Top 3: Servidor (DNS) mais utilizadas */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Top Servidor (DNS) Mais Utilizadas</span>
                <Globe size={16} className="text-amber-400" />
              </h4>

              <div className="space-y-2">
                {topLists.topDns.length > 0 ? (
                  topLists.topDns.map((item, idx) => (
                    <div key={idx} className="bg-[#000000] p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 truncate max-w-[150px]">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-gray-300 text-xs truncate">{item.url}</span>
                      </div>
                      <span className="font-bold text-amber-400 text-xs">Cod: {item.code}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">Sem dados registrados.</p>
                )}
              </div>
            </div>

            {/* Top 4: Planos mais vendidos */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Top Planos Vendidos</span>
                <ShoppingBag size={16} className="text-teal-400" />
              </h4>

              <div className="space-y-2">
                {topLists.topPlanos.length > 0 ? (
                  topLists.topPlanos.map((item, idx) => (
                    <div key={idx} className="bg-[#000000] p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-mono font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-gray-200 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-teal-400">{item.count} Vendas</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">Sem dados registrados.</p>
                )}
              </div>
            </div>
          </div>

          {/* ÚLTIMAS ATIVIDADES STREAM */}
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-white tracking-tight flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-gray-300" />
                <span>Últimas Atividades no Ecossistema Multi-Tenant</span>
              </div>
              <span className="text-xs text-gray-400 font-normal">Atualizado ao vivo</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Recent Logins & User Activity */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Últimos Logins e Acessos ao Servidor</h4>
                {scopedEndUsers.slice(0, 4).map((u, i) => (
                  <div key={i} className="bg-[#000000] p-3 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <Users size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-white block">{u.username} ({u.name})</span>
                        <span className="text-xs text-gray-400 font-mono">{u.authorizedDns?.length} Servidor (DNS) • {u.providerName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded font-mono font-bold block">
                        LOGIN OK
                      </span>
                      <span className="text-xs text-gray-500 font-mono block mt-0.5">{u.lastAccess}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Recent Credit Purchases & License Actions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Últimas Compras de Crédito & Licenciamento</h4>
                {scopedTransactions.slice(0, 4).map((tx, i) => (
                  <div key={i} className="bg-[#000000] p-3 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6A00FF]/20 text-gray-300 flex items-center justify-center font-bold">
                        <Coins size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-white block">{tx.description}</span>
                        <span className="text-xs text-gray-400 font-mono">Origem: {tx.fromOwnerName} &rarr; Destino: {tx.toOwnerName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400 text-xs block">+{tx.amount} CR</span>
                      <span className="text-xs text-gray-500 font-mono block mt-0.5">{tx.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: GRAPHICAL ANALYTICS (GRÁFICOS MENSAL) */}
      {activeSubTab === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 1: Novas Licenças por Mês */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <BarChart2 size={18} className="text-gray-300" />
                    <span>Novas Licenças por Mês</span>
                  </h3>
                  <p className="text-xs text-gray-400">Evolução de novas emissões de licenças alfanuméricas</p>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  +34.8% YoY
                </span>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-48 flex items-end justify-between gap-2 pt-6 border-b border-white/10 pb-2">
                {[
                  { month: 'Jan', val: 120 },
                  { month: 'Fev', val: 180 },
                  { month: 'Mar', val: 240 },
                  { month: 'Abr', val: 310 },
                  { month: 'Mai', val: 290 },
                  { month: 'Jun', val: 420 },
                  { month: 'Jul', val: 580 },
                ].map((item, i) => {
                  const heightPercent = (item.val / 600) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-white transition-colors">
                        {item.val}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-[#6A00FF] to-[#9C4DFF] rounded-t-lg transition-all group-hover:brightness-125 shadow-sm"
                      />
                      <span className="text-xs font-bold text-gray-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Novos Usuários por Mês */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Users size={18} className="text-blue-400" />
                    <span>Novos Usuários por Mês</span>
                  </h3>
                  <p className="text-xs text-gray-400">Crescimento da base de usuários finais cadastrados</p>
                </div>
                <span className="text-xs text-blue-400 font-mono font-bold bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/30">
                  +1,250 este mês
                </span>
              </div>

              <div className="h-48 flex items-end justify-between gap-2 pt-6 border-b border-white/10 pb-2">
                {[
                  { month: 'Jan', val: 300 },
                  { month: 'Fev', val: 450 },
                  { month: 'Mar', val: 600 },
                  { month: 'Abr', val: 780 },
                  { month: 'Mai', val: 890 },
                  { month: 'Jun', val: 1100 },
                  { month: 'Jul', val: 1250 },
                ].map((item, i) => {
                  const heightPercent = (item.val / 1300) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-white transition-colors">
                        {item.val}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg transition-all group-hover:brightness-125 shadow-sm shadow-blue-500/30"
                      />
                      <span className="text-xs font-bold text-gray-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 3: Consumo de Créditos por Mês */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Coins size={18} className="text-amber-400" />
                    <span>Consumo de Créditos por Mês</span>
                  </h3>
                  <p className="text-xs text-gray-400">Total de créditos convertidos em renovações/ativações</p>
                </div>
                <span className="text-xs text-amber-400 font-mono font-bold bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  4,890 CR gastos
                </span>
              </div>

              <div className="h-48 flex items-end justify-between gap-2 pt-6 border-b border-white/10 pb-2">
                {[
                  { month: 'Jan', val: 1200 },
                  { month: 'Fev', val: 1800 },
                  { month: 'Mar', val: 2400 },
                  { month: 'Abr', val: 3100 },
                  { month: 'Mai', val: 3700 },
                  { month: 'Jun', val: 4200 },
                  { month: 'Jul', val: 4890 },
                ].map((item, i) => {
                  const heightPercent = (item.val / 5000) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-white transition-colors">
                        {item.val}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-amber-600 to-yellow-400 rounded-t-lg transition-all group-hover:brightness-125 shadow-sm shadow-amber-500/30"
                      />
                      <span className="text-xs font-bold text-gray-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 4: Receita Mensal (R$) */}
            <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-400" />
                    <span>Receita Mensal (R$)</span>
                  </h3>
                  <p className="text-xs text-gray-400">Consolidado de Venda de Créditos + Assinaturas de Provedor</p>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  R$ 48.500,00
                </span>
              </div>

              <div className="h-48 flex items-end justify-between gap-2 pt-6 border-b border-white/10 pb-2">
                {[
                  { month: 'Jan', val: 15000 },
                  { month: 'Fev', val: 22000 },
                  { month: 'Mar', val: 28000 },
                  { month: 'Abr', val: 34000 },
                  { month: 'Mai', val: 39000 },
                  { month: 'Jun', val: 43000 },
                  { month: 'Jul', val: 48500 },
                ].map((item, i) => {
                  const heightPercent = (item.val / 50000) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-white transition-colors">
                        {(item.val / 1000).toFixed(0)}k
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all group-hover:brightness-125 shadow-sm shadow-emerald-500/30"
                      />
                      <span className="text-xs font-bold text-gray-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: REPORTS & EXPORT (RELATÓRIOS MÚLTIPLOS FORMATOS) */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <FileText size={18} className="text-gray-300" />
                  <span>Gerador de Relatórios Executivos</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Selecione a categoria de dados e exporte imediatamente nos formatos CSV, Excel ou PDF.
                </p>
              </div>

              {/* Multi-Format Export Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Download size={14} />
                  <span>Exportar CSV</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet size={14} />
                  <span>Exportar Excel (.xlsx)</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#6A00FF]/20 hover:bg-[#6A00FF]/30 text-gray-300 border border-white/10 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Printer size={14} />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>

            {/* Report Category Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {(
                [
                  'USUARIOS',
                  'LICENCAS',
                  'CREDITOS',
                  'ASSINATURAS',
                  'DNS',
                  'PAGAMENTOS',
                  'COMPRAS',
                  'DISPOSITIVOS',
                ] as ReportType[]
              ).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedReportType(type);
                    setReportPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedReportType === type
                      ? 'bg-white text-black shadow-sm border border-white/10'
                      : 'bg-[#000000] text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                  }`}
                >
                  {type === 'USUARIOS'
                    ? '1. Usuários'
                    : type === 'LICENCAS'
                    ? '2. Licenças'
                    : type === 'CREDITOS'
                    ? '3. Créditos'
                    : type === 'ASSINATURAS'
                    ? '4. Assinaturas'
                    : type === 'DNS'
                    ? '5. DNS'
                    : type === 'PAGAMENTOS'
                    ? '6. Pagamentos'
                    : type === 'COMPRAS'
                    ? '7. Compras'
                    : '8. Dispositivos'}
                </button>
              ))}
            </div>

            {/* Report Data Table */}
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#000000] text-gray-400 text-xs font-medium border-b border-white/10 text-gray-400 font-mono text-xs uppercase border-b border-white/10">
                  <tr>
                    <th className="p-3">Identificador / Nome</th>
                    <th className="p-3">Usuário / Referência</th>
                    <th className="p-3">Código / Pacote</th>
                    <th className="p-3">Status / Valor</th>
                    <th className="p-3">Provedor / Origem</th>
                    <th className="p-3">Revenda / Escopo</th>
                    <th className="p-3">Data Criação</th>
                    <th className="p-3">Último Acesso / Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {paginatedReportRows.length > 0 ? (
                    paginatedReportRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] even:bg-white/[0.01] transition-colors">
                        <td className="p-3 text-white font-bold">{row.col1}</td>
                        <td className="p-3 text-gray-300">{row.col2}</td>
                        <td className="p-3 text-gray-300">{row.col3}</td>
                        <td className="p-3 font-bold text-emerald-400">{row.col4}</td>
                        <td className="p-3 text-gray-400">{row.col5}</td>
                        <td className="p-3 text-gray-400">{row.col6}</td>
                        <td className="p-3 text-gray-400">{row.col7}</td>
                        <td className="p-3 text-gray-300">{row.col8}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-500">
                        Nenhum registro encontrado para este relatório com o filtro atual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2 text-xs font-mono">
              <span className="text-gray-400">
                Página {reportPage} de {totalReportPages} ({activeReportData.length} registros totais)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={reportPage === 1}
                  onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-[#000000] border border-white/10 rounded-lg text-gray-300 disabled:opacity-50 cursor-pointer"
                >
                  Anterior
                </button>

                <button
                  disabled={reportPage >= totalReportPages}
                  onClick={() => setReportPage((p) => Math.min(totalReportPages, p + 1))}
                  className="px-3 py-1 bg-[#000000] border border-white/10 rounded-lg text-gray-300 disabled:opacity-50 cursor-pointer"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: ALERTS & DIAGNOSTICS */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Bell size={18} className="text-gray-300" />
              <span>Central de Alertas Diagnósticos e Ações Pendentes</span>
            </h3>

            <div className="space-y-3">
              {alertsList.length > 0 ? (
                alertsList.map((alt) => (
                  <div
                    key={alt.id}
                    className={`p-4 rounded-lg border flex items-start gap-4 ${
                      alt.severity === 'high'
                        ? 'bg-red-500/10 border-red-500/30'
                        : alt.severity === 'medium'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    <AlertTriangle
                      size={20}
                      className={
                        alt.severity === 'high'
                          ? 'text-red-400 shrink-0 mt-0.5'
                          : alt.severity === 'medium'
                          ? 'text-amber-400 shrink-0 mt-0.5'
                          : 'text-blue-400 shrink-0 mt-0.5'
                      }
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                            alt.severity === 'high'
                              ? 'bg-red-500/20 text-red-400'
                              : alt.severity === 'medium'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {alt.type}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">Alta Prioridade</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{alt.title}</h4>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">{alt.desc}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 space-y-2">
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Nenhum Alerta Crítico Detectado</p>
                  <p className="text-xs text-gray-500">Toda a infraestrutura e licenças estão operando dentro dos parâmetros de conformidade.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: REST API ENDPOINTS & PERFORMANCE SCHEMAS */}
      {activeSubTab === 'apis' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Sliders size={18} className="text-gray-300" />
            <span>Especificação de Endpoints REST API — Módulo 19 (Dashboard & Relatórios)</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-[#000000] p-4 rounded-lg border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold">GET</span>
                <code className="text-white">/api/v1/dashboard/overview</code>
              </div>
              <p className="text-gray-400 text-xs font-sans">
                Retorna o resumo executivo filtrado por <code className="text-gray-300">business_mode</code>, <code className="text-gray-300">origin_type</code> e <code className="text-gray-300">parent_id</code>.
              </p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold">GET</span>
                <code className="text-white">/api/v1/dashboard/indicators</code>
              </div>
              <p className="text-gray-400 text-xs font-sans">
                Gera os KPIs específicos por nível de acesso (Super Admin, Provedor, Revenda, SubRevenda, Usuário Final).
              </p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold">POST</span>
                <code className="text-white">/api/v1/reports/export/{'{format}'}</code>
              </div>
              <p className="text-gray-400 text-xs font-sans">
                Exporta dinamicamente relatórios com suporte a formato <code className="text-emerald-400">csv</code>, <code className="text-emerald-400">excel</code> ou <code className="text-gray-300">pdf</code> com streaming paginado.
              </p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold">GET</span>
                <code className="text-white">/api/v1/dashboard/charts</code>
              </div>
              <p className="text-gray-400 text-xs font-sans">
                Agrega séries temporais mensais para exibição gráfica de novas licenças, novos usuários e consumo de créditos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 max-w-2xl w-full shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Printer size={20} className="text-gray-300" />
                <h3 className="text-base font-semibold text-white">Visualização de Impressão PDF</h3>
              </div>
              <button onClick={() => setShowPdfPreviewModal(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="bg-white text-black p-6 rounded-lg space-y-4 font-sans text-xs">
              <div className="flex items-center justify-between border-b pb-3 border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-400">STREAMFLIX TV PLATFORM</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase">Relatório Oficial de Escopo Multi-Tenant</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Gerado em: {new Date().toLocaleDateString('pt-BR')}</span>
                  <span className="text-xs font-bold text-gray-400 block">Categoria: {selectedReportType}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-300 font-bold bg-gray-100">
                      <th className="p-2">Identificador</th>
                      <th className="p-2">Referência</th>
                      <th className="p-2">Pacote</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeReportData.slice(0, 8).map((r, i) => (
                      <tr className="hover:bg-white/[0.02] even:bg-[#000000]/50 transition-colors" key={i}>
                        <td className="p-2 font-bold">{r.col1}</td>
                        <td className="p-2">{r.col2}</td>
                        <td className="p-2">{r.col3}</td>
                        <td className="p-2">{r.col4}</td>
                        <td className="p-2">{r.col7}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPdfPreviewModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  window.print();
                  showToast('Impressão PDF enviada ao navegador!');
                  setShowPdfPreviewModal(false);
                }}
                className="px-4 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Imprimir / Salvar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
