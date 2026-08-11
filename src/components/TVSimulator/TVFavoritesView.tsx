import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Radio, Play, Film, Tv2, Clock, Sparkles, Plus, Star } from 'lucide-react';

export const TVFavoritesView: React.FC = () => {
  const [favoriteItems, setFavoriteItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'todos' | 'channels' | 'movies' | 'series'>('todos');

  const SAMPLE_SUGGESTIONS = [
    {
      id: 'fav-sug-1',
      title: 'A Casa do Dragão',
      type: 'series',
      category: 'Série',
      rating: '9.8',
      seasonsCount: 2,
      backdropImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'fav-sug-2',
      title: 'SPORTV HD',
      type: 'channel',
      category: 'Esportes',
      nowShowing: 'Brasileirão ao Vivo',
      logoBg: 'bg-indigo-900',
    },
    {
      id: 'fav-sug-3',
      title: 'Duna: Parte 2',
      type: 'movie',
      category: 'Filme',
      rating: '9.5',
      duration: '2h 46m',
      backdropImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const loadFavorites = () => {
    try {
      const savedItems = localStorage.getItem('streamflix_favorite_items');
      if (savedItems) {
        const parsed = JSON.parse(savedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFavoriteItems(parsed);
          return;
        }
      }
      // Populate initial sample favorites if empty to fill screen cleanly
      setFavoriteItems(SAMPLE_SUGGESTIONS);
      localStorage.setItem('streamflix_favorite_items', JSON.stringify(SAMPLE_SUGGESTIONS));
    } catch (e) {
      setFavoriteItems(SAMPLE_SUGGESTIONS);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const removeFavorite = (id: string) => {
    try {
      const savedIds = JSON.parse(localStorage.getItem('streamflix_favorites') || '[]');
      const newIds = savedIds.filter((item: string) => item !== id);
      localStorage.setItem('streamflix_favorites', JSON.stringify(newIds));

      const newItems = favoriteItems.filter((item) => item.id !== id);
      setFavoriteItems(newItems);
      localStorage.setItem('streamflix_favorite_items', JSON.stringify(newItems));
    } catch (e) {}
  };

  const filteredItems = favoriteItems.filter((item) => {
    if (activeTab === 'todos') return true;
    if (activeTab === 'channels') return item.type === 'channel' || item.logoBg;
    if (activeTab === 'movies') return item.type === 'movie' || (item.year && !item.seasonsCount);
    if (activeTab === 'series') return item.type === 'series' || item.seasonsCount;
    return true;
  });

  const featuredFav = favoriteItems[0] || SAMPLE_SUGGESTIONS[0];

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-y-auto custom-scrollbar gap-6 pr-1">
      {/* FEATURED FAVORITE HERO BANNER */}
      <div className="relative rounded-2xl overflow-hidden bg-[#121212] border border-white/10 min-h-[200px] max-h-[240px] shrink-0 shadow-2xl">
        <img
          src={featuredFav.backdropImage || featuredFav.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80'}
          alt={featuredFav.title || featuredFav.name}
          className="w-full h-full object-cover filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/85 to-transparent w-3/4 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-black/40 z-10" />

        <div className="absolute inset-0 p-6 flex flex-col justify-between z-20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded bg-[#6A00FF] text-white shadow-md flex items-center gap-1.5">
              <Heart size={12} className="fill-white" />
              DESTAQUE DOS FAVORITOS
            </span>
            <span className="text-xs font-bold text-purple-300 bg-black/60 px-2.5 py-1 rounded border border-white/10">
              {favoriteItems.length} Conteúdo(s) Salvo(s)
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div className="space-y-1 max-w-xl">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{featuredFav.title || featuredFav.name}</h2>
              <p className="text-xs text-gray-300 font-medium">
                {featuredFav.category || featuredFav.type || 'Sua seleção favorita'} • Pronto para assistir a qualquer momento.
              </p>
            </div>

            <button className="px-6 py-2.5 rounded-xl bg-[#6A00FF] hover:bg-[#801AFF] text-white font-extrabold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(106,0,255,0.6)] cursor-pointer hover:scale-105 transition-all shrink-0">
              <Play size={16} className="fill-white" />
              <span>ASSISTIR AGORA</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER TABS & CATEGORIES */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-purple-400 fill-purple-400" />
          <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
            Meus Favoritos ({favoriteItems.length})
          </h3>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 bg-[#121212] p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'todos' ? 'bg-[#6A00FF] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Todos ({favoriteItems.length})
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'channels' ? 'bg-[#6A00FF] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Canais
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'movies' ? 'bg-[#6A00FF] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Filmes
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'series' ? 'bg-[#6A00FF] text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Séries
          </button>
        </div>
      </div>

      {/* FAVORITES GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 flex-1 p-1">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="relative rounded-2xl overflow-hidden bg-[#121212] border border-white/10 hover:border-[#6A00FF] transition-all p-3.5 flex flex-col justify-between group shadow-xl hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between gap-2 mb-2 z-10">
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#6A00FF]/30 text-purple-300 border border-purple-500/30">
                {item.category || item.type || 'Favorito'}
              </span>

              <button
                onClick={() => removeFavorite(item.id)}
                className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                title="Remover dos Favoritos"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {item.image || item.posterImage || item.backdropImage ? (
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-2 bg-[#080808]">
                <img
                  src={item.image || item.posterImage || item.backdropImage}
                  alt={item.title || item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-[#6A00FF]/20 transition-colors flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-[#6A00FF] text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={16} className="fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            ) : (
              <div className={`w-full h-24 rounded-xl ${item.logoBg || 'bg-[#6A00FF]'} flex items-center justify-center mb-2 shadow-md`}>
                <Radio size={32} className="text-white" />
              </div>
            )}

            <div>
              <h5 className="font-extrabold text-xs text-white truncate">{item.name || item.title}</h5>
              <span className="text-[11px] text-gray-400 block mt-0.5 font-mono">
                {item.nowShowing || item.duration || `${item.seasonsCount || 1} Temp.`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
