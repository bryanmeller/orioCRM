import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Loader2,
  Sliders,
  Check,
  Subtitles,
  Info,
  Terminal,
} from 'lucide-react';

export interface MediaPlayItem {
  id: string;
  title: string;
  category?: string;
  type: 'live' | 'movie' | 'episode';
  streamUrl?: string;
  posterImage?: string;
  backdropImage?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  duration?: string;
}

interface PlayerScreenModalProps {
  media: MediaPlayItem;
  streamUrl?: string;
  onClose: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
}

// Helper to mask username & password credentials in displayed URLs
function sanitizeUrl(rawUrl?: string): string {
  if (!rawUrl) return 'Sem URL informada';
  try {
    const u = new URL(rawUrl);
    if (u.username) u.username = '***';
    if (u.password) u.password = '***';
    if (u.searchParams.has('username')) u.searchParams.set('username', '***');
    if (u.searchParams.has('user')) u.searchParams.set('user', '***');
    if (u.searchParams.has('password')) u.searchParams.set('password', '***');
    if (u.searchParams.has('pass')) u.searchParams.set('pass', '***');
    return u.toString();
  } catch {
    return rawUrl.replace(/(username|user|password|pass)=([^&]+)/gi, '$1=***');
  }
}

export const PlayerScreenModal: React.FC<PlayerScreenModalProps> = ({
  media,
  streamUrl,
  onClose,
  onNextChannel,
  onPrevChannel,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playerState, setPlayerState] = useState<'loading' | 'playing' | 'error' | 'ended'>('loading');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(media.type === 'live' ? 0 : 7200);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [activeSettingsMenu, setActiveSettingsMenu] = useState<'none' | 'audio' | 'subtitles' | 'quality'>('none');
  const [selectedAudio, setSelectedAudio] = useState<string>('pt-BR (5.1 Surround)');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('Desativado');
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto (1080p 60fps)');

  // Diagnostic state
  const [detectedFormat, setDetectedFormat] = useState<string>('Analisando...');
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);
  const [lastMediaEvent, setLastMediaEvent] = useState<string>('iniciando');
  const [hlsSupported, setHlsSupported] = useState<boolean | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(true);

  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hlsInstanceRef = useRef<any>(null);

  const rawUrl =
    streamUrl ||
    media.streamUrl ||
    (typeof window !== 'undefined' ? (window as any).__lastSelectedStreamUrl : '') ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('streamflix_current_stream_url') : '') ||
    '';
  const maskedUrl = sanitizeUrl(rawUrl);

  // Format detection logic
  useEffect(() => {
    let urlPath = '';
    try {
      urlPath = new URL(rawUrl).pathname.toLowerCase();
    } catch {
      urlPath = rawUrl.toLowerCase();
    }

    const isTs = urlPath.endsWith('.ts') || rawUrl.toLowerCase().includes('.ts');
    const isHls = urlPath.endsWith('.m3u8') || rawUrl.toLowerCase().includes('.m3u8') || rawUrl.toLowerCase().includes('output=hls');

    if (isTs) {
      setDetectedFormat('MPEG-TS (.ts)');
      setPlayerState('error');
      setDiagnosticError('O simulador web não reproduz TS bruto. Use uma lista com output=hls ou teste no aplicativo Android/TV.');
    } else if (isHls) {
      setDetectedFormat('HLS (.m3u8)');
    } else {
      setDetectedFormat('Vídeo Direto / Outro');
    }
  }, [rawUrl]);

  // HLS and Video Event Listeners
  useEffect(() => {
    let urlPath = '';
    try {
      urlPath = new URL(rawUrl).pathname.toLowerCase();
    } catch {
      urlPath = rawUrl.toLowerCase();
    }
    const isTs = urlPath.endsWith('.ts') || rawUrl.toLowerCase().includes('.ts');

    if (isTs || !rawUrl) return;

    setPlayerState('loading');
    setDiagnosticError(null);
    setLastMediaEvent('carregando_midia');

    const video = videoRef.current;
    if (!video) return;

    // Attach video DOM event listeners
    const handleLoadedMetadata = () => {
      setLastMediaEvent('loadedmetadata');
      if (video.duration && !isNaN(video.duration) && video.duration !== Infinity) {
        setDurationSeconds(Math.floor(video.duration));
      }
    };
    const handleCanPlay = () => {
      setLastMediaEvent('canplay');
      setPlayerState('playing');
    };
    const handlePlaying = () => {
      setLastMediaEvent('playing');
      setPlayerState('playing');
      setIsPlaying(true);
    };
    const handleStalled = () => {
      setLastMediaEvent('stalled');
    };
    const handleWaiting = () => {
      setLastMediaEvent('waiting');
      setPlayerState('loading');
    };
    const handleError = () => {
      setLastMediaEvent('error');
      setPlayerState('error');
      const err = video.error;
      let errMsg = 'Erro desconhecido na reprodução de vídeo.';
      if (err) {
        switch (err.code) {
          case 1:
            errMsg = `Erro Abortado (code 1): ${err.message || 'Processo interrompido.'}`;
            break;
          case 2:
            errMsg = 'A reprodução deste servidor não está disponível no navegador de preview. Teste no aplicativo instalado.';
            break;
          case 3:
            errMsg = `Erro de Decodificação (code 3): ${err.message || 'Codec não suportado pelo navegador.'}`;
            break;
          case 4:
            errMsg = 'A reprodução deste servidor não está disponível no navegador de preview. Teste no aplicativo instalado.';
            break;
          default:
            errMsg = `Erro de Vídeo (code ${err.code}): ${err.message || 'Falha de execução.'}`;
        }
      }
      setDiagnosticError(errMsg);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('error', handleError);

    // HLS.js setup if available or dynamic script load
    const isHls = urlPath.endsWith('.m3u8') || rawUrl.toLowerCase().includes('.m3u8') || rawUrl.toLowerCase().includes('output=hls');

    const setupHls = () => {
      const HlsClass = (window as any).Hls;
      if (HlsClass && HlsClass.isSupported()) {
        setHlsSupported(true);
        if (hlsInstanceRef.current) {
          hlsInstanceRef.current.destroy();
        }
        const hls = new HlsClass();
        hlsInstanceRef.current = hls;
        hls.loadSource(rawUrl);
        hls.attachMedia(video);

        hls.on(HlsClass.Events.ERROR, (_evt: any, data: any) => {
          console.warn('Hls.js Error:', data);
          if (data.fatal) {
            setPlayerState('error');
            const fatalMsg = `Falha HLS [fatal: ${data.fatal}] - Type: ${data.type} | Details: ${data.details}`;
            if (data.details === 'manifestLoadError' || data.type === 'networkError') {
              setDiagnosticError('A reprodução deste servidor não está disponível no navegador de preview. Teste no aplicativo instalado.');
            } else {
              setDiagnosticError(fatalMsg);
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        setHlsSupported(true);
        video.src = rawUrl;
      } else {
        setHlsSupported(false);
        video.src = rawUrl;
      }
    };

    if (isHls) {
      if ((window as any).Hls) {
        setupHls();
      } else {
        // Load HLS.js dynamically if not already on window
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.onload = () => {
          setupHls();
        };
        script.onerror = () => {
          setHlsSupported(false);
          video.src = rawUrl;
        };
        document.head.appendChild(script);
      }
    } else {
      video.src = rawUrl;
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('error', handleError);

      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [rawUrl]);

  // Play/pause video DOM element sync
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch((err) => {
          console.warn('Playback play() fail:', err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Volume & Mute sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Auto-hide controls
  const resetControlsTimer = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (activeSettingsMenu === 'none') {
        setShowControls(false);
      }
    }, 4500);
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [isPlaying, activeSettingsMenu]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimer();
      if (e.key === 'Escape' || e.key === 'Backspace') {
        onClose();
      } else if (e.key === ' ' || e.key === 'Enter') {
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'ArrowLeft') {
        if (media.type === 'live' && onPrevChannel) {
          onPrevChannel();
        } else {
          if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        }
      } else if (e.key === 'ArrowRight') {
        if (media.type === 'live' && onNextChannel) {
          onNextChannel();
        } else {
          if (videoRef.current) videoRef.current.currentTime = Math.min(durationSeconds, videoRef.current.currentTime + 10);
        }
      } else if (e.key === 'ArrowUp') {
        setVolume((v) => Math.min(100, v + 10));
      } else if (e.key === 'ArrowDown') {
        setVolume((v) => Math.max(0, v - 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [media.type, onPrevChannel, onNextChannel, durationSeconds, onClose]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      onMouseMove={resetControlsTimer}
      className="fixed inset-0 z-50 bg-[#080808] flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* REAL VIDEO PLAYER & BACKDROP CANVAS */}
      <div className="absolute inset-0 bg-[#080808] flex items-center justify-center overflow-hidden">
        {/* Real HTML5 Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain z-10"
          playsInline
          autoPlay
        />

        {/* Ambient Backdrop Poster if video is not playing */}
        {playerState !== 'playing' && (media.backdropImage || media.posterImage) && (
          <img
            src={media.backdropImage || media.posterImage}
            alt={media.title}
            className="absolute inset-0 w-full h-full object-cover filter brightness-40 blur-sm z-0"
          />
        )}

        {/* Ambient Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/80 z-10 pointer-events-none" />

        {/* Live Stream Watermark */}
        {media.type === 'live' && playerState === 'playing' && (
          <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-red-500/40 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">AO VIVO 1080p</span>
          </div>
        )}

        {/* PLAYER STATES */}
        {playerState === 'loading' && (
          <div className="absolute z-30 flex flex-col items-center justify-center p-6 bg-[#121212]/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl max-w-md text-center">
            <Loader2 size={36} className="text-purple-400 animate-spin mb-3" />
            <h3 className="text-sm font-extrabold text-white mb-1">Carregando transmissão...</h3>
            <p className="text-xs text-gray-400 font-mono mt-1">Evento: {lastMediaEvent}</p>
          </div>
        )}

        {playerState === 'error' && (
          <div className="absolute z-30 flex flex-col items-center justify-center p-6 bg-[#121212]/95 backdrop-blur-md rounded-2xl border border-red-500/40 text-center max-w-lg shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-sm font-extrabold text-white mb-1">Causa Técnica da Falha</h3>
            <p className="text-xs text-red-300 bg-red-950/60 p-3 rounded-xl border border-red-500/30 text-left font-mono my-2 w-full break-words">
              {diagnosticError || 'Não foi possível carregar a transmissão de vídeo.'}
            </p>
            <div className="text-[11px] text-gray-400 space-y-1 text-left w-full bg-black/40 p-2.5 rounded-lg border border-white/5 font-mono">
              <p><strong className="text-gray-300">Formato:</strong> {detectedFormat}</p>
              <p><strong className="text-gray-300">Último Evento:</strong> {lastMediaEvent}</p>
              <p><strong className="text-gray-300">Hls.isSupported():</strong> {hlsSupported === null ? 'Verificando...' : hlsSupported ? 'Sim' : 'Não'}</p>
              <p className="truncate"><strong className="text-gray-300">URL Sanitizada:</strong> {maskedUrl}</p>
            </div>
            <button
              onClick={() => {
                setPlayerState('loading');
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="mt-4 px-5 py-2 rounded-xl bg-[#6A00FF] text-white font-bold text-xs hover:bg-[#801AFF] transition-all cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {playerState === 'ended' && (
          <div className="absolute z-30 flex flex-col items-center justify-center p-6 bg-[#121212]/95 backdrop-blur-md rounded-2xl border border-white/10 text-center max-w-sm shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-[#6A00FF]/20 text-purple-400 flex items-center justify-center mb-3">
              <RotateCcw size={24} />
            </div>
            <h3 className="text-sm font-extrabold text-white mb-1">Reprodução Finalizada</h3>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(() => {});
                  }
                  setPlayerState('playing');
                  setIsPlaying(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#6A00FF] text-white font-bold text-xs hover:bg-[#801AFF] transition-all cursor-pointer"
              >
                Assistir Novamente
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY CONTROLS */}
      <div
        className={`relative z-20 w-full h-full p-6 flex flex-col justify-between transition-opacity duration-300 pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* TOP OVERLAY HEADER */}
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-[#6A00FF] hover:border-[#6A00FF] transition-all shadow-md cursor-pointer"
              title="Voltar"
            >
              <ChevronLeft size={22} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#6A00FF] text-white shadow">
                  {media.category || media.type.toUpperCase()}
                </span>
                <span className="text-xs text-gray-300 font-mono">
                  {media.type === 'live'
                    ? 'TV ao Vivo'
                    : media.type === 'movie'
                    ? 'Filme'
                    : `Série • Temp. ${media.seasonNumber || 1} Ep. ${media.episodeNumber || 1}`}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white tracking-tight leading-snug">{media.title}</h2>
            </div>
          </div>

          {/* Settings Menu Toggle Buttons */}
          <div className="flex items-center gap-2 relative pointer-events-auto">
            <button
              onClick={() => setShowDiagnostics((d) => !d)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                showDiagnostics
                  ? 'bg-purple-900/80 text-purple-200 border-purple-500'
                  : 'bg-black/60 backdrop-blur-md border-white/10 text-gray-300 hover:text-white'
              }`}
              title="Painel de Diagnóstico"
            >
              <Terminal size={15} />
              <span className="hidden md:inline">Diagnóstico</span>
            </button>

            <button
              onClick={() => setActiveSettingsMenu((m) => (m === 'audio' ? 'none' : 'audio'))}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSettingsMenu === 'audio'
                  ? 'bg-[#6A00FF] text-white border-purple-400'
                  : 'bg-black/60 backdrop-blur-md border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <Volume2 size={15} />
              <span className="hidden md:inline">Áudio</span>
            </button>

            <button
              onClick={() => setActiveSettingsMenu((m) => (m === 'subtitles' ? 'none' : 'subtitles'))}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSettingsMenu === 'subtitles'
                  ? 'bg-[#6A00FF] text-white border-purple-400'
                  : 'bg-black/60 backdrop-blur-md border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <Subtitles size={15} />
              <span className="hidden md:inline">Legendas</span>
            </button>

            <button
              onClick={() => setActiveSettingsMenu((m) => (m === 'quality' ? 'none' : 'quality'))}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSettingsMenu === 'quality'
                  ? 'bg-[#6A00FF] text-white border-purple-400'
                  : 'bg-black/60 backdrop-blur-md border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <Sliders size={15} />
              <span className="hidden md:inline">Qualidade</span>
            </button>

            {/* Submenus */}
            {activeSettingsMenu !== 'none' && (
              <div className="absolute top-12 right-0 bg-[#121212] border border-white/10 p-3 rounded-2xl shadow-2xl z-40 w-56 text-xs text-white space-y-2 backdrop-blur-xl">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-extrabold uppercase text-[10px] text-gray-300">
                    {activeSettingsMenu === 'audio'
                      ? 'Faixa de Áudio'
                      : activeSettingsMenu === 'subtitles'
                      ? 'Legendas'
                      : 'Qualidade de Vídeo'}
                  </span>
                  <button onClick={() => setActiveSettingsMenu('none')}>
                    <X size={14} className="text-gray-400 hover:text-white" />
                  </button>
                </div>

                {activeSettingsMenu === 'audio' && (
                  <div className="space-y-1">
                    {['pt-BR (5.1 Surround)', 'en-US (Original)', 'es-ES (Dublado)'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSelectedAudio(opt);
                          setActiveSettingsMenu('none');
                        }}
                        className={`w-full p-2 rounded-xl text-left flex items-center justify-between ${
                          selectedAudio === opt ? 'bg-[#6A00FF] text-white font-bold' : 'hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedAudio === opt && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}

                {activeSettingsMenu === 'subtitles' && (
                  <div className="space-y-1">
                    {['Desativado', 'Português (Brasil)', 'English (CC)', 'Espanhol'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSelectedSubtitle(opt);
                          setActiveSettingsMenu('none');
                        }}
                        className={`w-full p-2 rounded-xl text-left flex items-center justify-between ${
                          selectedSubtitle === opt ? 'bg-[#6A00FF] text-white font-bold' : 'hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedSubtitle === opt && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}

                {activeSettingsMenu === 'quality' && (
                  <div className="space-y-1">
                    {['Auto (1080p 60fps)', '4K Ultra HD (2160p)', 'FHD 1080p', 'HD 720p'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSelectedQuality(opt);
                          setActiveSettingsMenu('none');
                        }}
                        className={`w-full p-2 rounded-xl text-left flex items-center justify-between ${
                          selectedQuality === opt ? 'bg-[#6A00FF] text-white font-bold' : 'hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedQuality === opt && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* DIAGNOSTIC PANEL Overlay */}
        {showDiagnostics && (
          <div className="pointer-events-auto self-start bg-black/85 backdrop-blur-md p-3.5 rounded-xl border border-purple-500/30 text-[11px] font-mono text-gray-200 max-w-xl space-y-1 shadow-lg my-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
              <span className="font-extrabold text-purple-400 flex items-center gap-1.5">
                <Info size={14} />
                Diagnóstico Técnico do Player
              </span>
              <button
                onClick={() => setShowDiagnostics(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <p className="truncate"><strong className="text-gray-400">URL Sanitizada:</strong> {maskedUrl}</p>
            <p><strong className="text-gray-400">Formato Detectado:</strong> <span className="text-purple-300 font-bold">{detectedFormat}</span></p>
            <p><strong className="text-gray-400">Evento de Mídia:</strong> <span className="text-emerald-400">{lastMediaEvent}</span></p>
            <p><strong className="text-gray-400">Suporte HLS Nativo/JS:</strong> {hlsSupported === null ? 'Verificando...' : hlsSupported ? 'Sim (Suportado)' : 'Não (Incompatível)'}</p>
            {diagnosticError && (
              <p className="text-red-400 font-bold bg-red-950/40 p-1.5 rounded border border-red-500/20 mt-1">
                {diagnosticError}
              </p>
            )}
          </div>
        )}

        {/* BOTTOM OVERLAY CONTROLS BAR */}
        <div className="bg-[#121212]/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl space-y-3 pointer-events-auto">
          {media.type !== 'live' ? (
            <div className="space-y-1">
              <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#6A00FF] rounded-full transition-all duration-300"
                  style={{ width: `${(currentTime / (durationSeconds || 1)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(durationSeconds)}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs font-mono text-gray-300 border-b border-white/10 pb-2">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sinal ao Vivo
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                Formato: {detectedFormat}
              </span>
            </div>
          )}

          {/* Action Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {media.type === 'live' ? (
                <>
                  <button
                    onClick={onPrevChannel}
                    disabled={!onPrevChannel}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-[#6A00FF] text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                    <span>Canal Anterior</span>
                  </button>
                  <button
                    onClick={onNextChannel}
                    disabled={!onNextChannel}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-[#6A00FF] text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <span>Próximo Canal</span>
                    <ChevronRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                    }}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    title="-10s"
                  >
                    <RotateCcw size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime = Math.min(durationSeconds, videoRef.current.currentTime + 10);
                    }}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    title="+10s"
                  >
                    <RotateCw size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="w-12 h-12 rounded-2xl bg-[#6A00FF] hover:bg-[#801AFF] text-white flex items-center justify-center shadow-[0_0_20px_rgba(106,0,255,0.7)] border border-white/20 scale-105 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause size={22} className="fill-white" /> : <Play size={22} className="fill-white ml-0.5" />}
            </button>

            {/* Volume & Fullscreen */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <button onClick={() => setIsMuted((m) => !m)} className="text-white">
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-20 accent-[#6A00FF] cursor-pointer"
                />
              </div>

              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Sair"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

