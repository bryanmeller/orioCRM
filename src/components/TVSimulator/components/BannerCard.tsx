import React from 'react';
import { Play, Info, Star, Heart } from 'lucide-react';

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  year: string;
  rating: string;
  backdropImage: string;
}

interface BannerCardProps {
  banner: BannerItem;
  isFocused?: boolean;
  focusedButton?: 'play' | 'info';
  onPlay?: () => void;
  onMoreInfo?: () => void;
}

export const BannerCard: React.FC<BannerCardProps> = ({
  banner,
  isFocused = false,
  focusedButton = 'play',
  onPlay,
  onMoreInfo,
}) => {
  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-[#080808] border transition-all duration-300 shadow-xl ${
        isFocused
          ? 'border-2 border-[#6A00FF] shadow-[0_0_35px_rgba(106,0,255,0.6)] ring-1 ring-purple-400'
          : 'border-white/10'
      }`}
    >
      {/* Backdrop Image with Multi-Layer Dark Gradient */}
      <div className="relative h-56 sm:h-64 md:h-72 w-full overflow-hidden">
        <img
          src={banner.backdropImage}
          alt={banner.title}
          className="w-full h-full object-cover object-center scale-105 filter brightness-90"
        />
        {/* Horizontal gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/85 to-transparent w-4/5" />
        {/* Vertical bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-black/30" />

        {/* Banner Content Container */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
          {/* Top Badges */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md bg-[#6A00FF] text-white shadow-md">
              EM DESTAQUE
            </span>
            <span className="text-[11px] font-bold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-amber-300 border border-white/10 flex items-center gap-1">
              <Star size={11} className="fill-amber-300 text-amber-300" />
              {banner.rating}
            </span>
            <span className="text-xs text-gray-300 font-mono font-medium">{banner.year}</span>
            <span className="text-xs text-gray-400 font-medium">{banner.category}</span>
          </div>

          {/* Title, Description & Action Buttons */}
          <div className="max-w-xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none text-shadow">
              {banner.title}
            </h2>
            <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed font-normal">
              {banner.description}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onPlay}
                className={`px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                  isFocused && focusedButton === 'play'
                    ? 'bg-[#6A00FF] text-white shadow-[0_0_25px_rgba(106,0,255,0.9)] scale-105 border-2 border-white'
                    : 'bg-[#6A00FF] hover:bg-[#801AFF] text-white'
                }`}
              >
                <Play size={15} className="fill-white" />
                <span>ASSISTIR</span>
              </button>

              <button
                onClick={onMoreInfo}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md border ${
                  isFocused && focusedButton === 'info'
                    ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.8)] scale-105'
                    : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                }`}
              >
                <Info size={15} />
                <span>Mais informações</span>
              </button>
            </div>
          </div>

          {/* Carousel Indicator Dots */}
          <div className="flex items-center justify-end gap-1.5">
            <div className="w-6 h-1.5 rounded-full bg-[#6A00FF] shadow-[0_0_8px_rgba(106,0,255,0.8)]" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
};
