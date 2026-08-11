import React from 'react';
import { Play, Heart, Star } from 'lucide-react';

export interface MovieItem {
  id: string;
  title: string;
  year: string;
  duration: string;
  category: string;
  rating: string;
  image: string;
  isPopular?: boolean;
}

interface MovieCardProps {
  movie: MovieItem;
  isFocused?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isFocused = false,
  isFavorite = false,
  onToggleFavorite,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl overflow-hidden bg-[#121212] border transition-all duration-300 cursor-pointer flex flex-col justify-between group select-none shadow-xl ${
        isFocused
          ? 'border-2 border-[#6A00FF] shadow-[0_0_30px_rgba(106,0,255,0.8)] scale-105 z-20 ring-2 ring-white/90'
          : 'border-white/10 hover:border-white/30 hover:scale-[1.02]'
      }`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#080808]">
        <img
          src={movie.image}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-white border border-white/10 shadow-sm">
            {movie.category}
          </span>

          <div className="flex items-center gap-1.5">
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(e);
                }}
                className={`p-1.5 rounded-lg bg-black/80 backdrop-blur-md border transition-colors cursor-pointer ${
                  isFavorite ? 'border-purple-500 text-purple-400' : 'border-white/10 text-gray-300 hover:text-white'
                }`}
                title={isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              >
                <Heart size={13} className={isFavorite ? 'fill-purple-500 text-purple-500' : ''} />
              </button>
            )}
            <div className="flex items-center gap-1 bg-[#6A00FF] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-md">
              <Star size={10} className="fill-amber-300 text-amber-300" />
              <span>{movie.rating}</span>
            </div>
          </div>
        </div>

        {/* Focus Play Overlay */}
        {isFocused && (
          <div className="absolute inset-0 bg-[#6A00FF]/35 backdrop-blur-[2px] flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#6A00FF] text-white flex items-center justify-center shadow-xl scale-110 border-2 border-white">
              <Play size={20} className="fill-white ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="p-3 bg-[#121212]">
        <h5 className="font-extrabold text-xs sm:text-sm text-white truncate tracking-tight group-hover:text-purple-300 transition-colors">
          {movie.title}
        </h5>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1 font-mono">
          <span>{movie.year}</span>
          <span>•</span>
          <span>{movie.duration}</span>
        </div>
      </div>
    </div>
  );
};
