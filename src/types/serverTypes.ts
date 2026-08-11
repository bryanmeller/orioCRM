export type ServerConnectionType = 'XTREAM_MANUAL' | 'M3U';

export const SERVER_CONNECTION_TYPES = {
  XTREAM_MANUAL: 'XTREAM_MANUAL' as ServerConnectionType,
  M3U: 'M3U' as ServerConnectionType,
} as const;

export const resolveServerConnectionType = (input?: string, url?: string): ServerConnectionType => {
  if (!input && !url) return 'XTREAM_MANUAL';
  const str = (input || '').toString().toUpperCase();
  const urlStr = (url || '').toString().toLowerCase();

  if (str === 'M3U' || urlStr.endsWith('.m3u') || urlStr.endsWith('.m3u8')) {
    return 'M3U';
  }
  return 'XTREAM_MANUAL';
};
