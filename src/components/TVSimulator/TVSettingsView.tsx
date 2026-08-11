import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, User, LogOut, CheckCircle2, Tv2, Wifi, Sparkles, RefreshCw } from 'lucide-react';

interface TVSettingsViewProps {
  onLogout: () => void;
  isLogoutFocused?: boolean;
}

export const TVSettingsView: React.FC<TVSettingsViewProps> = ({ onLogout, isLogoutFocused = false }) => {
  const [deviceInfo, setDeviceInfo] = useState({
    appVersion: 'v1.0.0 Oficial (Atualizado)',
    licenseStatus: 'Licença Ativa • Ilimitada',
    planName: 'Plano Premium Ultra HD 4K',
    expiryDate: '31/12/2026',
    activeUser: 'usuario_oficial',
    connectionStatus: 'Conexão Estável (Fibra 5G)',
  });

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('streamflix_user');
      if (savedUser) {
        setDeviceInfo((prev) => ({ ...prev, activeUser: savedUser }));
      }
    } catch (e) {}
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-y-auto custom-scrollbar gap-6 pr-2">
      {/* Header Title */}
      <div className="flex items-center gap-2 px-1 shrink-0">
        <Settings size={20} className="text-purple-400" />
        <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">Minha Conta & Sistema</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ACCOUNT & SUBSCRIPTION TILE */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6A00FF]/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                <User size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Minha Assinatura</h4>
                <span className="text-xs text-gray-400">Detalhes da sua conta</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 size={12} />
              LICENÇA ATIVA
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-gray-400 font-medium">Usuário Conectado:</span>
              <strong className="text-white font-mono">{deviceInfo.activeUser}</strong>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-gray-400 font-medium">Plano Contratado:</span>
              <span className="text-purple-300 font-bold flex items-center gap-1">
                <Sparkles size={13} className="text-amber-300" />
                {deviceInfo.planName}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-gray-400 font-medium">Data de Expiração:</span>
              <span className="text-emerald-400 font-bold">{deviceInfo.expiryDate}</span>
            </div>
          </div>
        </div>

        {/* APPLICATION STATUS TILE */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6A00FF]/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                <Tv2 size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Status do Aplicativo</h4>
                <span className="text-xs text-gray-400">Informações gerais</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-extrabold text-[10px] border border-purple-500/30 flex items-center gap-1">
              <Wifi size={12} className="text-emerald-400" />
              CONECTADO
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-gray-400 font-medium">Aplicativo Atualizado:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={13} />
                {deviceInfo.appVersion}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-gray-400 font-medium">Status da Conexão:</span>
              <span className="text-gray-200 font-medium">{deviceInfo.connectionStatus}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-gray-400 font-medium">Segurança de Dados:</span>
              <span className="text-purple-300 font-semibold flex items-center gap-1">
                <ShieldCheck size={13} />
                Criptografia Ativa SSL
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM ACTIONS & LOGOUT */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
        <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">Ações de Sessão</h4>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            Ao encerrar a sessão, seu aplicativo retornará à tela de login e você precisará das suas credenciais.
          </p>

          <button
            onClick={onLogout}
            className={`px-6 py-3 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0 ${
              isLogoutFocused
                ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.8)] scale-105 border-2 border-white'
                : 'bg-red-600/90 hover:bg-red-600 text-white'
            }`}
          >
            <LogOut size={16} />
            <span>SAIR DA CONTA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
