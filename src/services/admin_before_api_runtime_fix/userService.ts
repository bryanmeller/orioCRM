import { supabase } from '../../lib/supabase';

export const createAccount = async (payload: {
  email: string;
  password?: string;
  full_name: string;
  role: string;
  parent_id?: string;
  business_mode?: string;
  plan_id?: string; // For providers
  server_code?: string;
  status?: string;
}) => {
  // Call our secure backend to create user
  const response = await fetch('/api/admin/create-auth-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Erro ao criar usuário');

  const user = result.user;

  if (payload.role === 'PROVIDER' && payload.plan_id) {
    // get plan details to set dates
    const { data: plan } = await supabase.from('provider_plans').select('*').eq('id', payload.plan_id).single();
    if (plan) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days default
      await supabase.from('provider_subscriptions').insert({
        provider_id: user.id,
        plan_id: plan.id,
        expires_at: expiresAt.toISOString(),
      });
    }
  }

  // Create credit balance
  if (['RESELLER', 'SUB_RESELLER'].includes(payload.role)) {
    await supabase.from('credit_balances').insert({
      owner_id: user.id,
      balance: 0
    });
  }

  return user;
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
