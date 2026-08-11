import { supabase } from '../../lib/supabase';

export const createLicensePlan = async (plan: any) => {
  const { data, error } = await supabase.from('license_plans').insert([{
    name: plan.name,
    description: plan.description || null,
    validity_days: plan.validity_days,
    self_service_price: plan.self_service_price,
    reseller_credit_cost: plan.reseller_credit_cost,
    devices_allowed: plan.devices_allowed,
    max_servers: plan.max_servers,
    trial_days: plan.trial_days || 0,
    status: plan.status || 'ACTIVE'
  }]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateLicensePlan = async (id: string, plan: any) => {
  const { data, error } = await supabase.from('license_plans').update({
    name: plan.name,
    description: plan.description || null,
    validity_days: plan.validity_days,
    self_service_price: plan.self_service_price,
    reseller_credit_cost: plan.reseller_credit_cost,
    devices_allowed: plan.devices_allowed,
    max_servers: plan.max_servers,
    trial_days: plan.trial_days || 0,
    status: plan.status
  }).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const toggleLicensePlanStatus = async (id: string, currentStatus: string) => {
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const { data, error } = await supabase.from('license_plans')
    .update({ status: newStatus })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteLicensePlan = async (id: string) => {
  const { data, error } = await supabase.from('license_plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};
