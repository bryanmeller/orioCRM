import React from 'react';
import { Tv, Radio, Clock, Heart, Play } from 'lucide-react';

export interface ChannelItem {
  id: string;
  name: string;
  category: string;
  nowShowing: string;
  nextShowing: string;
  logoBg: string;
  badge?: string;
  isFavorite?: boolean;
}

interface ChannelCardProps {
  channel: ChannelItem;
  isFocused?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isFocused = false,
  isFavorite = false,
  onToggleFavorite,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl p-3 bg-[#121212] border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden group select-none ${
        isFocused
          ? 'bg-[#1a1128] border-2 border-[#6A00FF] shadow-[0_0_20px_rgba(106,0,255,0.6)] scale-[1.03] z-20 ring-1 ring-purple-400'
          : 'border-white/10 hover:border-white/25 hover:bg-[#181818]'
      }`}
    >
      {/* Top Header Row: Channel Logo + Channel Name + Category + Favorite */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 truncate">
          {/* Logo Box */}
          <div className={`w-10 h-10 rounded-xl ${channel.logoBg || 'bg-[#6A00FF]'} border border-white/10 flex items-center justify-center shrink-0 shadow-md font-bold text-white text-xs`}>
            <Radio size={20} className="text-white" />
          </div>
          <div className="truncate">
            <h5 className="font-extrabold text-xs text-white truncate tracking-tight">{channel.name}</h5>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">
              {channel.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-600 text-white flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            AO VIVO
          </span>

          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(e);
              }}
              className={`p-1.5 rounded-lg border transition-all ${
                isFavorite
                  ? 'bg-purple-600/30 border-purple-500 text-purple-400'
                  : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
              }`}
              title={isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
            >
              <Heart size={12} className={isFavorite ? 'fill-purple-500 text-purple-500' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Program Information Block */}
      <div className="bg-[#080808]/80 p-2.5 rounded-lg border border-white/5 space-y-1.5 text-xs">
        {/* Current Program */}
        <div className="flex items-center justify-between gap-2">
          <div className="truncate flex-1">
            <span className="text-[10px] text-purple-400 font-extrabold uppercase block mb-0.5">PROGRAMA ATUAL</span>
            <span className="text-white font-semibold truncate block">{channel.nowShowing}</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400 shrink-0">20:30 - 21:20</span>
        </div>

        {/* Live Progress Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#6A00FF] rounded-full w-2/3" />
        </div>

        {/* Next Program */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-white/5 text-[11px] text-gray-400">
          <Clock size={11} className="text-gray-500 shrink-0" />
          <div className="truncate flex-1">
            <span className="text-gray-500 font-bold mr-1">Próximo:</span>
            <span className="text-gray-300 font-normal">{channel.nextShowing}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
