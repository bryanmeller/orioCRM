export const secureFetchJSON = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    const preview = text.substring(0, 100).replace(/\n/g, ' ');
    throw new Error(`O servidor respondeu em formato inválido. Verifique a configuração da API. Status: ${response.status}. URL: ${url}. Content-Type: ${contentType}. Resposta: ${preview}`);
  }
  
  const data = await response.json();
  if (!response.ok || data.success === false) {
    let msg = 'Erro na requisição';
    if (typeof data.error === 'string') {
      msg = data.error;
    } else if (data.error && typeof data.error.message === 'string') {
      msg = data.error.message;
    } else if (typeof data.message === 'string') {
      msg = data.message;
    } else if (data.error && typeof data.error === 'object') {
      msg = data.error.message || data.error.code || JSON.stringify(data.error);
    } else if (typeof data === 'string') {
      msg = data;
    }
    const err = new Error(msg);
    (err as any).data = data;
    throw err;
  }
  
  return data;
};
