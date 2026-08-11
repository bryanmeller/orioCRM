import React, { useState, useEffect } from 'react';
import { ShieldAlert, Zap, QrCode, MessageCircle, AlertCircle, Coins, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminRole, AdminUser } from './AdminPanel';

export const BuyCreditsTab = ({ currentUser, setActiveTab, currentBalance = 0 }: { currentUser: AdminUser, setActiveTab: (tab: string) => void, currentBalance: number }) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from('credit_packages')
          .select('*')
          .eq('status', 'ACTIVE')
          .is('deleted_at', null)
          .order('sort_order', { ascending: true })
          .order('credits', { ascending: true });

        if (error) throw error;
        setPackages(data || []);
      } catch (err: any) {
        setError('Erro ao carregar pacotes: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser.role === 'REVENDA') {
      fetchPackages();
    } else {
      setLoading(false);
    }
  }, [currentUser.role]);

  if (currentUser.role !== 'REVENDA') {
    return (
      <div className="bg-[#000000] border border-amber-500/30 rounded-lg p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-lg mx-auto flex items-center justify-center border border-amber-500/30">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-xl font-semibold text-white">Acesso Restrito</h3>
        <p className="text-sm text-gray-300 max-w-xl mx-auto leading-relaxed font-medium">
          A compra de pacotes de créditos está disponível exclusivamente para <strong className="text-purple-400">REVENDAS</strong>.
          <br />
          Seu perfil atual é <span className="text-gray-300 font-bold">{currentUser.role}</span>.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setActiveTab('credits')}
            className="px-6 py-2.5 bg-[#6A00FF] hover:bg-[#801aff] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Coins size={14} />
            <span>Ver Extrato</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Packages & Summary */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#6A00FF]/20 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-gray-300 mb-2">
                <Zap size={14} />
                <span>Aquisição de Créditos</span>
              </div>
              <h3 className="text-xl font-semibold text-white tracking-tight">Comprar Créditos</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Selecione um pacote abaixo para recarregar o seu saldo.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400 text-xs">Carregando pacotes...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-400 text-xs">{error}</div>
            ) : packages.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">Nenhum pacote de créditos está disponível no momento.</div>
            ) : (
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-300 block">PACOTES DISPONÍVEIS:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                        selectedPackage?.id === pkg.id
                          ? 'bg-[#6A00FF]/20 border-[#6A00FF] text-white shadow-sm shadow-[#6A00FF]/20 ring-1 ring-[#6A00FF]'
                          : 'bg-[#111111] border-white/5 text-gray-300 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-bold block text-white">{pkg.name}</span>
                        <span className="text-xs text-gray-400 block mt-1">{pkg.credits} Créditos</span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">R$ {parseFloat(pkg.price_per_credit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / crédito</span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <span className="text-xs text-gray-400 block">Total</span>
                        <span className="text-lg text-emerald-400 font-bold block">
                          R$ {parseFloat(pkg.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Balance, Summary & Payment */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Current Balance Card */}
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 relative z-10">Seu Saldo Atual</span>
            <div className="text-4xl font-black text-white tracking-tight flex items-center gap-3 relative z-10">
              <Coins className="text-purple-500" size={32} />
              {currentBalance} <span className="text-lg text-gray-400 font-semibold">CR</span>
            </div>
          </div>

          {/* Checkout Box */}
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6 relative">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10 pb-3">Resumo da Compra</h4>
            
            {!selectedPackage ? (
              <div className="text-center py-6 text-gray-500 text-xs">
                Selecione um pacote ao lado para ver o resumo.
              </div>
            ) : (
              <>
                <div className="space-y-3 font-medium text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Pacote:</span>
                    <span className="text-white font-bold">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>Quantidade:</span>
                    <span className="text-gray-300">{selectedPackage.credits} créditos</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>Valor Unitário:</span>
                    <span className="text-gray-300">R$ {parseFloat(selectedPackage.price_per_credit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                    <span className="text-white font-bold">Valor Total:</span>
                    <span className="text-emerald-400 text-xl font-black tracking-tight">
                      R$ {parseFloat(selectedPackage.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h5 className="text-[10px] font-bold text-gray-500 uppercase">Método de Pagamento</h5>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 border border-white/5 bg-[#111111] rounded-lg opacity-50 cursor-not-allowed text-center">
                      <QrCode size={18} className="mx-auto mb-2 text-gray-400" />
                      <span className="block text-xs font-bold text-white mb-1">PIX</span>
                      <span className="block text-[9px] text-orange-400 font-bold uppercase">Em configuração</span>
                    </div>
                    <div className="p-3 border border-white/5 bg-[#111111] rounded-lg opacity-50 cursor-not-allowed text-center">
                      <CreditCard size={18} className="mx-auto mb-2 text-gray-400" />
                      <span className="block text-xs font-bold text-white mb-1">Cartão</span>
                      <span className="block text-[9px] text-gray-500 font-bold uppercase">Em breve</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => alert('Os pagamentos automáticos ainda estão em configuração. Entre em contato com o administrador para adquirir este pacote.')}
                    className="w-full py-3.5 bg-white hover:bg-gray-200 text-black font-bold text-sm rounded-lg shadow-sm shadow-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle size={18} />
                    <span>SOLICITAR CRÉDITOS</span>
                  </button>
                  <p className="text-[10px] text-center text-gray-500">
                    Os pagamentos automáticos via PIX/Cartão ainda estão em configuração.
                  </p>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
