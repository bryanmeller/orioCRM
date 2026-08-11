import React, { useState } from 'react';
import { Play, Plus, Check, ThumbsUp, Star, ChevronLeft, Search, Settings, User, Clock, Film, Tv2, X } from 'lucide-react';
import { MovieItem } from './MovieCard';

export interface EpisodeItem {
  id: string;
  number: number;
  title: string;
  duration: string;
  synopsis: string;
  thumbnailUrl?: string;
}

export interface MediaDetails {
  id: string;
  title: string;
  subtitle?: string;
  synopsis: string;
  category: string;
  year: string;
  rating: string;
  duration?: string;
  seasonsCount?: number;
  activeSeason?: number;
  ageRating?: string;
  backdropImage: string;
  posterImage?: string;
  episodes?: EpisodeItem[];
  relatedMedia?: {
    id: string;
    title: string;
    rating: string;
    posterImage: string;
    category: string;
  }[];
}

interface MediaDetailsModalProps {
  media: MediaDetails;
  onClose: () => void;
  onPlay: (media: MediaDetails, episode?: EpisodeItem) => void;
  onToggleMyList?: () => void;
  isInMyList?: boolean;
}

export const MediaDetailsModal: React.FC<MediaDetailsModalProps> = ({
  media,
  onClose,
  onPlay,
  onToggleMyList,
  isInMyList = false,
}) => {
  const [selectedSeason, setSelectedSeason] = useState(media.activeSeason || 1);
  const [liked, setLiked] = useState(false);
  const [myListState, setMyListState] = useState(isInMyList);

  const currentTimeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Default episodes if none provided for series
  const defaultEpisodes: EpisodeItem[] = media.episodes || [
    {
      id: `${media.id}_e1`,
      number: 1,
      title: 'Capítulo 17: O Apóstata',
      duration: '38min',
      synopsis: 'Din Djarin tenta se redimir por remover seu capacete e busca as águas vivas nas minas de Mandalore.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: `${media.id}_e2`,
      number: 2,
      title: 'Capítulo 18: As Minas de Mandalore',
      duration: '42min',
      synopsis: 'A viagem ao planeta devastado revela velhos inimigos e segredos esquecidos do povo mandaloriano.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: `${media.id}_e3`,
      number: 3,
      title: 'Capítulo 19: O Convertido',
      duration: '56min',
      synopsis: 'Em Coruscant, o Dr. Pershing busca recomeçar na Nova República sob monitoramento estrito.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: `${media.id}_e4`,
      number: 4,
      title: 'Capítulo 20: O Enjeitado',
      duration: '32min',
      synopsis: 'Um resgate perigoso coloca à prova a lealdade do clã enquanto Grogu relembra seu passado no Templo Jedi.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const defaultRelated = media.relatedMedia || [
    {
      id: 'rel-1',
      title: 'Ahsoka',
      rating: '9.4',
      category: 'Ficção',
      posterImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
    },
    {
      id: 'rel-2',
      title: 'Andor',
      rating: '9.6',
      category: 'Ação',
      posterImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    },
    {
      id: 'rel-3',
      title: 'Obi-Wan Kenobi',
      rating: '8.9',
      category: 'Aventura',
      posterImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
    },
    {
      id: 'rel-4',
      title: 'O Livro de Boba Fett',
      rating: '8.7',
      category: 'Ficção',
      posterImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#080808] flex flex-col overflow-hidden text-white font-sans animate-in fade-in duration-300">
      {/* Background Backdrop Image with Rich Gradient Overlays */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={media.backdropImage || media.posterImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80'}
          alt={media.title || 'Mídia'}
          className="w-full h-full object-cover object-center filter brightness-75 scale-105"
        />
        {/* Left-to-right gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/90 to-transparent w-3/4" />
        {/* Bottom-to-top gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/70 to-transparent" />
        {/* Top bar subtle vignette */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#080808]/90 to-transparent" />
      </div>

      {/* TOP HEADER BAR (Clean TV Navigation) */}
      <div className="relative z-20 flex items-center justify-between px-8 py-5 shrink-0">
        {/* Left: Back Button + STREAMFLIX TV Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 hover:border-[#6A00FF] hover:bg-[#6A00FF] text-white flex items-center justify-center transition-all cursor-pointer shadow-lg group"
            title="Voltar (ESC)"
          >
            <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6A00FF] text-white flex items-center justify-center font-black shadow-[0_0_15px_rgba(106,0,255,0.6)]">
              <Tv2 size={18} />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">STREAMFLIX TV</span>
          </div>
        </div>

        {/* Right: Search, Settings, Profile Avatar & Clock */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-300">
            <Search size={16} />
          </div>
          <div className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-300">
            <Settings size={16} />
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#6A00FF] text-white flex items-center justify-center font-extrabold text-xs shadow-md border border-white/20">
            U
          </div>
          <div className="text-sm font-bold font-mono text-white/90 pl-2 border-l border-white/10">
            {currentTimeStr}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 flex flex-col justify-between space-y-8">
        {/* MEDIA HERO DETAIL BLOCK */}
        <div className="max-w-2xl pt-2 space-y-4">
          {/* Metadata Badges Row */}
          <div className="flex items-center gap-3 flex-wrap text-xs font-semibold">
            {media.seasonsCount ? (
              <span className="px-2.5 py-1 rounded-md bg-[#6A00FF] text-white font-bold uppercase tracking-wider text-[11px] shadow-sm">
                S{selectedSeason} E6
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md bg-[#6A00FF] text-white font-bold uppercase tracking-wider text-[11px] shadow-sm">
                FILME
              </span>
            )}

            <span className="text-amber-300 font-bold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1 text-[11px]">
              <Star size={12} className="fill-amber-300 text-amber-300" />
              {media.rating}
            </span>

            <span className="text-gray-300 font-mono text-[12px]">{media.year}</span>

            {media.duration && (
              <span className="text-gray-300 font-mono text-[12px] flex items-center gap-1">
                <Clock size={12} className="text-gray-400" />
                {media.duration}
              </span>
            )}

            <span className="text-gray-300 text-[12px] font-medium">{media.category}</span>

            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px] border border-white/20">
              {media.ageRating || '12'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {media.title}
          </h1>

          {/* Synopsis */}
          <p className="text-sm text-gray-300 leading-relaxed font-normal max-w-xl line-clamp-3">
            {media.synopsis}
          </p>

          {/* ACTION BUTTONS ROW */}
          <div className="flex items-center gap-3 pt-2">
            {/* Primary Action: Assistir */}
            <button
              onClick={() => onPlay(media, media.seasonsCount ? defaultEpisodes[0] : undefined)}
              className="px-7 py-3 rounded-xl bg-[#6A00FF] hover:bg-[#801AFF] text-white font-bold text-sm tracking-wide flex items-center gap-2.5 transition-all shadow-[0_0_20px_rgba(106,0,255,0.5)] cursor-pointer hover:scale-105"
            >
              <Play size={18} className="fill-white" />
              <span>Assistir</span>
            </button>

            {/* Secondary Action: + Minha Lista */}
            <button
              onClick={() => {
                setMyListState(!myListState);
                if (onToggleMyList) onToggleMyList();
              }}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/10 flex items-center gap-2 transition-all cursor-pointer"
            >
              {myListState ? <Check size={16} className="text-purple-400" /> : <Plus size={16} />}
              <span>{myListState ? 'Na Minha Lista' : 'Minha Lista'}</span>
            </button>

            {/* Like Action */}
            <button
              onClick={() => setLiked(!liked)}
              className={`p-3 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                liked
                  ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                  : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
              }`}
              title="Gostei"
            >
              <ThumbsUp size={18} className={liked ? 'fill-purple-400' : ''} />
            </button>
          </div>
        </div>

        {/* EPISODE SELECTOR SECTION (If Series) */}
        {media.seasonsCount && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white tracking-wide">Episódios</h3>
                {/* Season Pills */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: media.seasonsCount }).map((_, idx) => {
                    const seasonNum = idx + 1;
                    return (
                      <button
                        key={seasonNum}
                        onClick={() => setSelectedSeason(seasonNum)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          selectedSeason === seasonNum
                            ? 'bg-[#6A00FF] text-white shadow-sm border border-purple-400'
                            : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                        }`}
                      >
                        Temporada {seasonNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Episode Cards Horizontal Carousel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {defaultEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => onPlay(media, ep)}
                  className="group relative rounded-xl overflow-hidden bg-[#121212] border border-white/10 hover:border-[#6A00FF] transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(106,0,255,0.4)]"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                    <img
                      src={ep.thumbnailUrl}
                      alt={ep.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-[#6A00FF]/20 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#6A00FF] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play size={18} className="fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-gray-300">
                      {ep.duration}
                    </span>
                  </div>

                  <div className="p-3">
                    <h4 className="font-bold text-xs text-white group-hover:text-purple-300 transition-colors truncate">
                      Episódio {ep.number} — {ep.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-snug">
                      {ep.synopsis}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RELATED CONTENT SECTION */}
        <div className="space-y-3 pt-2">
          <h3 className="text-base font-bold text-white tracking-wide">Mais como este</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {defaultRelated.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden bg-[#121212] border border-white/10 hover:border-[#6A00FF] transition-all cursor-pointer hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(106,0,255,0.4)]"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  <img
                    src={item.posterImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                    <Star size={9} className="fill-amber-300 text-amber-300" />
                    <span>{item.rating}</span>
                  </div>
                </div>
                <div className="p-2.5">
                  <h5 className="font-bold text-xs text-white truncate">{item.title}</h5>
                  <span className="text-[10px] text-gray-400 block mt-0.5">{item.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
