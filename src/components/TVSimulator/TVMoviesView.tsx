import React, { useState, useEffect } from 'react';
import { Play, Star, Heart, Sparkles, Loader2, Film } from 'lucide-react';

interface TVMoviesViewProps {
  focusedRow: number;
  focusedCol: number;
  onPlayMovie?: (movie: any) => void;
}

export interface XtreamMovieItem {
  id: string;
  streamId: string;
  title: string;
  year?: string;
  duration?: string;
  category: string;
  categoryId: string;
  rating?: string;
  posterImage: string;
  backdropImage: string;
  plot?: string;
  genre?: string;
  streamUrl?: string;
}

interface CategoryOption {
  id: string;
  label: string;
}

export const TVMoviesView: React.FC<TVMoviesViewProps> = ({ focusedRow, focusedCol, onPlayMovie }) => {
  const [moviesCatalog, setMoviesCatalog] = useState<XtreamMovieItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedMovie, setSelectedMovie] = useState<XtreamMovieItem | null>(null);
  const [renderedCount, setRenderedCount] = useState<number>(30);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('streamflix_favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadXtreamVodContent();
  }, []);

  const loadXtreamVodContent = async () => {
    setLoading(true);
    setErrorMsg(null);
    setMoviesCatalog([]);
    setCategories([]);

    try {
      const serversRaw = localStorage.getItem('streamflix_servers');
      if (!serversRaw) {
        setErrorMsg('Nenhum filme disponível neste servidor.');
        setLoading(false);
        return;
      }

      let servers: any[] = [];
      try {
        servers = JSON.parse(serversRaw);
      } catch (err) {
        setErrorMsg('Nenhum filme disponível neste servidor.');
        setLoading(false);
        return;
      }

      if (!Array.isArray(servers) || servers.length === 0) {
        setErrorMsg('Nenhum filme disponível neste servidor.');
        setLoading(false);
        return;
      }

      const activeServer = servers[0];
      const baseUrl = activeServer.url || activeServer.baseUrl || '';
      const username = activeServer.username || '';
      const password = activeServer.password || '';

      if (!baseUrl || !username || !password) {
        setErrorMsg('Nenhum filme disponível neste servidor.');
        setLoading(false);
        return;
      }

      let cleanBase = baseUrl.trim();
      if (!cleanBase.startsWith('http://') && !cleanBase.startsWith('https://')) {
        cleanBase = 'http://' + cleanBase;
      }
      cleanBase = cleanBase.replace(/\/+$/, '');

      const fetchVodApi = async (action: string) => {
        const url = `${cleanBase}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}`;
        try {
          const res = await fetch(url, {
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'User-Agent': 'IPTVSmartersPro/1.0 (Linux; Android 10)'
            }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        } catch (e) {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          const pRes = await fetch(proxyUrl);
          if (!pRes.ok) throw e;
          return await pRes.json();
        }
      };

      // 1. Fetch Categories (action=get_vod_categories)
      const catData = await fetchVodApi('get_vod_categories');
      const catList: any[] = Array.isArray(catData) ? catData : [];
      const categoryNameMap: Record<string, string> = {};

      catList.forEach((c) => {
        if (c.category_id && c.category_name) {
          categoryNameMap[String(c.category_id)] = String(c.category_name);
        }
      });

      const mappedCategories: CategoryOption[] = [
        { id: 'todos', label: 'Todos os Filmes' },
        ...catList.map((c) => ({
          id: String(c.category_id),
          label: String(c.category_name || 'Sem Categoria')
        }))
      ];
      setCategories(mappedCategories);

      // 2. Fetch Streams (action=get_vod_streams)
      const vodData = await fetchVodApi('get_vod_streams');
      const vodList: any[] = Array.isArray(vodData) ? vodData : [];

      if (vodList.length === 0) {
        setErrorMsg('Nenhum filme disponível neste servidor.');
        setLoading(false);
        return;
      }

      const mappedMovies: XtreamMovieItem[] = vodList.map((item, idx) => {
        const catIdStr = String(item.category_id || '');
        const catName = categoryNameMap[catIdStr] || 'Geral';

        const plotVal = item.plot || item.description || '';

        let ratingVal = '';
        if (item.rating && item.rating !== '0' && item.rating !== '0.0') {
          ratingVal = String(item.rating);
        } else if (item.rating_5based && Number(item.rating_5based) > 0) {
          ratingVal = (Number(item.rating_5based) * 2).toFixed(1);
        }

        const yearVal = item.year
          ? String(item.year)
          : (item.release_date ? String(item.release_date).split('-')[0] : '');

        let streamUrl = item.streamUrl || item.url || item.direct_source || '';
        if (!streamUrl && item.stream_id) {
          const ext = item.container_extension || 'mp4';
          streamUrl = `${cleanBase}/movie/${username}/${password}/${item.stream_id}.${ext}`;
        }

        const posterImg = item.stream_icon || item.cover || '';
        const backdropImg = (Array.isArray(item.backdrop_path) && item.backdrop_path[0])
          ? item.backdrop_path[0]
          : posterImg;

        return {
          id: String(item.stream_id || item.id || `m-${idx}`),
          streamId: String(item.stream_id || ''),
          title: item.name || item.title || 'Filme sem Nome',
          year: yearVal || undefined,
          duration: item.episode_run_time ? `${item.episode_run_time}m` : undefined,
          category: catName,
          categoryId: catIdStr,
          rating: ratingVal || undefined,
          posterImage: posterImg,
          backdropImage: backdropImg,
          plot: plotVal || undefined,
          genre: item.genre || undefined,
          streamUrl
        };
      });

      setMoviesCatalog(mappedMovies);
      setSelectedMovie(mappedMovies[0] || null);
      setLoading(false);
    } catch (err: any) {
      setErrorMsg('Nenhum filme disponível neste servidor.');
      setLoading(false);
    }
  };

  const toggleFavorite = (movie: XtreamMovieItem) => {
    let updated: string[];
    if (favorites.includes(movie.id)) {
      updated = favorites.filter((id) => id !== movie.id);
    } else {
      updated = [...favorites, movie.id];
    }
    setFavorites(updated);
    localStorage.setItem('streamflix_favorites', JSON.stringify(updated));
  };

  const filteredMovies = moviesCatalog.filter((m) => {
    if (selectedCategory === 'todos') return true;
    return m.categoryId === selectedCategory || m.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Synchronize focused item and update top highlight
  const [gridFocusIndex, setGridFocusIndex] = useState<number>(0);

  // Sync selected category selection
  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setGridFocusIndex(0);
    setRenderedCount(30);
    const newFiltered = moviesCatalog.filter((m) => {
      if (catId === 'todos') return true;
      return m.categoryId === catId || m.category.toLowerCase() === catId.toLowerCase();
    });
    if (newFiltered.length > 0) {
      setSelectedMovie(newFiltered[0]);
    } else {
      setSelectedMovie(null);
    }
  };

  // Synchronize remote control focus with selected movie
  useEffect(() => {
    if (focusedRow === 2 && filteredMovies[focusedCol]) {
      setGridFocusIndex(focusedCol);
      setSelectedMovie(filteredMovies[focusedCol]);
      if (focusedCol >= renderedCount - 5) {
        setRenderedCount((prev) => Math.min(filteredMovies.length, prev + 30));
      }
    }
  }, [focusedRow, focusedCol, filteredMovies, renderedCount]);

  // Handle 4-way D-Pad keyboard navigation inside grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedRow !== 1 || filteredMovies.length === 0) return;

      const cols = window.innerWidth >= 1024 ? 5 : window.innerWidth >= 768 ? 4 : 3;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setGridFocusIndex((prev) => {
          const next = Math.min(filteredMovies.length - 1, prev + 1);
          setSelectedMovie(filteredMovies[next]);
          if (next >= renderedCount - 5) {
            setRenderedCount((r) => Math.min(filteredMovies.length, r + 30));
          }
          return next;
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setGridFocusIndex((prev) => {
          const next = Math.max(0, prev - 1);
          setSelectedMovie(filteredMovies[next]);
          return next;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setGridFocusIndex((prev) => {
          const next = Math.min(filteredMovies.length - 1, prev + cols);
          setSelectedMovie(filteredMovies[next]);
          if (next >= renderedCount - 5) {
            setRenderedCount((r) => Math.min(filteredMovies.length, r + 30));
          }
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setGridFocusIndex((prev) => {
          if (prev - cols >= 0) {
            const next = prev - cols;
            setSelectedMovie(filteredMovies[next]);
            return next;
          }
          return prev;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredMovies[gridFocusIndex] && onPlayMovie) {
          onPlayMovie(filteredMovies[gridFocusIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedRow, filteredMovies, gridFocusIndex, renderedCount, onPlayMovie]);

  const displayedMovies = filteredMovies.slice(0, renderedCount);
  const isFav = selectedMovie ? favorites.includes(selectedMovie.id) : false;

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Loading state */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-purple-400 font-bold text-sm gap-3">
          <Loader2 size={32} className="animate-spin" />
          <span>Carregando catálogo de filmes...</span>
        </div>
      ) : errorMsg || moviesCatalog.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#121212] border border-white/10 rounded-2xl p-8 text-center gap-3">
          <Film size={40} className="text-gray-500" />
          <p className="text-gray-300 font-bold text-sm">{errorMsg || 'Nenhum filme disponível neste servidor.'}</p>
        </div>
      ) : (
        <>
          {/* TOP HIGHLIGHT / FEATURED AREA */}
          {selectedMovie && (
            <div className="relative rounded-2xl overflow-hidden bg-[#121212] border border-white/10 h-48 shrink-0 shadow-2xl transition-all duration-300">
              {selectedMovie.backdropImage || selectedMovie.posterImage ? (
                <img
                  src={selectedMovie.backdropImage || selectedMovie.posterImage}
                  alt={selectedMovie.title}
                  className="w-full h-full object-cover filter brightness-75 scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-[#181818]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/85 to-transparent w-3/4 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-black/50 z-10" />

              <div className="absolute inset-0 p-4 flex flex-col justify-between z-20">
                {/* Header badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-[#6A00FF] text-white shadow flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-300" />
                      {selectedMovie.category || 'FILME'}
                    </span>
                    {selectedMovie.rating && (
                      <span className="text-xs font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                        <Star size={11} className="fill-amber-300 text-amber-300" />
                        {selectedMovie.rating}
                      </span>
                    )}
                    {selectedMovie.year && (
                      <span className="text-xs text-gray-300 font-mono bg-black/50 px-2 py-0.5 rounded border border-white/10">
                        {selectedMovie.year}
                      </span>
                    )}
                    {selectedMovie.genre && (
                      <span className="text-xs text-purple-300 font-medium truncate max-w-[200px]">
                        {selectedMovie.genre}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleFavorite(selectedMovie)}
                    className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
                      isFav
                        ? 'bg-purple-600/40 border-purple-500 text-purple-300'
                        : 'bg-black/60 border-white/10 text-white hover:border-[#6A00FF]'
                    }`}
                  >
                    <Heart size={14} className={isFav ? 'fill-purple-500 text-purple-500' : ''} />
                  </button>
                </div>

                {/* Main Action & Info */}
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <h2 className="text-xl font-extrabold text-white tracking-tight leading-tight line-clamp-1">
                      {selectedMovie.title}
                    </h2>
                    {selectedMovie.plot && (
                      <p className="text-[11px] text-gray-300 line-clamp-2 font-normal leading-relaxed">
                        {selectedMovie.plot}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onPlayMovie && onPlayMovie(selectedMovie)}
                    className="px-5 py-2 rounded-xl bg-[#6A00FF] hover:bg-[#801AFF] text-white font-extrabold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(106,0,255,0.6)] cursor-pointer hover:scale-105 transition-all shrink-0"
                  >
                    <Play size={15} className="fill-white" />
                    <span>ASSISTIR</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY PILLS */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 py-1">
              {categories.map((cat, idx) => {
                const isActive = selectedCategory === cat.id;
                const isCatFocused = focusedRow === 0 && focusedCol === idx;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isCatFocused
                        ? 'bg-[#6A00FF] text-white ring-2 ring-purple-400 scale-105 shadow-lg'
                        : isActive
                        ? 'bg-[#6A00FF] text-white shadow-md border border-purple-400'
                        : 'bg-[#121212] text-gray-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* POSTER GRID (MULTIPLE ROWS WITH WRAPPING) */}
          {filteredMovies.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#121212] border border-white/10 rounded-2xl p-8 text-center gap-2">
              <Film size={36} className="text-gray-600" />
              <p className="text-gray-400 text-xs font-bold">Nenhum filme encontrado nesta categoria.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#121212] p-4 rounded-2xl border border-white/10">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-1 px-0.5">
                {displayedMovies.map((movie, idx) => {
                  const isItemFocused = (focusedRow === 1 && gridFocusIndex === idx) || selectedMovie?.id === movie.id;
                  const isItemFav = favorites.includes(movie.id);
                  const imageFailed = failedImages[movie.id];

                  return (
                    <div
                      key={movie.id}
                      tabIndex={0}
                      onMouseEnter={() => {
                        setGridFocusIndex(idx);
                        setSelectedMovie(movie);
                      }}
                      onClick={() => {
                        setGridFocusIndex(idx);
                        setSelectedMovie(movie);
                        if (onPlayMovie) onPlayMovie(movie);
                      }}
                      className={`w-full cursor-pointer transition-all duration-300 outline-none group rounded-xl ${
                        isItemFocused
                          ? 'border-2 border-[#6A00FF] shadow-[0_0_20px_rgba(106,0,255,0.8)] ring-2 ring-purple-400 scale-105 z-10'
                          : 'hover:scale-[1.02] border border-white/10 hover:border-white/30'
                      }`}
                    >
                      {/* Vertical Poster Container (aspect 2/3) */}
                      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#181818] flex items-center justify-center">
                        {!imageFailed && movie.posterImage ? (
                          <img
                            src={movie.posterImage}
                            alt={movie.title}
                            loading="lazy"
                            onError={() => setFailedImages((prev) => ({ ...prev, [movie.id]: true }))}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="p-3 text-center flex flex-col items-center justify-center h-full w-full bg-[#1a1a1a]">
                            <Film size={28} className="text-purple-400/60 mb-2" />
                            <span className="text-[11px] font-bold text-gray-300 line-clamp-3 leading-tight">
                              {movie.title}
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-80 group-hover:opacity-100 transition-opacity" />

                        {/* Rating Badge */}
                        {movie.rating && (
                          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                            <Star size={9} className="fill-amber-300 text-amber-300" />
                            {movie.rating}
                          </div>
                        )}

                        {/* Favorite Badge */}
                        {isItemFav && (
                          <div className="absolute top-2 right-2 bg-black/80 p-1 rounded-full text-purple-400 border border-purple-500/40">
                            <Heart size={10} className="fill-purple-500 text-purple-500" />
                          </div>
                        )}
                      </div>

                      {/* Title Below Poster */}
                      <div className="mt-2 px-1 pb-1">
                        <h5 className="font-extrabold text-xs text-white truncate group-hover:text-purple-300 transition-colors">
                          {movie.title}
                        </h5>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5 font-mono">
                          <span className="truncate max-w-[90px]">{movie.category}</span>
                          {movie.year && <span className="shrink-0">{movie.year}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Incremental Load More Button if catalog has more */}
              {renderedCount < filteredMovies.length && (
                <div className="w-full py-6 flex justify-center">
                  <button
                    onClick={() => setRenderedCount((prev) => Math.min(filteredMovies.length, prev + 30))}
                    className="px-6 py-2.5 rounded-xl bg-[#181818] border border-white/10 hover:border-[#6A00FF] hover:bg-[#6A00FF]/20 text-purple-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <span>Carregar Mais Filmes</span>
                    <span className="text-[10px] font-normal text-gray-400">
                      ({filteredMovies.length - renderedCount} restantes)
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

