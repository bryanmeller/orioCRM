import React from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Circle, 
  ArrowLeft, 
  Home, 
  Tv, 
  Power,
  Keyboard
} from 'lucide-react';

interface RemoteControlProps {
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onSelect: () => void;
  onBack: () => void;
  onHome: () => void;
}

export const RemoteControl: React.FC<RemoteControlProps> = ({
  onNavigate,
  onSelect,
  onBack,
  onHome,
}) => {
  return (
    <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-5 w-64 shadow-sm flex flex-col items-center select-none text-white">
      {/* Top Status & Power */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#9C4DFF] animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
            Controle TV
          </span>
        </div>
        <button 
          title="Ligar/Desligar TV"
          onClick={onHome}
          className="p-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
        >
          <Power size={16} />
        </button>
      </div>

      {/* Brand Badge */}
      <div className="my-4 text-center">
        <span className="text-xs font-bold tracking-[0.2em] text-gray-300 uppercase bg-[#6A00FF]/20 px-2.5 py-1 rounded-full border border-white/10">
          Fire TV / Android TV
        </span>
      </div>

      {/* D-PAD DIRECTIONAL RING */}
      <div className="relative w-44 h-44 my-2 flex items-center justify-center bg-[#242424] rounded-full border-2 border-[#333333] shadow-inner p-2">
        {/* Direction UP */}
        <button
          title="Mover Para Cima (Seta Cima)"
          onClick={() => onNavigate('up')}
          className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-10 flex items-center justify-center hover:bg-[#6A00FF]/40 active:bg-[#6A00FF] rounded-t-full transition-colors text-gray-300 hover:text-white cursor-pointer"
        >
          <ChevronUp size={22} />
        </button>

        {/* Direction DOWN */}
        <button
          title="Mover Para Baixo (Seta Baixo)"
          onClick={() => onNavigate('down')}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-10 flex items-center justify-center hover:bg-[#6A00FF]/40 active:bg-[#6A00FF] rounded-b-full transition-colors text-gray-300 hover:text-white cursor-pointer"
        >
          <ChevronDown size={22} />
        </button>

        {/* Direction LEFT */}
        <button
          title="Mover Para Esquerda (Seta Esquerda)"
          onClick={() => onNavigate('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-12 flex items-center justify-center hover:bg-[#6A00FF]/40 active:bg-[#6A00FF] rounded-l-full transition-colors text-gray-300 hover:text-white cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Direction RIGHT */}
        <button
          title="Mover Para Direita (Seta Direita)"
          onClick={() => onNavigate('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-12 flex items-center justify-center hover:bg-[#6A00FF]/40 active:bg-[#6A00FF] rounded-r-full transition-colors text-gray-300 hover:text-white cursor-pointer"
        >
          <ChevronRight size={22} />
        </button>

        {/* CENTER OK/SELECT BUTTON */}
        <button
          title="Confirmar / Selecionar (Enter)"
          onClick={onSelect}
          className="w-16 h-16 bg-gradient-to-br from-[#6A00FF] to-[#9C4DFF] hover:brightness-110 active:scale-95 text-white rounded-full flex flex-col items-center justify-center shadow-sm transition-transform cursor-pointer font-bold text-xs border border-white/10"
        >
          <Circle size={10} className="fill-white mb-0.5" />
          <span>OK</span>
        </button>
      </div>

      {/* ACTION BUTTONS (Back & Home) */}
      <div className="grid grid-cols-2 gap-3 w-full mt-4 pt-4 border-t border-[#2D2D2D]">
        <button
          onClick={onBack}
          className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#282828] hover:bg-[#333333] active:scale-95 text-gray-300 hover:text-white transition-all cursor-pointer border border-[#3A3A3A]"
        >
          <ArrowLeft size={18} className="mb-1 text-gray-300" />
          <span className="text-xs font-medium">Voltar</span>
        </button>

        <button
          onClick={onHome}
          className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#282828] hover:bg-[#333333] active:scale-95 text-gray-300 hover:text-white transition-all cursor-pointer border border-[#3A3A3A]"
        >
          <Home size={18} className="mb-1 text-gray-300" />
          <span className="text-xs font-medium">Início</span>
        </button>
      </div>

      {/* Keyboard Hint Footer */}
      <div className="mt-4 pt-3 w-full text-center text-xs text-gray-400 bg-[#000000] py-2 px-3 rounded-lg border border-[#262626] flex items-center justify-center gap-1.5">
        <Keyboard size={12} className="text-gray-300" />
        <span>Teclas: <b>Setas</b>, <b>Enter</b>, <b>Esc</b></span>
      </div>
    </div>
  );
};
