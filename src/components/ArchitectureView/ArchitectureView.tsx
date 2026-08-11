import React from 'react';
import { 
  CheckCircle2, 
  Layers, 
  Sparkles,
  Palette,
  Tv,
  Film,
  Tv2,
  Heart,
  Settings,
  LayoutGrid,
  Globe,
  Database,
  RefreshCw,
  AlertTriangle,
  Inbox,
  Loader2,
  Server,
  ShoppingBag,
  Key,
  Smartphone,
  ShieldCheck,
  QrCode
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a0a0a] via-[#1c004d]/50 to-[#0a0a0a] border border-white/10 rounded-lg p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6A00FF]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/25 border border-emerald-500/20 px-3.5 py-1 rounded-full text-xs font-semibold text-emerald-300 mb-3 shadow-sm font-mono">
              <Sparkles size={14} />
              <span>MÓDULO 21 — SEGURANÇA, AUDITORIA & PERFORMANCE DE PRODUÇÃO</span>
            </div>
            <h2 className="text-3xl font-semibold text-white tracking-tight mb-2">
              Hardening de Produção, Trilha de Auditoria Imutável & Health Monitor
            </h2>
            <p className="text-gray-300 text-sm max-w-2xl leading-relaxed font-medium">
              O Módulo 21 prepara toda a plataforma para produção de alta escala: implementa barramento imutável de auditoria com 16 tipos de ações rastreadas, renovação e revogação de tokens JWT com refresh tokens, middlewares de isolamento hierárquico, rate limiting anti-DDoS por IP, otimização de índices PostgreSQL, cache in-memory com invalidação automática, monitor de Saúde da Plataforma e rotinas automatizadas de backup.
            </p>
          </div>

          <div className="flex flex-col gap-2 bg-[#000000]/90 backdrop-blur-md border border-white/10 p-4 rounded-lg shrink-0 shadow-sm">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">Status Módulo 21</span>
            <div className="flex items-center gap-2 text-xs text-white font-semibold">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Auditoria Completa (16 Ações Registradas)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white font-semibold">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Middleware de Segurança & Isolamento Tree</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white font-semibold">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Monitor "Saúde da Plataforma" em Tempo Real</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white font-semibold">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Rate Limiting, Cache Redis & Dumps DB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Architectural Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Module 18 Spec 1: Tela Inicial & Identificação */}
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-[#6A00FF]/20 border border-white/10 rounded-lg text-gray-300 shadow-sm">
                <Tv size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Tela Inicial do App</h3>
                <p className="text-xs text-gray-400 font-medium">Fluxo de Boas-Vindas Android TV</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Ao abrir o aplicativo, são exibidas rigorosamente duas opções:
            </p>

            <div className="bg-[#000000] p-3 rounded-lg border border-white/5 font-mono text-xs space-y-1.5 text-gray-300">
              <p className="text-emerald-400">• JÁ TENHO LICENÇA: Botão ENTRAR (Tela de Login)</p>
              <p className="text-emerald-400">• NÃO TENHO LICENÇA: Exibe o site + Botões COPIAR ID DO DISPOSITIVO & ABRIR SITE</p>
            </div>
          </div>
        </div>

        {/* Module 18 Spec 2: Nomenclatura Padronizada */}
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-[#6A00FF]/20 border border-white/10 rounded-lg text-gray-300 shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Padronização de Nomenclatura</h3>
                <p className="text-xs text-gray-400 font-medium">Substituição em Toda a Plataforma</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Substituída em toda a plataforma a expressão "Código do Servidor" por simplesmente **"Código"**.
            </p>

            <div className="bg-[#000000] p-3 rounded-lg border border-white/5 font-mono text-xs space-y-1.5 text-gray-300">
              <p className="text-emerald-400">• Palavra "Servidor" omitida para o Usuário Final</p>
              <p className="text-emerald-400">• Aplicável a Flutter, Painel Web, DB e REST APIs</p>
            </div>
          </div>
        </div>

        {/* Module 18 Spec 3: Portal do Cliente */}
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-[#6A00FF]/20 border border-white/10 rounded-lg text-gray-300 shadow-sm">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Portal do Usuário Final</h3>
                <p className="text-xs text-gray-400 font-medium">7 Menus de Gerenciamento</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Estrutura de autosserviço com autenticação, compra/renovação de licenças e gestão de devices:
            </p>

            <div className="bg-[#000000] p-3 rounded-lg border border-white/5 font-mono text-xs space-y-1.5 text-gray-300">
              <p className="text-emerald-400">• Minha Conta / Minhas Licenças / Comprar / Renovar</p>
              <p className="text-emerald-400">• Dispositivos / Histórico / Alterar Senha</p>
            </div>
          </div>
        </div>

        {/* Module 18 Spec 4: Pagamento Lynx PIX & Webhook */}
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-[#6A00FF]/20 border border-white/10 rounded-lg text-gray-300 shadow-sm">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Lynx Gateway PIX</h3>
                <p className="text-xs text-gray-400 font-medium">Ativação Instantânea por Webhook</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Gera QR Code e string Copia e Cola PIX. A confirmação assíncrona do Lynx ativa automaticamente as licenças adquiridas.
            </p>

            <div className="bg-[#000000] p-3 rounded-lg border border-white/5 font-mono text-xs space-y-1.5 text-gray-300">
              <p className="text-emerald-400">• Ativação em menos de 5 segundos via Webhook</p>
              <p className="text-emerald-400">• Código alfanumérico único de 6 caracteres + UUID</p>
            </div>
          </div>
        </div>

        {/* Module 18 Spec 5: Gestão de Dispositivos */}
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-[#6A00FF]/20 border border-white/10 rounded-lg text-gray-300 shadow-sm">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Dispositivos & Isolamento</h3>
                <p className="text-xs text-gray-400 font-medium">Device ID & MAC Address</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Garante que apenas um dispositivo ativo use cada licença por vez. Permite remover dispositivo e desativar licença para posterior vinculação.
            </p>

            <div className="bg-[#000000] p-3 rounded-lg border border-white/5 font-mono text-xs space-y-1.5 text-gray-300">
              <p className="text-emerald-400">• Apenas 1 licença por Device ID por vez</p>
              <p className="text-emerald-400">• Módulo de transferência preparado</p>
            </div>
          </div>
        </div>

        {/* Module 18 Spec 6: Endpoints REST & Isolamento de Servidor (DNS) */}
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-[#6A00FF]/20 border border-white/10 rounded-lg text-gray-300 shadow-sm">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Endpoints REST API Central</h3>
                <p className="text-xs text-gray-400 font-medium">Isolamento por Arvore</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Conjunto de APIs REST para o Portal do Cliente e Aplicativo Smart TV:
            </p>

            <div className="bg-[#000000] p-3 rounded-lg border border-white/5 font-mono text-xs space-y-1.5 text-gray-300">
              <p className="text-emerald-400">• POST /api/v1/customer/register</p>
              <p className="text-emerald-400">• POST /api/v1/licenses/purchase (Lynx PIX)</p>
              <p className="text-emerald-400">• POST /api/v1/licenses/renew</p>
              <p className="text-emerald-400">• GET /api/v1/customer/devices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
