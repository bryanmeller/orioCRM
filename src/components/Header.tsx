import React from 'react';
import { Tv, Code2, Layers, Sparkles, LayoutDashboard, ShoppingBag, Database } from 'lucide-react';

interface HeaderProps {
  activeTab: 'simulator' | 'customer-portal' | 'admin' | 'code' | 'architecture' | 'setup-db';
  setActiveTab: (tab: 'simulator' | 'customer-portal' | 'admin' | 'code' | 'architecture' | 'setup-db') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="w-full bg-[#000000]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Module Badge */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-white text-black rounded-lg flex items-center justify-center shadow-sm border border-white/10">
            <Tv size={22} className="text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white tracking-tight">STREAMFLIX TV</h1>
              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 shadow-sm font-mono">
                <Sparkles size={10} />
                MÓDULO 21
              </span>
            </div>
            <p className="text-xs text-white/50 font-medium">
              Segurança de Produção, Hardening JWT, Trilha Imutável de Auditoria, Health Monitor, Rate Limiting & Performance DB
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#000000] p-1.5 rounded-lg border border-white/10 shadow-inner overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-white text-black shadow-sm border border-white/10 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv size={15} />
            <span>PREVIEW: Smart TV</span>
          </button>
          <button
            onClick={() => setActiveTab('customer-portal')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'customer-portal'
                ? 'bg-white text-black shadow-sm border border-white/10 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag size={15} />
            <span>Portal do Cliente</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-black shadow-sm border border-white/10 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard size={15} />
            <span>Painel Admin Web</span>
          </button>
          
          {/* New Setup DB Tab */}
          <button
            onClick={() => setActiveTab('setup-db')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'setup-db'
                ? 'bg-[#6A00FF] text-white shadow-sm border border-[#9C4DFF]/30 scale-[1.02]'
                : 'text-[#9C4DFF] hover:text-white hover:bg-[#6A00FF]/20'
            }`}
          >
            <Database size={15} />
            <span>Setup DB</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'code'
                ? 'bg-white text-black shadow-sm border border-white/10 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 size={15} />
            <span>Código Flutter (Dart)</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-white text-black shadow-sm border border-white/10 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={15} />
            <span>Arquitetura & Especificações</span>
          </button>
        </div>

        {/* Theme Specification Tags */}
        <div className="hidden lg:flex items-center gap-2.5 text-xs font-mono text-gray-400 bg-[#000000] px-3.5 py-1.5 rounded-full border border-white/10">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6A00FF] shadow-[0_0_8px_#6A00FF]" />
            #6A00FF
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9C4DFF] shadow-[0_0_8px_#9C4DFF]" />
            #9C4DFF
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#000000] border border-white/30" />
            #000000
          </span>
        </div>
      </div>
    </header>
  );
};
