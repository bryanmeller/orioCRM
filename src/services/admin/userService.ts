import { secureFetchJSON } from './apiUtils';
import { supabase } from '../../lib/supabase';

export const createAccount = async (payload: {
  email: string;
  password?: string;
  full_name: string;
  role: string;
  parent_id?: string;
  business_mode?: string;
  plan_id?: string;
  
  status?: string;
}) => {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  if (!token) throw new Error("Sessão expirada. Entre novamente.");

  const result = await secureFetchJSON('/api/admin/create-auth-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  if (result.success !== true || result.profileCreated !== true) {
    throw new Error('Criação não concluída completamente.');
  }
  
  return result.user;
};

export const updateAccount = async (payload: {
  id: string;
  full_name?: string;
  email?: string;
  status?: string;
  parent_id?: string | null;
  plan_id?: string;
}) => {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  if (!token) throw new Error("Sessão administrativa inválida. Entre novamente.");

  const result = await secureFetchJSON('/api/admin/update-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  if (result.success !== true) {
    throw new Error(result.error || 'Erro ao atualizar conta.');
  }
  
  return result;
};

export const deleteAccount = async (id: string) => {
  // Logical delete of profile
  const { error } = await supabase.from('profiles').update({ status: 'ARCHIVED' }).eq('id', id);
  if (error) throw new Error(error.message);
};

export const toggleAccountStatus = async (id: string, currentStatus: string) => {
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
  if (error) throw new Error(error.message);
};
