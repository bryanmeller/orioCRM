import React from 'react';
import { Tv, Loader2 } from 'lucide-react';

interface LoadingWidgetProps {
  message?: string;
}

export const LoadingWidget: React.FC<LoadingWidgetProps> = ({
  message = 'Carregando conteúdo em alta definição...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#000000] rounded-lg border border-white/10 text-center shadow-sm">
      <div className="relative mb-3">
        <div className="w-12 h-12 rounded-lg bg-[#6A00FF]/30 border border-[#6A00FF] flex items-center justify-center text-gray-300 animate-pulse shadow-sm">
          <Tv size={24} />
        </div>
        <Loader2 size={18} className="text-white animate-spin absolute -bottom-1 -right-1 bg-[#6A00FF] rounded-full p-0.5" />
      </div>
      <span className="text-xs font-bold text-white tracking-wide">{message}</span>
      <span className="text-xs text-gray-400 font-mono mt-1">STREAMFLIX TV • MÓDULO 5</span>
    </div>
  );
};
