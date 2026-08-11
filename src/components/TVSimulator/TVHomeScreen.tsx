import React, { useState, useEffect } from 'react';
import { Tv, Tv2, User, Radio, Film, Heart, Settings, Play, Search, Clock, ChevronRight, Info, Plus } from 'lucide-react';
import { MenuItem } from './components/MenuItem';
import { TVLiveTvView } from './TVLiveTvView';
import { TVMoviesView } from './TVMoviesView';
import { TVSeriesView } from './TVSeriesView';
import { TVFavoritesView } from './TVFavoritesView';
import { TVSettingsView } from './TVSettingsView';
import { PlayerScreenModal, MediaPlayItem } from './components/PlayerScreenModal';
import { MediaDetailsModal, MediaDetails } from './components/MediaDetailsModal';
import { BannerCard, BannerItem } from './components/BannerCard';
import { MovieCard, MovieItem } from './components/MovieCard';
import { ChannelCard, ChannelItem } from './components/ChannelCard';

interface TVHomeScreenProps {
  focusedRow: number; // 0 for sidebar, 1 for top search/settings bar, 2 for main body
  focusedCol: number; // index inside row
  onLogout: () => void;
}

const MENU_TABS = [
  { id: 'home', label: 'Início', icon: Tv },
  { id: 'live_tv', label: 'TV ao Vivo', icon: Radio },
  { id: 'movies', label: 'Filmes', icon: Film },
  { id: 'series', label: 'Séries', icon: Tv2 },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

const FEATURED_HERO: BannerItem = {
  id: 'm-hero',
  title: 'A CASA DO DRAGÃO',
  subtitle: 'Série Original HBO',
  description: 'A história da Casa Targaryen 200 anos antes dos eventos de Game of Thrones, em meio a conflitos sangrentos e intrigas pelo Trono de Ferro.',
  category: 'Lançamentos',
  year: '2024',
  rating: '9.8',
  backdropImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
};

const CONTINUE_WATCHING = [
  {
    id: 'cw-1',
    title: 'The Mandalorian',
    episode: 'T3:E6 • O Corsário',
    progress: 75,
    backdropImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cw-2',
    title: 'Stranger Things',
    episode: 'T4:E9 • O Plano',
    progress: 40,
    backdropImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cw-3',
    title: 'Duna: Parte 2',
    episode: 'Filme • Restam 45min',
    progress: 60,
    backdropImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
  },
];

export const TVHomeScreen: React.FC<TVHomeScreenProps> = ({
  focusedRow,
  focusedCol,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [activeMedia, setActiveMedia] = useState<MediaPlayItem | null>(null);
  const [detailsMedia, setDetailsMedia] = useState<MediaDetails | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTimeStr(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize active tab when D-Pad navigates left sidebar (focusedRow === 0)
  const currentNavTab = MENU_TABS[Math.min(focusedCol, MENU_TABS.length - 1)]?.id || activeTab;
  const displayTab = focusedRow === 0 ? currentNavTab : activeTab;

  return (
    <div className="w-full h-full bg-[#080808] flex select-none text-white overflow-hidden font-sans">
      {/* FIXED LEFT SIDEBAR */}
      <div className="w-56 bg-[#0c0c0c] border-r border-white/10 p-4 flex flex-col justify-between shrink-0 z-20">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-[#6A00FF] text-white flex items-center justify-center font-black shadow-[0_0_15px_rgba(106,0,255,0.6)] shrink-0">
              <Tv2 size={20} />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white tracking-tight leading-none">STREAMFLIX</h1>
              <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">TV LEANBACK</span>
            </div>
          </div>

          {/* Navigation Menu Items */}
          <div className="space-y-1.5">
            {MENU_TABS.map((tab, idx) => {
              const isTabFocused = focusedRow === 0 && focusedCol === idx;
              const isTabActive = displayTab === tab.id;
              return (
                <MenuItem
                  key={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  isActive={isTabActive}
                  isFocused={isTabFocused}
                  onClick={() => setActiveTab(tab.id)}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom Profile Badge */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-[#6A00FF] text-white flex items-center justify-center font-bold text-xs shadow-md border border-white/20 shrink-0">
            U
          </div>
          <div className="truncate">
            <span className="block font-bold text-xs text-white truncate">Usuário Assinante</span>
            <span className="block text-[10px] text-gray-400">Conta Ativa</span>
          </div>
        </div>
      </div>

      {/* RIGHT MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* TOP HEADER BAR */}
        <div className="h-16 px-8 flex items-center justify-between border-b border-white/5 bg-[#080808]/90 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white tracking-wide uppercase">
              {MENU_TABS.find((t) => t.id === displayTab)?.label || 'STREAMFLIX TV'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('settings')}
              className="w-9 h-9 rounded-xl bg-[#121212] border border-white/10 hover:border-[#6A00FF] hover:bg-[#181818] text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Buscar"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="w-9 h-9 rounded-xl bg-[#121212] border border-white/10 hover:border-[#6A00FF] hover:bg-[#181818] text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Configurações"
            >
              <Settings size={16} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-[#6A00FF] text-white flex items-center justify-center font-extrabold text-xs shadow-md border border-white/20">
              U
            </div>
            <div className="text-sm font-bold font-mono text-white/90 pl-2 border-l border-white/10">
              {currentTimeStr}
            </div>
          </div>
        </div>

        {/* DYNAMIC SCREEN CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {displayTab === 'home' && (
            <div className="space-y-8">
              {/* HERO BANNER SECTION */}
              <BannerCard
                banner={FEATURED_HERO}
                isFocused={focusedRow === 1}
                focusedButton={focusedCol === 0 ? 'play' : 'info'}
                onPlay={() =>
                  setActiveMedia({
                    id: FEATURED_HERO.id,
                    title: FEATURED_HERO.title,
                    category: FEATURED_HERO.category,
                    type: 'movie',
                    backdropImage: FEATURED_HERO.backdropImage,
                  })
                }
                onMoreInfo={() =>
                  setDetailsMedia({
                    id: FEATURED_HERO.id,
                    title: FEATURED_HERO.title,
                    subtitle: FEATURED_HERO.subtitle,
                    synopsis: FEATURED_HERO.description,
                    category: FEATURED_HERO.category,
                    year: FEATURED_HERO.year,
                    rating: FEATURED_HERO.rating,
                    backdropImage: FEATURED_HERO.backdropImage,
                    duration: '2h 15m',
                    seasonsCount: 2,
                  })
                }
              />

              {/* ROW 1: CONTINUAR ASSISTINDO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} className="text-purple-400" />
                    <span>Continuar Assistindo</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {CONTINUE_WATCHING.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        setActiveMedia({
                          id: item.id,
                          title: item.title,
                          type: 'episode',
                          backdropImage: item.backdropImage,
                        })
                      }
                      className="group relative rounded-xl overflow-hidden bg-[#121212] border border-white/10 hover:border-[#6A00FF] transition-all cursor-pointer hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(106,0,255,0.4)]"
                    >
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
                        <img
                          src={item.backdropImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-[#6A00FF]/20 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-[#6A00FF] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play size={18} className="fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                          <div className="h-full bg-[#6A00FF]" style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>

                      <div className="p-3">
                        <h4 className="font-bold text-xs text-white group-hover:text-purple-300 transition-colors truncate">
                          {item.title}
                        </h4>
                        <span className="text-[11px] text-gray-400 block mt-0.5">{item.episode}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROW 2: TV AO VIVO DESTAQUES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Radio size={16} className="text-red-500" />
                    <span>TV ao Vivo — Agora na TV</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('live_tv')}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver todos os canais</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ChannelCard
                    channel={{
                      id: 'ch-globo',
                      name: 'GLOBO HD',
                      category: 'VARIEDADES',
                      nowShowing: 'Jornal Nacional',
                      nextShowing: 'Renascer',
                      logoBg: 'bg-gradient-to-tr from-purple-800 to-indigo-900',
                    }}
                    onClick={() =>
                      setActiveMedia({
                        id: 'ch-globo',
                        title: 'GLOBO HD — Jornal Nacional',
                        category: 'VARIEDADES',
                        type: 'live',
                      })
                    }
                  />

                  <ChannelCard
                    channel={{
                      id: 'ch-sportv',
                      name: 'SPORTV HD',
                      category: 'ESPORTES',
                      nowShowing: 'Brasileirão Série A ao Vivo',
                      nextShowing: 'Troca de Passe',
                      logoBg: 'bg-gradient-to-tr from-purple-900 to-slate-900',
                    }}
                    onClick={() =>
                      setActiveMedia({
                        id: 'ch-sportv',
                        title: 'SPORTV HD — Brasileirão Série A',
                        category: 'ESPORTES',
                        type: 'live',
                      })
                    }
                  />

                  <ChannelCard
                    channel={{
                      id: 'ch-hbo',
                      name: 'HBO SIGNATURE',
                      category: 'FILMES',
                      nowShowing: 'Duna: Parte 2',
                      nextShowing: 'Batman',
                      logoBg: 'bg-gradient-to-tr from-purple-900 to-purple-950',
                    }}
                    onClick={() =>
                      setActiveMedia({
                        id: 'ch-hbo',
                        title: 'HBO SIGNATURE — Duna: Parte 2',
                        category: 'FILMES',
                        type: 'live',
                      })
                    }
                  />
                </div>
              </div>

              {/* ROW 3: FILMES EM DESTAQUE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Film size={16} className="text-purple-400" />
                    <span>Filmes em Destaque</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('movies')}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver catálogo completo</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {[
                    {
                      id: 'm-1',
                      title: 'Duna: Parte 2',
                      year: '2024',
                      duration: '2h 46m',
                      category: 'Ficção',
                      rating: '9.5',
                      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
                    },
                    {
                      id: 'm-2',
                      title: 'Top Gun: Maverick',
                      year: '2023',
                      duration: '2h 11m',
                      category: 'Ação',
                      rating: '9.3',
                      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
                    },
                    {
                      id: 'm-3',
                      title: 'O Oppenheimer',
                      year: '2023',
                      duration: '3h 00m',
                      category: 'Drama',
                      rating: '9.6',
                      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
                    },
                    {
                      id: 'm-4',
                      title: 'The Batman',
                      year: '2022',
                      duration: '2h 56m',
                      category: 'Ação',
                      rating: '9.1',
                      image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80',
                    },
                    {
                      id: 'm-5',
                      title: 'Avatar: O Caminho da Água',
                      year: '2023',
                      duration: '3h 12m',
                      category: 'Aventura',
                      rating: '9.4',
                      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
                    },
                  ].map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onClick={() =>
                        setDetailsMedia({
                          id: movie.id,
                          title: movie.title,
                          synopsis: 'A jornada continua em uma obra cinematográfica de tirar o fôlego com imagens espetaculares.',
                          category: movie.category,
                          year: movie.year,
                          rating: movie.rating,
                          duration: movie.duration,
                          backdropImage: movie.image,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {displayTab === 'live_tv' && (
            <TVLiveTvView
              focusedRow={focusedRow === 0 ? -1 : focusedRow - 1}
              focusedCol={focusedCol}
              onPlayChannel={(channel) =>
                setActiveMedia({
                  id: channel.id,
                  title: channel.name,
                  category: channel.category,
                  type: 'live',
                })
              }
            />
          )}

          {displayTab === 'movies' && (
            <TVMoviesView
              focusedRow={focusedRow === 0 ? -1 : focusedRow - 1}
              focusedCol={focusedCol}
              onPlayMovie={(movie) =>
                setDetailsMedia({
                  id: movie.id,
                  title: movie.title,
                  synopsis: 'Superprodução imperdível disponível em altíssima definição 4K Ultra HD.',
                  category: movie.category,
                  year: movie.year,
                  rating: movie.rating,
                  duration: movie.duration,
                  backdropImage: movie.image,
                })
              }
            />
          )}

          {displayTab === 'series' && (
            <TVSeriesView
              focusedRow={focusedRow === 0 ? -1 : focusedRow - 1}
              focusedCol={focusedCol}
              onPlayEpisode={(series, season, ep) =>
                setActiveMedia({
                  id: `${series.id}_s${season}_e${ep.number}`,
                  title: `${series.title} — Temp. ${season} Ep. ${ep.number}: ${ep.title}`,
                  category: series.category,
                  type: 'episode',
                  backdropImage: series.backdropImage,
                  seasonNumber: season,
                  episodeNumber: ep.number,
                  duration: ep.duration,
                })
              }
            />
          )}

          {displayTab === 'favorites' && <TVFavoritesView />}

          {displayTab === 'settings' && (
            <TVSettingsView
              onLogout={onLogout}
              isLogoutFocused={focusedRow > 0}
            />
          )}
        </div>
      </div>

      {/* MEDIA DETAILS MODAL OVERLAY */}
      {detailsMedia && (
        <MediaDetailsModal
          media={detailsMedia}
          onClose={() => setDetailsMedia(null)}
          onPlay={(med, ep) => {
            const title = ep ? `${med.title} — Ep. ${ep.number}: ${ep.title}` : med.title;
            setActiveMedia({
              id: med.id,
              title,
              category: med.category,
              type: med.seasonsCount ? 'episode' : 'movie',
              backdropImage: med.backdropImage,
            });
            setDetailsMedia(null);
          }}
        />
      )}

      {/* PLAYER MODAL OVERLAY */}
      {activeMedia && (
        <PlayerScreenModal
          media={activeMedia}
          onClose={() => setActiveMedia(null)}
          onNextChannel={() => {
            if (activeMedia.type === 'live') {
              setActiveMedia({
                id: 'ch-next',
                title: 'SPORTV HD — Brasileirão ao Vivo',
                category: 'ESPORTES',
                type: 'live',
              });
            }
          }}
          onPrevChannel={() => {
            if (activeMedia.type === 'live') {
              setActiveMedia({
                id: 'ch-prev',
                title: 'GLOBO HD — Jornal Nacional',
                category: 'VARIEDADES',
                type: 'live',
              });
            }
          }}
        />
      )}
    </div>
  );
};
