export interface ParsedServerInput {
  connectionType: 'XTREAM_MANUAL' | 'M3U';
  baseUrl: string;
  username: string;
  password: string;
  type?: string;
  output?: string;
  isXtream: boolean;
  isM3u: boolean;
}

export function parseServerInput(
  inputUrl?: string,
  providedUsername?: string,
  providedPassword?: string
): ParsedServerInput {
  let str = (inputUrl || '').trim();
  const userFallback = (providedUsername || '').trim();
  const passFallback = (providedPassword || '').trim();

  if (!str) {
    return {
      connectionType: 'XTREAM_MANUAL',
      baseUrl: '',
      username: userFallback,
      password: passFallback,
      isXtream: true,
      isM3u: false,
    };
  }

  // Prepend http:// if protocol is missing
  let urlStr = str;
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    urlStr = 'http://' + urlStr;
  }

  try {
    const urlObj = new URL(urlStr);
    const params = urlObj.searchParams;

    const extractedUser = (params.get('username') || params.get('user') || userFallback).trim();
    const extractedPass = (params.get('password') || params.get('pass') || passFallback).trim();
    const extractedType = (params.get('type') || '').trim();
    const extractedOutput = (params.get('output') || '').trim();

    const isGetPhp = urlObj.pathname.toLowerCase().includes('get.php');
    const isPlayerApi = urlObj.pathname.toLowerCase().includes('player_api.php');
    const hasCredsInUrl = Boolean((params.get('username') || params.get('user')) && (params.get('password') || params.get('pass')));

    // If get.php, player_api.php, or query string contains credentials, or user provided user/pass
    if (isGetPhp || isPlayerApi || hasCredsInUrl || (extractedUser && extractedPass)) {
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      return {
        connectionType: 'XTREAM_MANUAL',
        baseUrl,
        username: extractedUser,
        password: extractedPass,
        type: extractedType || undefined,
        output: extractedOutput || undefined,
        isXtream: true,
        isM3u: false,
      };
    }

    // Check if it's explicitly an M3U or M3U8 link
    const isM3uLink = urlStr.toLowerCase().includes('.m3u') || urlStr.toLowerCase().includes('.m3u8');
    if (isM3uLink) {
      return {
        connectionType: 'M3U',
        baseUrl: urlStr,
        username: extractedUser,
        password: extractedPass,
        isXtream: false,
        isM3u: true,
      };
    }

    // Fallback: Default to Xtream Manual with base URL
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    return {
      connectionType: 'XTREAM_MANUAL',
      baseUrl,
      username: extractedUser,
      password: extractedPass,
      isXtream: true,
      isM3u: false,
    };
  } catch (err) {
    // If URL parsing fails completely
    const isM3uFallback = str.toLowerCase().includes('.m3u');
    return {
      connectionType: isM3uFallback ? 'M3U' : 'XTREAM_MANUAL',
      baseUrl: str,
      username: userFallback,
      password: passFallback,
      isXtream: !isM3uFallback,
      isM3u: isM3uFallback,
    };
  }
}

export async function testXtreamConnection(
  baseUrl: string,
  username: string,
  password: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    if (!baseUrl || !username || !password) {
      return { success: false, message: 'URL Base, Usuário e Senha são obrigatórios para testar a conexão.' };
    }

    let cleanBase = baseUrl.trim();
    if (!cleanBase.startsWith('http://') && !cleanBase.startsWith('https://')) {
      cleanBase = 'http://' + cleanBase;
    }
    // Remove trailing slash
    cleanBase = cleanBase.replace(/\/+$/, '');

    const apiUrl = `${cleanBase}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, message: `O servidor retornou erro HTTP ${res.status}.` };
    }

    const data = await res.json();
    if (data && data.user_info) {
      const auth = data.user_info.auth;
      const status = data.user_info.status;
      if (auth === 1 || status === 'Active') {
        const expDate = data.user_info.exp_date ? new Date(parseInt(data.user_info.exp_date) * 1000).toLocaleDateString('pt-BR') : 'Ilimitado';
        return {
          success: true,
          message: `Conexão estabelecida com sucesso! Status: ${status || 'Ativo'}, Expira em: ${expDate}`,
          data: data.user_info
        };
      } else {
        return { success: false, message: `Servidor acessível, porém o usuário/senha está com status: ${status || 'Inativo'}` };
      }
    }

    return { success: true, message: 'Servidor respondeu com sucesso ao teste Xtream.' };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, message: 'Tempo limite esgotado ao conectar ao servidor Xtream (Timeout 8s).' };
    }
    return { success: false, message: `Falha ao conectar no servidor Xtream: ${err.message || 'Erro de rede'}` };
  }
}
