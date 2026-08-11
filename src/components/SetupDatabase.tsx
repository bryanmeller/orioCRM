import React, { useState, useEffect } from 'react';
import { Copy, Check, Database, ExternalLink, AlertTriangle } from 'lucide-react';

export function SetupDatabase() {
  const [schemaSql, setSchemaSql] = useState('');
  const [adminSql, setAdminSql] = useState('');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  useEffect(() => {
    fetch('/db_schema.sql').then(res => res.text()).then(setSchemaSql);
    fetch('/db_admin.sql').then(res => res.text()).then(setAdminSql);
  }, []);

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="bg-[#111111] border border-white/10 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-[#6A00FF]/20 flex items-center justify-center border border-[#6A00FF]/30">
            <Database className="w-6 h-6 text-[#9C4DFF]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Instalação do Banco de Dados (Supabase)</h2>
            <p className="text-gray-400 mt-1">Siga os passos abaixo para criar todas as tabelas e o usuário administrador.</p>
          </div>
        </div>

        <div className="bg-[#6A00FF]/10 border border-[#6A00FF]/30 rounded-lg p-4 mb-6 flex gap-3 text-[#9C4DFF]">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="text-sm leading-relaxed">
            <strong>Atenção:</strong> Execute os scripts na ordem exata. O script 1 cria as tabelas e políticas de segurança. O script 2 cria o usuário Super Admin (admin@streamflixtv.local).
          </div>
        </div>

        <div className="space-y-8">
          {/* PASSO 1 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">1</span>
                Tabelas, Enumerações e Segurança
              </h3>
              <button 
                onClick={() => handleCopy(schemaSql, setCopiedSchema)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 transition-colors rounded-md text-sm font-medium border border-white/10"
              >
                {copiedSchema ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copiedSchema ? 'Copiado!' : 'Copiar Script 1'}
              </button>
            </div>
            <p className="text-sm text-gray-400">Cole este script no <strong>SQL Editor</strong> do Supabase e clique em <strong>Run</strong>.</p>
            <div className="relative">
              <textarea 
                value={schemaSql} 
                readOnly
                className="w-full h-64 bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-xs text-gray-300 focus:outline-none focus:border-[#6A00FF]/50 custom-scrollbar"
                placeholder="Carregando script..."
              />
            </div>
          </div>

          {/* PASSO 2 */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">2</span>
                Criar Super Administrador
              </h3>
              <button 
                onClick={() => handleCopy(adminSql, setCopiedAdmin)}
                className="flex items-center gap-2 px-4 py-2 bg-[#6A00FF] hover:bg-[#8022FF] transition-colors rounded-md text-sm font-medium"
              >
                {copiedAdmin ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copiedAdmin ? 'Copiado!' : 'Copiar Script 2'}
              </button>
            </div>
            <p className="text-sm text-gray-400">Após executar o Script 1 com sucesso, cole e execute este Script 2 no Supabase.</p>
            <div className="relative">
              <textarea 
                value={adminSql} 
                readOnly
                className="w-full h-48 bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-xs text-gray-300 focus:outline-none focus:border-[#6A00FF]/50 custom-scrollbar"
                placeholder="Carregando script..."
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
