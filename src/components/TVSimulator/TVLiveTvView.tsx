import React, { useState, useEffect } from 'react';
import { ChannelItem } from './components/ChannelCard';
import { Tv, Play, Heart, AlertTriangle, Loader2 } from 'lucide-react';

interface TVLiveTvViewProps {
  focusedRow: number;
  focusedCol: number;
  onPlayChannel?: (channel: ChannelItem) => void;
}

interface CategoryOption {
  id: string;
  label: string;
}

interface XtreamChannelItem extends ChannelItem {
  num?: string | number;
  categoryId?: string;
  iconUrl?: string;
  streamUrl?: string;
}

const formatProgramNow = (item: any): string => {
  let val = item.epg_now || item.current_program || item.now_showing || (item.epg_channel_id ? String(item.epg_channel_id) : 'Programação Ao Vivo');
  val = String(val).replace(/^EPG:\s*/i, '').trim();
  const timeRegex = /^\d{1,2}:\d{2}/;
  if (!timeRegex.test(val)) {
    const time = item.now_start || item.start_time || '13:00';
    val = `${time} ${val}`;
  }
  return val;
};

const formatProgramNext = (item: any): string => {
  let val = item.epg_next || item.next_program || item.next_showing || 'Programação Normal';
  val = String(val).replace(/^A seguir:\s*/i, '').trim();
  const timeRegex = /^\d{1,2}:\d{2}/;
  if (!timeRegex.test(val)) {
    const time = item.next_start || item.next_time || '14:00';
    val = `${time} ${val}`;
  }
  return val;
};

export const TVLiveTvView: React.FC<TVLiveTvViewProps> = ({ focusedRow, focusedCol, onPlayChannel }) => {
  const [channels, setChannels] = useState<XtreamChannelItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [previewChannel, setPreviewChannel] = useState<XtreamChannelItem | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePlayChannel = (ch: XtreamChannelItem | null) => {
    if (!ch || !ch.streamUrl) {
      setErrorMsg('Este canal não possui uma URL de reprodução válida.');
      return;
    }
    setErrorMsg(null);
    if (typeof window !== 'undefined') {
      (window as any).__lastSelectedStreamUrl = ch.streamUrl;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('streamflix_current_stream_url', ch.streamUrl);
    }
    if (onPlayChannel) {
      onPlayChannel({ ...ch, streamUrl: ch.streamUrl });
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('streamflix_favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadXtreamContent();
  }, []);

  const filteredChannels = channels.filter((ch) => {
    if (selectedCategory === 'todos') return true;
    return ch.categoryId === selectedCategory || ch.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  useEffect(() => {
    if (focusedRow === 1 && filteredChannels[focusedCol]) {
      setPreviewChannel(filteredChannels[focusedCol]);
    }
  }, [focusedRow, focusedCol, filteredChannels]);

  const loadXtreamContent = async () => {
    setLoading(true);
    setErrorMsg(null);
    setChannels([]);
    setCategories([]);

    try {
      const serversRaw = localStorage.getItem('streamflix_servers');

      if (!serversRaw) {
        setErrorMsg('Servidor não configurado. Adicione um servidor ou faça login novamente.');
        setLoading(false);
        return;
      }

      let servers: any[] = [];
      try {
        servers = JSON.parse(serversRaw);
      } catch (err) {
        setErrorMsg('Servidor não configurado. Dados de servidor inválidos.');
        setLoading(false);
        return;
      }

      if (!Array.isArray(servers) || servers.length === 0) {
        setErrorMsg('Servidor não configurado. Nenhum servidor vinculado.');
        setLoading(false);
        return;
      }

      const activeServer = servers[0];
      const baseUrl = activeServer.url || activeServer.baseUrl || '';
      const username = activeServer.username || '';
      const password = activeServer.password || '';

      if (!baseUrl || !username || !password) {
        setErrorMsg('Credenciais não encontradas para o servidor de IPTV.');
        setLoading(false);
        return;
      }

      // 1. Fetch Categories
      const catRes = await fetch('/api/lynx/xtream/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, username, password, action: 'categories' })
      });

      const catData = await catRes.json();
      if (!catRes.ok || !catData.success) {
        setErrorMsg(catData.error || 'Credenciais inválidas ou servidor indisponível.');
        setLoading(false);
        return;
      }

      const catList: any[] = Array.isArray(catData.data) ? catData.data : [];
      const categoryNameMap: Record<string, string> = {};

      catList.forEach((c) => {
        if (c.category_id && c.category_name) {
          categoryNameMap[String(c.category_id)] = c.category_name;
        }
      });

      const mappedCategories: CategoryOption[] = [
        { id: 'todos', label: 'Todos os Canais' },
        ...catList.map((c) => ({
          id: String(c.category_id),
          label: String(c.category_name || 'Sem Categoria')
        }))
      ];
      setCategories(mappedCategories);

      // 2. Fetch Streams
      const streamRes = await fetch('/api/lynx/xtream/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, username, password, action: 'streams' })
      });

      const streamData = await streamRes.json();
      if (!streamRes.ok || !streamData.success) {
        setErrorMsg(streamData.error || 'Falha ao obter canais do servidor Xtream.');
        setLoading(false);
        return;
      }

      const streamList: any[] = Array.isArray(streamData.data) ? streamData.data : [];
      if (streamList.length === 0) {
        setErrorMsg('Nenhum canal encontrado no servidor.');
        setLoading(false);
        return;
      }

      const mappedChannels: XtreamChannelItem[] = streamList.map((item, idx) => {
        const catIdStr = String(item.category_id || '');
        const catName = categoryNameMap[catIdStr] || 'Geral';
        const channelNum = item.num || item.number || item.stream_id || (idx + 1);

        let streamUrl = item.streamUrl || item.url || item.direct_source || '';
        if (!streamUrl && item.stream_id && baseUrl && username && password) {
          const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
          const ext = item.container_extension || 'm3u8';
          streamUrl = `${cleanBaseUrl}/live/${username}/${password}/${item.stream_id}.${ext}`;
        }

        return {
          id: String(item.stream_id || item.id || `ch-${idx}`),
          num: String(channelNum),
          name: item.name || item.stream_name || 'Canal sem Nome',
          category: catName,
          categoryId: catIdStr,
          nowShowing: formatProgramNow(item),
          nextShowing: formatProgramNext(item),
          logoBg: 'bg-[#6A00FF]',
          iconUrl: item.stream_icon || '',
          streamUrl
        };
      });

      setChannels(mappedChannels);
      setPreviewChannel(mappedChannels[0]);
      setLoading(false);
    } catch (err: any) {
      setErrorMsg('Erro de conexão ao comunicar com o servidor de IPTV.');
      setLoading(false);
    }
  };

  const toggleFavorite = (channel: ChannelItem) => {
    let updated: string[];
    if (favorites.includes(channel.id)) {
      updated = favorites.filter((id) => id !== channel.id);
    } else {
      updated = [...favorites, channel.id];
    }
    setFavorites(updated);
    localStorage.setItem('streamflix_favorites', JSON.stringify(updated));
  };

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden gap-5">
      {/* FEATURED LIVE PREVIEW BANNER */}
      {previewChannel ? (
        <div className="relative rounded-2xl overflow-hidden bg-[#121212] border border-white/10 h-48 shrink-0 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/85 to-transparent w-3/4 z-10" />
          <img
            src={previewChannel.iconUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80"}
            alt={previewChannel.name}
            className="w-full h-full object-cover filter brightness-75 scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80";
            }}
          />

          <div className="absolute inset-0 p-5 flex flex-col justify-between z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-red-600 text-white flex items-center gap-1 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  AO VIVO
                </span>
                <span className="text-xs text-gray-300 font-bold uppercase">{previewChannel.category}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(previewChannel)}
                  className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:border-[#6A00FF] cursor-pointer"
                >
                  <Heart
                    size={16}
                    className={favorites.includes(previewChannel.id) ? 'fill-purple-500 text-purple-500' : ''}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div className="space-y-1 max-w-xl">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{previewChannel.name}</h2>
                <p className="text-xs font-semibold text-purple-300 flex items-center gap-2">
                  <span>{previewChannel.nowShowing}</span>
                </p>
              </div>

              <button
                onClick={() => handlePlayChannel(previewChannel)}
                className="px-6 py-2.5 rounded-xl bg-[#6A00FF] hover:bg-[#801AFF] text-white font-extrabold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(106,0,255,0.6)] cursor-pointer hover:scale-105 transition-all"
              >
                <Play size={16} className="fill-white" />
                <span>ASSISTIR EM TELA CHEIA</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-[#121212] border border-white/10 h-48 shrink-0 shadow-xl flex items-center justify-center p-6 text-center">
          {loading ? (
            <div className="flex items-center gap-3 text-purple-400 font-bold text-sm">
              <Loader2 size={24} className="animate-spin" />
              <span>CARREGANDO SERVIDOR XTREAM...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-red-400 font-bold text-sm">
              <AlertTriangle size={32} />
              <span>{errorMsg || 'Servidor Indisponível'}</span>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY FILTER PILLS & CHANNELS VERTICAL LIST */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden gap-3 bg-[#121212] p-4 rounded-2xl border border-white/10">
        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2 border-b border-white/10 shrink-0">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#6A00FF] text-white shadow-md border border-purple-400'
                      : 'bg-[#080808] text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  <Tv size={13} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Vertical List Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-purple-400 font-bold text-sm gap-3">
            <Loader2 size={24} className="animate-spin" />
            <span>Carregando lista de canais...</span>
          </div>
        ) : errorMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center border border-red-500/20 rounded-xl p-6 text-center gap-3">
            <AlertTriangle size={36} className="text-red-500" />
            <h4 className="text-white font-extrabold text-sm">Falha ao carregar conteúdo IPTV</h4>
            <p className="text-gray-400 text-xs max-w-md">{errorMsg}</p>
            <button
              onClick={loadXtreamContent}
              className="mt-2 px-5 py-2 rounded-xl bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center rounded-xl p-8 text-center gap-2">
            <Tv size={36} className="text-gray-600" />
            <p className="text-gray-400 text-xs font-bold">Nenhum canal encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-extrabold text-gray-400 uppercase border-b border-white/10 shrink-0 select-none">
              <div className="col-span-4 flex items-center gap-2">
                <span>CANAIS</span>
              </div>
              <div className="col-span-4 truncate">
                <span>AGORA</span>
              </div>
              <div className="col-span-4 truncate">
                <span>PRÓXIMO</span>
              </div>
            </div>

            {/* Channels Scrollable Rows */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden divide-y divide-white/5 pr-1">
              {filteredChannels.map((ch, idx) => {
                const isFocused = focusedRow === 1 && focusedCol === idx;
                const isSelected = previewChannel?.id === ch.id;

                return (
                  <div
                    key={ch.id}
                    onMouseEnter={() => setPreviewChannel(ch)}
                    onClick={() => {
                      setPreviewChannel(ch);
                      handlePlayChannel(ch);
                    }}
                    className={`grid grid-cols-12 gap-3 px-4 py-2.5 items-center text-xs transition-all cursor-pointer select-none rounded-lg my-0.5 ${
                      isFocused || isSelected
                        ? 'bg-[#6A00FF]/30 text-white font-bold border-l-4 border-[#6A00FF] shadow-md'
                        : 'hover:bg-white/5 text-gray-300'
                    }`}
                  >
                    {/* Canal (Número + Nome) */}
                    <div className="col-span-4 flex items-center gap-3 truncate">
                      <span className="w-9 text-purple-400 font-mono text-[11px] font-bold shrink-0">
                        {ch.num}
                      </span>
                      <span className="truncate text-white font-semibold group-hover:text-purple-300">
                        {ch.name}
                      </span>
                    </div>

                    {/* Agora */}
                    <div className="col-span-4 truncate text-purple-200 font-medium text-[11px]">
                      {ch.nowShowing}
                    </div>

                    {/* Próximo */}
                    <div className="col-span-4 truncate text-gray-400 font-normal text-[11px]">
                      {ch.nextShowing}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

