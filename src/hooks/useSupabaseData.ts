import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseData(currentUser: any | null) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [providerPlans, setProviderPlans] = useState<any[]>([]);
  const [providerSubscriptions, setProviderSubscriptions] = useState<any[]>([]);
  const [accountDnsList, setAccountDnsList] = useState<any[]>([]);
  const [endUsers, setEndUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [
        { data: accData },
        { data: balData },
        { data: txData },
        { data: licData },
        { data: lpData },
        { data: ppData },
        { data: psData },
        { data: dnsData },
        { data: euData },
        { data: ssData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('credit_balances').select('*'),
        supabase.from('credit_transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('licenses').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('license_plans').select('id, name, validity_days, reseller_credit_cost, self_service_price, devices_allowed, max_servers, trial_days, status, deleted_at').is('deleted_at', null).order('validity_days', { ascending: true }),
        supabase.from('provider_plans').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('provider_subscriptions').select('*'),
        supabase.from('iptv_servers').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'END_USER').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('system_settings').select('*'),
      ]);
      
      if (accData) setAccounts(accData);
      if (balData) setBalances(balData);
      if (txData) setTransactions(txData);
      if (licData) setLicenses(licData);
      if (lpData) setPlans(lpData);
      if (ppData) setProviderPlans(ppData);
      if (psData) setProviderSubscriptions(psData);
      if (dnsData) setAccountDnsList(dnsData);
      if (euData) setEndUsers(euData);
      if (ssData) setSystemSettings(ssData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentUser, loadData]);

  return {
    accounts, setAccounts,
    balances, setBalances,
    transactions, setTransactions,
    licenses, setLicenses,
    plans, setPlans,
    providerPlans, setProviderPlans,
    providerSubscriptions, setProviderSubscriptions,
    accountDnsList, setAccountDnsList,
    endUsers, setEndUsers,
    orders, setOrders,
    systemSettings, setSystemSettings,
    loading,
    reload: loadData
  };
}
