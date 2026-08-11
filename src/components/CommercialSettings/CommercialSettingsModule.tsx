import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, FileText, ShieldCheck, Coins, Sliders, Save, Plus, Edit2, Trash2, AlertCircle, XCircle, CheckCircle, Package } from 'lucide-react';
import { createProviderPlan, updateProviderPlan, toggleProviderPlanStatus, deleteProviderPlan } from '../../services/admin/providerPlanService';
import { createLicensePlan, updateLicensePlan, toggleLicensePlanStatus, deleteLicensePlan } from '../../services/admin/licensePlanService';
import { saveSettings, loadSettings } from '../../services/admin/settingsService';

export const CommercialSettingsModule = ({ currentUser, showToast }: any) => {
  const [activeTab, setActiveTab] = useState('provider-plans');
  const [providerPlans, setProviderPlans] = useState<any[]>([]);
  const [licensePlans, setLicensePlans] = useState<any[]>([]);
  const [sysSettings, setSysSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: ppData },
        { data: lpData },
        settingsData
      ] = await Promise.all([
        supabase.from('provider_plans').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('license_plans').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        loadSettings()
      ]);

      if (ppData) setProviderPlans(ppData);
      if (lpData) setLicensePlans(lpData);
      
      const settingsObj: any = {};
      if (settingsData) {
        settingsData.forEach((s: any) => {
          settingsObj[s.setting_key] = s.setting_value;
        });
      }
      setSysSettings(settingsObj);
    } catch (err: any) {
      showToast('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (keysToSave: string[], values: any) => {
    try {
      const payload = keysToSave.map(k => ({
        setting_key: k,
        setting_value: values[k] !== undefined ? values[k] : sysSettings[k]
      }));
      await saveSettings(payload, currentUser.id);
      showToast('Configurações salvas com sucesso!');
      loadData();
    } catch (err: any) {
      showToast('Erro ao salvar: ' + err.message);
    }
  };

  const tabs = [
    { id: 'provider-plans', label: 'Planos de Provedor', icon: Building2 },
    { id: 'license-plans', label: 'Planos de Licença', icon: FileText },
    { id: 'licensing-policy', label: 'Política de Licenciamento', icon: ShieldCheck },
    { id: 'credit-packages', label: 'Pacotes de Créditos', icon: Package },
    { id: 'credits-settings', label: 'Créditos', icon: Coins },
    { id: 'lynx-gateway', label: 'Gateway Lynx', icon: Sliders },
  ];

  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Acesso Negado</h2>
          <p className="text-gray-400">Esta área é restrita ao SUPER_ADMIN.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-purple-500" size={24} />
            Configurações Comerciais
          </h2>
          <p className="text-xs text-gray-400 mt-1">Gerencie planos, regras de licenciamento, créditos e integrações financeiras.</p>
        </div>
      </div>

      <div className="flex items-center bg-[#000000] p-2 rounded-lg border border-white/10 shadow-sm overflow-x-auto gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'provider-plans' && (
              <ProviderPlansTab plans={providerPlans} onRefresh={loadData} showToast={showToast} />
            )}
            {activeTab === 'license-plans' && (
              <LicensePlansTab plans={licensePlans} onRefresh={loadData} showToast={showToast} />
            )}
            {activeTab === 'licensing-policy' && (
              <LicensingPolicyTab settings={sysSettings} onSave={handleSaveSettings} />
            )}
            {activeTab === 'credit-packages' && (
              <CreditPackagesTab showToast={showToast} />
            )}
            {activeTab === 'credits-settings' && (
              <CreditsSettingsTab settings={sysSettings} onSave={handleSaveSettings} />
            )}
            {activeTab === 'lynx-gateway' && (
              <LynxGatewayTab />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ProviderPlansTab = ({ plans, onRefresh, showToast }: any) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isFormVisible, setIsFormVisible] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', monthly_price: 0, setup_fee: 0, max_active_users: 0, max_servers: 0, status: 'ACTIVE' });
    setIsFormVisible(false);
  };

  const handleEdit = (plan: any) => {
    setEditingId(plan.id);
    setFormData(plan);
    setIsFormVisible(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProviderPlan(editingId, formData);
        showToast('Plano atualizado com sucesso!');
      } else {
        await createProviderPlan(formData);
        showToast('Plano criado com sucesso!');
      }
      resetForm();
      onRefresh();
    } catch (err: any) {
      showToast('Erro: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir logicamente este plano?')) {
      try {
        await deleteProviderPlan(id);
        showToast('Plano excluído.');
        onRefresh();
      } catch (err: any) {
        showToast('Erro: ' + err.message);
      }
    }
  };

  const handleToggle = async (id: string, status: string) => {
    try {
      await toggleProviderPlanStatus(id, status);
      showToast('Status alterado.');
      onRefresh();
    } catch (err: any) {
      showToast('Erro: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Planos de Provedor</h3>
        <button onClick={() => { resetForm(); setIsFormVisible(true); }} className="px-3 py-1.5 bg-[#6A00FF] hover:bg-[#801aff] text-white text-xs font-bold rounded-lg flex items-center gap-2">
          <Plus size={14} /> Novo Plano
        </button>
      </div>

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="bg-[#111111] p-4 rounded-lg border border-white/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Nome</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Descrição</label>
              <input type="text" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Mensalidade</label>
              <input type="number" step="0.01" value={formData.monthly_price || ''} onChange={e => setFormData({...formData, monthly_price: parseFloat(e.target.value)})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Taxa de implantação</label>
              <input type="number" step="0.01" value={formData.setup_fee || ''} onChange={e => setFormData({...formData, setup_fee: parseFloat(e.target.value)})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Máximo de usuários ativos</label>
              <input type="number" value={formData.max_active_users || ''} onChange={e => setFormData({...formData, max_active_users: parseInt(e.target.value)})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Máximo de Servidores (DNS)</label>
              <input type="number" value={formData.max_servers || ''} onChange={e => setFormData({...formData, max_servers: parseInt(e.target.value)})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 bg-transparent text-gray-400 hover:text-white text-xs font-bold rounded-lg border border-white/10">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white text-xs font-bold rounded-lg flex items-center gap-2"><Save size={14} /> Salvar</button>
          </div>
        </form>
      )}

      {plans.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Você ainda não cadastrou nenhum plano.</div>
      ) : (
        <div className="overflow-x-auto border border-white/5 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Mensalidade</th>
                <th className="p-3 font-medium">Taxa Inst.</th>
                <th className="p-3 font-medium">Limites (Usu/DNS)</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                  <td className="p-3 text-xs text-white font-bold">{p.name}</td>
                  <td className="p-3 text-xs text-gray-300 font-mono">R$ {p.monthly_price}</td>
                  <td className="p-3 text-xs text-gray-300 font-mono">R$ {p.setup_fee}</td>
                  <td className="p-3 text-xs text-gray-300">{p.max_active_users} / {p.max_servers}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => handleToggle(p.id, p.status)} className="p-1.5 text-gray-400 hover:text-white rounded" title="Alternar Status">
                      <ShieldCheck size={14} />
                    </button>
                    <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-400 hover:text-blue-300 rounded" title="Editar">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-400 hover:text-red-300 rounded" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const LicensePlansTab = ({ plans, onRefresh, showToast }: any) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isFormVisible, setIsFormVisible] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', validity_days: 30, self_service_price: 0, reseller_credit_cost: 0, devices_allowed: 1, max_servers: 1, trial_days: 0, status: 'ACTIVE' });
    setIsFormVisible(false);
  };

  const handleEdit = (plan: any) => {
    setEditingId(plan.id);
    setFormData(plan);
    setIsFormVisible(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateLicensePlan(editingId, formData);
        showToast('Plano atualizado com sucesso!');
      } else {
        await createLicensePlan(formData);
        showToast('Plano criado com sucesso!');
      }
      resetForm();
      onRefresh();
    } catch (err: any) {
      showToast('Erro: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir logicamente este plano?')) {
      try {
        await deleteLicensePlan(id);
        showToast('Plano excluído.');
        onRefresh();
      } catch (err: any) {
        showToast('Erro: ' + err.message);
      }
    }
  };

  const handleToggle = async (id: string, status: string) => {
    try {
      await toggleLicensePlanStatus(id, status);
      showToast('Status alterado.');
      onRefresh();
    } catch (err: any) {
      showToast('Erro: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Planos de Licença</h3>
        <button onClick={() => { resetForm(); setIsFormVisible(true); }} className="px-3 py-1.5 bg-[#6A00FF] hover:bg-[#801aff] text-white text-xs font-bold rounded-lg flex items-center gap-2">
          <Plus size={14} /> Novo Plano
        </button>
      </div>

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="bg-[#111111] p-4 rounded-lg border border-white/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Nome</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Validade em dias</label>
              <input type="number" value={formData.validity_days || ''} onChange={e => setFormData({...formData, validity_days: parseInt(e.target.value)})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Preço de Venda SELF_SERVICE (R$)</label>
              <input type="number" step="0.01" value={formData.self_service_price || ''} onChange={e => setFormData({...formData, self_service_price: parseFloat(e.target.value)})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Créditos Consumidos (Revenda)</label>
              <input type="number" value={formData.reseller_credit_cost || ''} onChange={e => setFormData({...formData, reseller_credit_cost: parseInt(e.target.value)})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Dispositivos Permitidos</label>
              <input type="number" value={formData.devices_allowed || ''} onChange={e => setFormData({...formData, devices_allowed: parseInt(e.target.value)})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Servidores (DNS) Permitidos</label>
              <input type="number" value={formData.max_servers || ''} onChange={e => setFormData({...formData, max_servers: parseInt(e.target.value)})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Dias de Trial</label>
              <input type="number" value={formData.trial_days || ''} onChange={e => setFormData({...formData, trial_days: parseInt(e.target.value)})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 bg-transparent text-gray-400 hover:text-white text-xs font-bold rounded-lg border border-white/10">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#6A00FF] hover:bg-[#801aff] text-white text-xs font-bold rounded-lg flex items-center gap-2"><Save size={14} /> Salvar</button>
          </div>
        </form>
      )}

      {plans.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Você ainda não cadastrou nenhum plano.</div>
      ) : (
        <div className="overflow-x-auto border border-white/5 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Preço (SELF)</th>
                <th className="p-3 font-medium">Custo (Créditos)</th>
                <th className="p-3 font-medium">Validade</th>
                <th className="p-3 font-medium">Disp/DNS</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                  <td className="p-3 text-xs text-white font-bold">{p.name}</td>
                  <td className="p-3 text-xs text-gray-300 font-mono">R$ {p.self_service_price}</td>
                  <td className="p-3 text-xs text-purple-400 font-mono font-bold">{p.reseller_credit_cost}</td>
                  <td className="p-3 text-xs text-gray-300">{p.validity_days} dias</td>
                  <td className="p-3 text-xs text-gray-300">{p.devices_allowed} / {p.max_servers}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => handleToggle(p.id, p.status)} className="p-1.5 text-gray-400 hover:text-white rounded" title="Alternar Status">
                      <ShieldCheck size={14} />
                    </button>
                    <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-400 hover:text-blue-300 rounded" title="Editar">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-400 hover:text-red-300 rounded" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const LicensingPolicyTab = ({ settings, onSave }: any) => {
  const [formData, setFormData] = useState({
    trial_days_default: settings?.trial_days_default ?? '',
    max_servers_per_license_default: settings?.max_servers_per_license_default ?? '',
    max_devices_per_license_default: settings?.max_devices_per_license_default ?? '',
    credits_per_server: settings?.credits_per_server ?? '',
    credits_per_additional_device: settings?.credits_per_additional_device ?? '',
    provider_default_server_limit: settings?.provider_default_server_limit ?? '',
    allow_provider_custom_server_limit: settings?.allow_provider_custom_server_limit === 'true' || settings?.allow_provider_custom_server_limit === true,
    self_service_can_remove_device: settings?.self_service_can_remove_device === 'true' || settings?.self_service_can_remove_device === true,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        trial_days_default: settings.trial_days_default ?? '',
        max_servers_per_license_default: settings.max_servers_per_license_default ?? '',
        max_devices_per_license_default: settings.max_devices_per_license_default ?? '',
        credits_per_server: settings.credits_per_server ?? '',
        credits_per_additional_device: settings.credits_per_additional_device ?? '',
        provider_default_server_limit: settings.provider_default_server_limit ?? '',
        allow_provider_custom_server_limit: settings.allow_provider_custom_server_limit === 'true' || settings.allow_provider_custom_server_limit === true,
        self_service_can_remove_device: settings.self_service_can_remove_device === 'true' || settings.self_service_can_remove_device === true,
      });
    }
  }, [settings]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const payload = {
      ...formData,
      allow_provider_custom_server_limit: String(formData.allow_provider_custom_server_limit),
      self_service_can_remove_device: String(formData.self_service_can_remove_device)
    };
    onSave(Object.keys(payload), payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">Dias padrão de Trial</label>
          <input type="number" value={formData.trial_days_default ?? ''} onChange={e => setFormData({...formData, trial_days_default: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">Máximo padrão de Servidores (DNS) por licença</label>
          <input type="number" value={formData.max_servers_per_license_default ?? ''} onChange={e => setFormData({...formData, max_servers_per_license_default: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">Máximo padrão de dispositivos por licença</label>
          <input type="number" value={formData.max_devices_per_license_default ?? ''} onChange={e => setFormData({...formData, max_devices_per_license_default: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">Créditos consumidos por Servidor (DNS)</label>
          <input type="number" value={formData.credits_per_server ?? ''} onChange={e => setFormData({...formData, credits_per_server: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">Créditos consumidos por dispositivo adicional</label>
          <input type="number" value={formData.credits_per_additional_device ?? ''} onChange={e => setFormData({...formData, credits_per_additional_device: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">Limite padrão de Servidores (DNS) por Provedor</label>
          <input type="number" value={formData.provider_default_server_limit ?? ''} onChange={e => setFormData({...formData, provider_default_server_limit: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
        </div>
        
        <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg">
          <span className="text-xs font-bold text-gray-300">Permitir limite personalizado por Provedor</span>
          <input type="checkbox" checked={formData.allow_provider_custom_server_limit} onChange={e => setFormData({...formData, allow_provider_custom_server_limit: e.target.checked})} className="w-4 h-4 rounded border-white/10 bg-[#000000]" />
        </div>
        <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg">
          <span className="text-xs font-bold text-gray-300">Cliente SELF_SERVICE pode remover dispositivo</span>
          <input type="checkbox" checked={formData.self_service_can_remove_device} onChange={e => setFormData({...formData, self_service_can_remove_device: e.target.checked})} className="w-4 h-4 rounded border-white/10 bg-[#000000]" />
        </div>
      </div>
      <div className="flex justify-start">
        <button type="submit" className="px-5 py-2.5 bg-[#6A00FF] hover:bg-[#801aff] text-white text-xs font-bold rounded-lg flex items-center gap-2"><Save size={14} /> Salvar Política</button>
      </div>
    </form>
  );
};

const CreditsSettingsTab = ({ settings, onSave }: any) => {
  const [formData, setFormData] = useState({
    credit_unit_price: settings?.credit_unit_price ?? '',
    credit_minimum_purchase: settings?.credit_minimum_purchase ?? '',
    credit_sales_enabled: settings?.credit_sales_enabled === 'true' || settings?.credit_sales_enabled === true,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        credit_unit_price: settings.credit_unit_price ?? '',
        credit_minimum_purchase: settings.credit_minimum_purchase ?? '',
        credit_sales_enabled: settings.credit_sales_enabled === 'true' || settings.credit_sales_enabled === true,
      });
    }
  }, [settings]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const payload = {
      ...formData,
      credit_sales_enabled: String(formData.credit_sales_enabled)
    };
    onSave(Object.keys(payload), payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1">Valor padrão do crédito (R$)</label>
        <input type="number" step="0.01" value={formData.credit_unit_price ?? ''} onChange={e => setFormData({...formData, credit_unit_price: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1">Quantidade mínima de compra</label>
        <input type="number" value={formData.credit_minimum_purchase ?? ''} onChange={e => setFormData({...formData, credit_minimum_purchase: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
      </div>
      <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg">
        <span className="text-xs font-bold text-gray-300">Venda de créditos ativa/inativa</span>
        <input type="checkbox" checked={formData.credit_sales_enabled} onChange={e => setFormData({...formData, credit_sales_enabled: e.target.checked})} className="w-4 h-4 rounded border-white/10 bg-[#000000]" />
      </div>
      <div className="flex justify-start">
        <button type="submit" className="px-5 py-2.5 bg-[#6A00FF] hover:bg-[#801aff] text-white text-xs font-bold rounded-lg flex items-center gap-2"><Save size={14} /> Salvar Regras de Créditos</button>
      </div>
    </form>
  );
};

const LynxGatewayTab = () => {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-[#111111] border border-white/10 p-6 rounded-lg flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
          <AlertCircle size={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Gateway Lynx - Status: PENDENTE DE INTEGRAÇÃO</h3>
          <p className="text-sm text-gray-400">
            Pagamento temporariamente indisponível. Integração com o Gateway em configuração.
          </p>
        </div>
      </div>
      
      <div className="bg-[#000000] border border-white/10 rounded-lg p-4 space-y-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informações do Gateway</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-gray-400">Ambiente</span>
            <span className="text-white font-mono font-bold">Produção</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-gray-400">Client ID Configurado</span>
            <span className="text-white font-mono">Não configurado</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-gray-400">Webhook Configurado</span>
            <span className="text-white font-mono">Não configurado</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span className="text-orange-400 font-bold">Inativo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreditPackagesTab = ({ showToast }: { showToast: (msg: string) => void }) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const loadPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setPackages(data || []);
    } catch (err: any) {
      showToast('Erro ao carregar pacotes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', credits: 0, price_per_credit: 0, sort_order: 0, status: 'ACTIVE' });
    setIsFormVisible(false);
  };

  const handleEdit = (pkg: any) => {
    setEditingId(pkg.id);
    setFormData(pkg);
    setIsFormVisible(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        credits: parseInt(formData.credits),
        price_per_credit: parseFloat(formData.price_per_credit),
        total_price: parseInt(formData.credits) * parseFloat(formData.price_per_credit),
        sort_order: parseInt(formData.sort_order),
        status: formData.status
      };

      if (editingId) {
        const { error } = await supabase.from('credit_packages').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Pacote atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('credit_packages').insert([payload]);
        if (error) throw error;
        showToast('Pacote criado com sucesso!');
      }
      resetForm();
      loadPackages();
    } catch (err: any) {
      showToast('Erro: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir logicamente este pacote?')) {
      try {
        const { error } = await supabase.from('credit_packages').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        showToast('Pacote excluído.');
        loadPackages();
      } catch (err: any) {
        showToast('Erro: ' + err.message);
      }
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const { error } = await supabase.from('credit_packages').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      showToast('Status alterado.');
      loadPackages();
    } catch (err: any) {
      showToast('Erro: ' + err.message);
    }
  };

  const calculatedTotal = (parseInt(formData.credits || 0) * parseFloat(formData.price_per_credit || 0)).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Pacotes de Créditos</h3>
        <button onClick={() => { resetForm(); setIsFormVisible(true); }} className="px-3 py-1.5 bg-[#6A00FF] hover:bg-[#801aff] text-white text-xs font-bold rounded-lg flex items-center gap-2">
          <Plus size={14} /> Novo Pacote
        </button>
      </div>

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="bg-[#111111] p-4 rounded-lg border border-white/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Nome</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Status</label>
              <select value={formData.status || 'ACTIVE'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required>
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Quantidade de Créditos</label>
              <input type="number" min="1" value={formData.credits || ''} onChange={e => setFormData({...formData, credits: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Valor por Crédito (R$)</label>
              <input type="number" step="0.01" min="0" value={formData.price_per_credit || ''} onChange={e => setFormData({...formData, price_per_credit: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Ordem (Exibição)</label>
              <input type="number" value={formData.sort_order || 0} onChange={e => setFormData({...formData, sort_order: e.target.value})} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Valor Total (Calculado)</label>
              <div className="w-full bg-[#000000]/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400 cursor-not-allowed">
                R$ {calculatedTotal}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-500 rounded-lg flex items-center gap-2"><Save size={14} /> Salvar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-xs text-gray-400 py-8">Carregando pacotes...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#000000] text-gray-400 border-y border-white/5">
              <tr>
                <th className="px-4 py-3 font-bold">Ordem</th>
                <th className="px-4 py-3 font-bold">Nome</th>
                <th className="px-4 py-3 font-bold">Créditos</th>
                <th className="px-4 py-3 font-bold">Preço Unitário</th>
                <th className="px-4 py-3 font-bold">Preço Total</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {packages.map(pkg => (
                <tr key={pkg.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white">{pkg.sort_order}</td>
                  <td className="px-4 py-3 text-white font-bold">{pkg.name}</td>
                  <td className="px-4 py-3 text-gray-300">{pkg.credits}</td>
                  <td className="px-4 py-3 text-gray-300">R$ {parseFloat(pkg.price_per_credit).toFixed(2)}</td>
                  <td className="px-4 py-3 text-green-400 font-bold">R$ {parseFloat(pkg.total_price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pkg.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {pkg.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleToggle(pkg.id, pkg.status)} className={`p-1.5 rounded-lg transition-colors ${pkg.status === 'ACTIVE' ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'}`} title={pkg.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}>
                        {pkg.status === 'ACTIVE' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      </button>
                      <button onClick={() => handleEdit(pkg)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(pkg.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nenhum pacote cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
