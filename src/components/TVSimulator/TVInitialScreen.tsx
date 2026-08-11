import React, { useState, useEffect } from 'react';
import { Tv2, Key, ExternalLink, ShieldCheck, Check, Copy } from 'lucide-react';

const generateDeviceId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'BR-TV-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

interface TVInitialScreenProps {
  onGoToLogin: () => void;
  onOpenCustomerPortal?: () => void;
}

export const TVInitialScreen: React.FC<TVInitialScreenProps> = ({ onGoToLogin, onOpenCustomerPortal }) => {
  const [deviceId, setDeviceId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showNoLicenseInfo, setShowNoLicenseInfo] = useState(false);

  useEffect(() => {
    setDeviceId(generateDeviceId());
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full bg-[#080808] flex flex-col items-center justify-center p-8 relative overflow-hidden select-none text-white font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6A00FF]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl w-full flex flex-col items-center text-center space-y-6">
        {/* App Logo */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 bg-[#6A00FF] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#6A00FF]/40 border border-white/20">
            <Tv2 size={32} />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">STREAMFLIX TV</h1>
            <p className="text-xs text-purple-400 font-semibold">Plataforma Android TV & Fire TV</p>
          </div>
        </div>

        {showNoLicenseInfo ? (
          <div className="w-full bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-xl space-y-6 relative overflow-hidden flex flex-col items-center">
            <div className="space-y-3 text-center max-w-lg">
              <h2 className="text-xl font-extrabold text-white">Licença do Dispositivo</h2>
              <p className="text-xs text-gray-400">
                Para ativar este dispositivo, acesse o portal de assinantes e informe seu identificador único.
              </p>
            </div>

            <div className="bg-[#080808] p-4 rounded-xl border border-white/10 space-y-2 text-xs w-full max-w-sm text-center">
              <div className="text-gray-400 font-medium mb-1">Identificador do Dispositivo (Device ID):</div>
              <strong className="text-purple-300 bg-white/5 px-4 py-2 rounded-lg font-mono text-base tracking-widest block">
                {deviceId}
              </strong>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-2">
              <button
                onClick={() => setShowNoLicenseInfo(false)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleCopy}
                className="w-full py-3 bg-[#6A00FF] hover:bg-[#801AFF] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copiado!' : 'Copiar Device ID'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
            {/* OPTION 1: JÁ TENHO LICENÇA */}
            <div className="bg-[#121212] border-2 border-[#6A00FF] rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 bg-[#6A00FF]/30 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold text-purple-300">
                  <Key size={14} />
                  <span>JÁ TENHO LICENÇA</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">Acessar o Aplicativo</h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Informe seu Código, Usuário e Senha para autenticar no sistema.
                </p>
              </div>
              <button
                onClick={onGoToLogin}
                className="w-full py-4 bg-[#6A00FF] hover:bg-[#801AFF] text-white font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(106,0,255,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Key size={18} />
                <span>ENTRAR</span>
              </button>
            </div>

            {/* OPTION 2: NÃO TENHO LICENÇA */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden flex flex-col justify-between group hover:border-white/20 transition-all duration-300">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold text-purple-300">
                  <ExternalLink size={14} />
                  <span>NÃO TENHO LICENÇA</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">Adquira sua Licença</h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Consulte o identificador deste dispositivo para vincular um plano ativo.
                </p>
              </div>
              <button
                onClick={() => setShowNoLicenseInfo(true)}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink size={18} />
                <span>VER DETALHES</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono pt-2">
          <ShieldCheck size={14} className="text-purple-400" />
          <span>Servidor Oficial BR-03</span>
        </div>
      </div>
    </div>
  );
};
