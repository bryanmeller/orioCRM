import { supabase } from '../../lib/supabase';

export const createLicense = async (license: any, userId: string, providerId?: string, resellerId?: string) => {
  const { data, error } = await supabase.from('licenses').insert([{
    code: license.code,
    owner_id: userId,
    origin: license.origin,
    plan_id: license.plan_id,
    status: license.status || 'ACTIVE',
    expires_at: license.expires_at,
    devices_allowed: license.devices_allowed || 1,
    max_servers: license.max_servers || 1,
    end_user_id: userId
  }]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const linkServerToLicense = async (licenseId: string, serverId: string) => {
  const { error } = await supabase.from('license_servers').insert([{
    license_id: licenseId,
    server_id: serverId
  }]);
  if (error) throw new Error(error.message);
};

export const deleteLicense = async (id: string) => {
  const { error } = await supabase.from('licenses')
    .update({ status: 'INACTIVE' }) // Logic delete or just inactive
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const toggleLicenseStatus = async (id: string, currentStatus: string) => {
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const { error } = await supabase.from('licenses')
    .update({ status: newStatus })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

export const convertTrialLicense = async (licenseId: string, planId?: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const res = await fetch('/api/admin/convert-trial', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ licenseId, planId })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao converter teste.');
  }
  return data;
};

export const renewLicense = async (licenseId: string, planId?: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch('/api/admin/renew-license', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ licenseId, planId })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao renovar licença.');
  }
  return data;
};

export const resetUserPassword = async (userId: string, newPassword: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch('/api/admin/reset-user-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId, newPassword })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao redefinir senha do usuário.');
  }
  return data;
};

