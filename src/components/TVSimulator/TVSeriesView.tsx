import React, { useState, useEffect } from 'react';
import { Tv2, Star, Heart, Sparkles, Loader2, Film } from 'lucide-react';

interface TVSeriesViewProps {
  focusedRow: number;
  focusedCol: number;
  onPlayEpisode?: (series: Series, season: number, episode: any) => void;
}

export interface Series {
  id: string;
  seriesId: string;
  title: string;
  category: string;
  categoryId: string;
  rating?: string;
  backdropImage: string;
  posterImage: string;
  synopsis?: string;
  year?: string;
  genre?: string;
}

interface CategoryOption {
  id: string;
  label: string;
}

export const TVSeriesView: React.FC<TVSeriesViewProps> = ({ focusedRow, focusedCol }) => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
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
    loadXtreamSeriesContent();
  }, []);

  const loadXtreamSeriesContent = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSeriesList([]);
    setCategories([]);

    try {
      const serversRaw = localStorage.getItem('streamflix_servers');
      if (!serversRaw) {
        setErrorMsg('Nenhuma série disponível neste servidor.');
        setLoading(false);
        return;
      }

      let servers: any[] = [];
      try {
        servers = JSON.parse(serversRaw);
      } catch (err) {
        setErrorMsg('Nenhuma série disponível neste servidor.');
        setLoading(false);
        return;
      }

      if (!Array.isArray(servers) || servers.length === 0) {
        setErrorMsg('Nenhuma série disponível neste servidor.');
        setLoading(false);
        return;
      }

      const activeServer = servers[0];
      const baseUrl = activeServer.url || activeServer.baseUrl || '';
      const username = activeServer.username || '';
      const password = activeServer.password || '';

      if (!baseUrl || !username || !password) {
        setErrorMsg('Nenhuma série disponível neste servidor.');
        setLoading(false);
        return;
      }

      let cleanBase = baseUrl.trim();
      if (!cleanBase.startsWith('http://') && !cleanBase.startsWith('https://')) {
        cleanBase = 'http://' + cleanBase;
      }
      cleanBase = cleanBase.replace(/\/+$/, '');

      const fetchSeriesApi = async (action: string) => {
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

      // 1. Fetch Series Categories (action=get_series_categories)
      const catData = await fetchSeriesApi('get_series_categories');
      const catList: any[] = Array.isArray(catData) ? catData : [];
      const categoryNameMap: Record<string, string> = {};

      catList.forEach((c) => {
        if (c.category_id && c.category_name) {
          categoryNameMap[String(c.category_id)] = String(c.category_name);
        }
      });

      const mappedCategories: CategoryOption[] = [
        { id: 'todos', label: 'Todas as Séries' },
        ...catList.map((c) => ({
          id: String(c.category_id),
          label: String(c.category_name || 'Sem Categoria')
        }))
      ];
      setCategories(mappedCategories);

      // 2. Fetch Series Catalog (action=get_series)
      const seriesData = await fetchSeriesApi('get_series');
      const seriesRawList: any[] = Array.isArray(seriesData) ? seriesData : [];

      if (seriesRawList.length === 0) {
        setErrorMsg('Nenhuma série disponível neste servidor.');
        setLoading(false);
        return;
      }

      const mappedSeries: Series[] = seriesRawList.map((item, idx) => {
        const catIdStr = String(item.category_id || '');
        const catName = categoryNameMap[catIdStr] || 'Geral';

        const plotVal = item.plot || item.description || '';

        let ratingVal = '';
        if (item.rating && item.rating !== '0' && item.rating !== '0.0') {
          ratingVal = String(item.rating);
        } else if (item.rating_5based && Number(item.rating_5based) > 0) {
          ratingVal = (Number(item.rating_5based) * 2).toFixed(1);
        }

        const yearVal = item.releaseDate
          ? String(item.releaseDate).split('-')[0]
          : (item.release_date ? String(item.release_date).split('-')[0] : (item.year ? String(item.year) : ''));

        const posterImg = item.cover || '';
        const backdropImg = (Array.isArray(item.backdrop_path) && item.backdrop_path[0])
          ? item.backdrop_path[0]
          : posterImg;

        return {
          id: String(item.series_id || item.id || `s-${idx}`),
          seriesId: String(item.series_id || ''),
          title: item.name || item.title || 'Série sem Nome',
          category: catName,
          categoryId: catIdStr,
          rating: ratingVal || undefined,
          backdropImage: backdropImg,
          posterImage: posterImg,
          synopsis: plotVal || undefined,
          year: yearVal || undefined,
          genre: item.genre || undefined
        };
      });

      setSeriesList(mappedSeries);
      setSelectedSeries(mappedSeries[0] || null);
      setLoading(false);
    } catch (err: any) {
      setErrorMsg('Nenhuma série disponível neste servidor.');
      setLoading(false);
    }
  };

  const toggleFavorite = (seriesItem: Series) => {
    if (!seriesItem || !seriesItem.id) return;
    let updated: string[];
    if (favorites.includes(seriesItem.id)) {
      updated = favorites.filter((id) => id !== seriesItem.id);
    } else {
      updated = [...favorites, seriesItem.id];
    }
    setFavorites(updated);
    try {
      localStorage.setItem('streamflix_favorites', JSON.stringify(updated));
    } catch (e) {}
  };

  const filteredSeries = seriesList.filter((item) => {
    if (selectedCategory === 'todos') return true;
    return item.categoryId === selectedCategory || item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Synchronize focused item and update top highlight
  const [gridFocusIndex, setGridFocusIndex] = useState<number>(0);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setGridFocusIndex(0);
    setRenderedCount(30);
    const newFiltered = seriesList.filter((s) => {
      if (catId === 'todos') return true;
      return s.categoryId === catId || s.category.toLowerCase() === catId.toLowerCase();
    });
    if (newFiltered.length > 0) {
      setSelectedSeries(newFiltered[0]);
    } else {
      setSelectedSeries(null);
    }
  };

  // Synchronize remote control focus with selected series
  useEffect(() => {
    if (focusedRow === 1 && filteredSeries[focusedCol]) {
      setGridFocusIndex(focusedCol);
      setSelectedSeries(filteredSeries[focusedCol]);
      if (focusedCol >= renderedCount - 5) {
        setRenderedCount((prev) => Math.min(filteredSeries.length, prev + 30));
      }
    }
  }, [focusedRow, focusedCol, filteredSeries, renderedCount]);

  // Handle 4-way D-Pad keyboard navigation inside grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedRow !== 1 || filteredSeries.length === 0) return;

      const cols = window.innerWidth >= 1024 ? 5 : window.innerWidth >= 768 ? 4 : 3;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setGridFocusIndex((prev) => {
          const next = Math.min(filteredSeries.length - 1, prev + 1);
          setSelectedSeries(filteredSeries[next]);
          if (next >= renderedCount - 5) {
            setRenderedCount((r) => Math.min(filteredSeries.length, r + 30));
          }
          return next;
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setGridFocusIndex((prev) => {
          const next = Math.max(0, prev - 1);
          setSelectedSeries(filteredSeries[next]);
          return next;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setGridFocusIndex((prev) => {
          const next = Math.min(filteredSeries.length - 1, prev + cols);
          setSelectedSeries(filteredSeries[next]);
          if (next >= renderedCount - 5) {
            setRenderedCount((r) => Math.min(filteredSeries.length, r + 30));
          }
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setGridFocusIndex((prev) => {
          if (prev - cols >= 0) {
            const next = prev - cols;
            setSelectedSeries(filteredSeries[next]);
            return next;
          }
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedRow, filteredSeries, gridFocusIndex, renderedCount]);

  const displayedSeries = filteredSeries.slice(0, renderedCount);
  const isFav = selectedSeries ? favorites.includes(selectedSeries.id) : false;

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Loading State */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-purple-400 font-bold text-sm gap-3">
          <Loader2 size={32} className="animate-spin" />
          <span>Carregando catálogo de séries...</span>
        </div>
      ) : errorMsg || seriesList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#121212] border border-white/10 rounded-2xl p-8 text-center gap-3">
          <Tv2 size={40} className="text-gray-500" />
          <p className="text-gray-300 font-bold text-sm">{errorMsg || 'Nenhuma série disponível neste servidor.'}</p>
        </div>
      ) : (
        <>
          {/* TOP HIGHLIGHT / FEATURED AREA */}
          {selectedSeries && (
            <div className="relative rounded-2xl overflow-hidden bg-[#121212] border border-white/10 h-48 shrink-0 shadow-2xl transition-all duration-300">
              {selectedSeries.backdropImage || selectedSeries.posterImage ? (
                <img
                  src={selectedSeries.backdropImage || selectedSeries.posterImage}
                  alt={selectedSeries.title}
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
                      {selectedSeries.category || 'SÉRIE'}
                    </span>
                    {selectedSeries.rating && (
                      <span className="text-xs font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                        <Star size={11} className="fill-amber-300 text-amber-300" />
                        {selectedSeries.rating}
                      </span>
                    )}
                    {selectedSeries.year && (
                      <span className="text-xs text-gray-300 font-mono bg-black/50 px-2 py-0.5 rounded border border-white/10">
                        {selectedSeries.year}
                      </span>
                    )}
                    {selectedSeries.genre && (
                      <span className="text-xs text-purple-300 font-medium truncate max-w-[200px]">
                        {selectedSeries.genre}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleFavorite(selectedSeries)}
                    className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
                      isFav
                        ? 'bg-purple-600/40 border-purple-500 text-purple-300'
                        : 'bg-black/60 border-white/10 text-white hover:border-[#6A00FF]'
                    }`}
                  >
                    <Heart size={14} className={isFav ? 'fill-purple-500 text-purple-500' : ''} />
                  </button>
                </div>

                {/* Main Info */}
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <h2 className="text-xl font-extrabold text-white tracking-tight leading-tight line-clamp-1">
                      {selectedSeries.title}
                    </h2>
                    {selectedSeries.synopsis && (
                      <p className="text-[11px] text-gray-300 line-clamp-2 font-normal leading-relaxed">
                        {selectedSeries.synopsis}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY FILTER PILLS */}
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
          {filteredSeries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#121212] border border-white/10 rounded-2xl p-8 text-center gap-2">
              <Film size={36} className="text-gray-600" />
              <p className="text-gray-400 text-xs font-bold">Nenhuma série encontrada nesta categoria.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#121212] p-4 rounded-2xl border border-white/10">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-1 px-0.5">
                {displayedSeries.map((series, idx) => {
                  const isItemFocused = (focusedRow === 1 && gridFocusIndex === idx) || selectedSeries?.id === series.id;
                  const isItemFav = favorites.includes(series.id);
                  const imageFailed = failedImages[series.id];

                  return (
                    <div
                      key={series.id}
                      tabIndex={0}
                      onMouseEnter={() => {
                        setGridFocusIndex(idx);
                        setSelectedSeries(series);
                      }}
                      onClick={() => {
                        setGridFocusIndex(idx);
                        setSelectedSeries(series);
                      }}
                      className={`w-full cursor-pointer transition-all duration-300 outline-none group rounded-xl ${
                        isItemFocused
                          ? 'border-2 border-[#6A00FF] shadow-[0_0_20px_rgba(106,0,255,0.8)] ring-2 ring-purple-400 scale-105 z-10'
                          : 'hover:scale-[1.02] border border-white/10 hover:border-white/30'
                      }`}
                    >
                      {/* Vertical Poster Container (aspect 2/3) */}
                      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#181818] flex items-center justify-center">
                        {!imageFailed && series.posterImage ? (
                          <img
                            src={series.posterImage}
                            alt={series.title}
                            loading="lazy"
                            onError={() => setFailedImages((prev) => ({ ...prev, [series.id]: true }))}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="p-3 text-center flex flex-col items-center justify-center h-full w-full bg-[#1a1a1a]">
                            <Tv2 size={28} className="text-purple-400/60 mb-2" />
                            <span className="text-[11px] font-bold text-gray-300 line-clamp-3 leading-tight">
                              {series.title}
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-80 group-hover:opacity-100 transition-opacity" />

                        {/* Rating Badge */}
                        {series.rating && (
                          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                            <Star size={9} className="fill-amber-300 text-amber-300" />
                            {series.rating}
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
                          {series.title}
                        </h5>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5 font-mono">
                          <span className="truncate max-w-[90px]">{series.category}</span>
                          {series.year && <span className="shrink-0">{series.year}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Incremental Load More Button if catalog has more */}
              {renderedCount < filteredSeries.length && (
                <div className="w-full py-6 flex justify-center">
                  <button
                    onClick={() => setRenderedCount((prev) => Math.min(filteredSeries.length, prev + 30))}
                    className="px-6 py-2.5 rounded-xl bg-[#181818] border border-white/10 hover:border-[#6A00FF] hover:bg-[#6A00FF]/20 text-purple-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <span>Carregar Mais Séries</span>
                    <span className="text-[10px] font-normal text-gray-400">
                      ({filteredSeries.length - renderedCount} restantes)
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


