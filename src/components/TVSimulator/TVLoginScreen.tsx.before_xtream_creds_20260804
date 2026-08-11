import React, { useState } from 'react';
import { Tv2, Key, User, Lock, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface TVLoginScreenProps {
  onLoginSuccess: () => void;
  focusedIndex?: number;
  onSelectFocused?: (idx: number) => void;
  onBackToInitial?: () => void;
}

export const TVLoginScreen: React.FC<TVLoginScreenProps> = ({ onLoginSuccess }) => {
  const [licenseCode, setLicenseCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/lynx/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseCode, username, password })
      });
      const data = await res.json();
      
      setLoading(false);
      if (data.success) {
        if (data.servers.length === 0) {
           setErrorMsg(data.message || 'Nenhum servidor disponível.');
           return;
        }
        localStorage.setItem('streamflix_user', username);
        localStorage.setItem('streamflix_license_code', licenseCode);
        localStorage.setItem('streamflix_authenticated', 'true');
        localStorage.setItem('streamflix_servers', JSON.stringify(data.servers));
        onLoginSuccess();
      } else {
        setErrorMsg(data.error || 'Erro na autenticação.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Erro de conexão ao servidor.');
    }
  };

  return (
    <div className="w-full h-full bg-[#080808] flex items-center justify-center p-8 relative overflow-hidden select-none text-white font-sans">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#6A00FF]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* LEFT BRANDING PANEL */}
        <div className="p-8 sm:p-10 bg-gradient-to-br from-[#121212] via-[#0d0914] to-[#180a29] flex flex-col justify-between border-r border-white/10 relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            {/* App Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#6A00FF] text-white flex items-center justify-center font-black shadow-[0_0_20px_rgba(106,0,255,0.7)] border border-white/20">
                <Tv2 size={26} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white leading-none">STREAMFLIX TV</h1>
                <span className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">
                  Plataforma Leanback
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <h2 className="text-2xl font-extrabold text-white leading-snug">
                Bem-vindo ao entretenimento sem limites.
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed font-normal">
                Acesse milhares de canais ao vivo, lançamentos do cinema e séries completas em altíssima definição 4K.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono pt-6 relative z-10">
            <ShieldCheck size={16} className="text-purple-400" />
            <span>Conexão Criptografada SSL</span>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-[#0c0c0c]">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1 mb-4">
              <h3 className="text-lg font-extrabold text-white">Autenticação</h3>
              <p className="text-xs text-gray-400">Informe suas credenciais de acesso</p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Código da Licença */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">Código</label>
              <div className="relative flex items-center">
                <Key size={16} className="absolute left-3.5 text-purple-400 pointer-events-none" />
                <input
                  type="text"
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value)}
                  placeholder="Seu Código de Licença"
                  className="w-full pl-10 pr-4 py-3 bg-[#141414] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#6A00FF] focus:ring-1 focus:ring-[#6A00FF] transition-all"
                  required
                />
              </div>
            </div>

            {/* Usuário */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">Usuário</label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário de acesso"
                  className="w-full pl-10 pr-4 py-3 bg-[#141414] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#6A00FF] focus:ring-1 focus:ring-[#6A00FF] transition-all"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">Senha</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full pl-10 pr-10 py-3 bg-[#141414] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#6A00FF] focus:ring-1 focus:ring-[#6A00FF] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl bg-[#6A00FF] hover:bg-[#801AFF] text-white font-extrabold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(106,0,255,0.6)] cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>AUTENTICANDO...</span>
              ) : (
                <>
                  <span>ENTRAR NO STREAMFLIX</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
