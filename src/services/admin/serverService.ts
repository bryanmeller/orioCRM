import { supabase } from '../../lib/supabase';
import { parseServerInput } from '../../utils/xtreamParser';

export const createServer = async (server: any, ownerId: string) => {
  // 1. Fetch current active servers for this owner
  const { data: currentServers, error: countError } = await supabase
    .from('iptv_servers')
    .select('id, sort_order')
    .eq('owner_id', ownerId)
    .is('deleted_at', null);
    
  if (countError) throw new Error(countError.message);
  
  // 2. Fetch limit from system settings
  const { data: settingsData } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'COMMERCIAL')
    .single();
    
  // Allow fallback limit of 10 if not set
  const limit = settingsData?.setting_value?.provider_default_server_limit || 10;
  
  if (currentServers && currentServers.length >= limit) {
    throw new Error('Você atingiu o limite de Servidores (DNS) permitido para sua conta.');
  }

  // 3. Determine sort_order
  const nextSortOrder = currentServers && currentServers.length > 0 
    ? Math.max(...currentServers.map(s => s.sort_order || 0)) + 1 
    : 1;

  const rawUrl = server.fullUrl || server.url || '';
  const parsed = parseServerInput(rawUrl, server.username, server.password);

  const { data, error } = await supabase.from('iptv_servers').insert([{
    name: server.name || 'Servidor Customizado',
    connection_type: parsed.connectionType,
    url: parsed.baseUrl,
    username: parsed.username || null,
    password: parsed.password || null,
    owner_id: ownerId,
    sort_order: nextSortOrder
  }]).select().single();
  
  if (error) throw new Error(error.message);
  return data;
};

export const updateServer = async (id: string, server: any) => {
  const rawUrl = server.fullUrl || server.url || '';
  const parsed = parseServerInput(rawUrl, server.username, server.password);

  const { data, error } = await supabase.from('iptv_servers').update({
    name: server.name || 'Servidor Customizado',
    connection_type: parsed.connectionType,
    url: parsed.baseUrl,
    username: parsed.username || null,
    password: parsed.password || null
  }).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const toggleServerStatus = async (id: string, currentStatus: string) => {
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const { data, error } = await supabase.from('iptv_servers')
    .update({ status: newStatus })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteServer = async (id: string) => {
  const { data, error } = await supabase.from('iptv_servers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};
