import { supabase } from '../../lib/supabase';

export const createServer = async (server: any, ownerId: string) => {
  const rawType = (server.connection_type || server.method || '').toString().toUpperCase();
  const connType = rawType === 'M3U' ? 'M3U' : 'XTREAM_MANUAL';

  const { data, error } = await supabase.from('iptv_servers').insert([{
    name: server.name,
    connection_type: connType,
    url: server.url,
    username: server.username || null,
    password: server.password || null,
    owner_id: ownerId
  }]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateServer = async (id: string, server: any) => {
  const rawType = (server.connection_type || server.method || '').toString().toUpperCase();
  const connType = rawType === 'M3U' ? 'M3U' : 'XTREAM_MANUAL';

  const { data, error } = await supabase.from('iptv_servers').update({
    name: server.name,
    connection_type: connType,
    url: server.url,
    username: server.username || null,
    password: server.password || null
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
