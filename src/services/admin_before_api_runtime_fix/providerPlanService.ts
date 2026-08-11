import { supabase } from '../../lib/supabase';

export const createProviderPlan = async (plan: any) => {
  const { data, error } = await supabase.from('provider_plans').insert([{
    name: plan.name,
    description: plan.description || null,
    monthly_price: plan.monthly_price,
    setup_fee: plan.setup_fee,
    max_active_users: plan.max_active_users,
    max_servers: plan.max_servers,
    status: plan.status || 'ACTIVE'
  }]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateProviderPlan = async (id: string, plan: any) => {
  const { data, error } = await supabase.from('provider_plans').update({
    name: plan.name,
    description: plan.description || null,
    monthly_price: plan.monthly_price,
    setup_fee: plan.setup_fee,
    max_active_users: plan.max_active_users,
    max_servers: plan.max_servers,
    status: plan.status
  }).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const toggleProviderPlanStatus = async (id: string, currentStatus: string) => {
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const { data, error } = await supabase.from('provider_plans')
    .update({ status: newStatus })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteProviderPlan = async (id: string) => {
  const { data, error } = await supabase.from('provider_plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};
