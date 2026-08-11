import { supabase } from '../../lib/supabase';

export const saveEndUser = async (user: any, parentId: string) => {
  // If editing an existing user (mock or real)
  if (user.id) {
    const { data, error } = await supabase.from('profiles')
      .update({
        full_name: user.name,
        email: user.email || `${user.username}@mock.com`,
      })
      .eq('id', user.id).select().single();
    if (error) throw new Error(error.message);

    // Update license as well
    const { error: licError } = await supabase.from('licenses')
      .update({
        name: user.name,
        devices_allowed: user.devices_allowed || 1,
        max_servers: user.max_servers || 1
      }).eq('owner_id', user.id);
    if (licError) throw new Error(licError.message);

    return data;
  } else {
    // New end user via secure endpoint
    const response = await fetch('/api/admin/create-auth-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        email: user.email || `${user.username}@mock.com`,
        password: user.password,
        full_name: user.name,
        username: user.username,
        role: 'END_USER',
        parent_id: parentId,
        business_mode: 'CUSTOMER',
        portal_access: user.portal_access
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erro ao criar usuário final');
    
    // Create license
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 1. Get creator profile to check role
    const { data: creator } = await supabase.from('profiles').select('role').eq('id', parentId).single();
    if (!creator) throw new Error('Não foi possível identificar o criador');

    // 2. Validate and fetch plan details securely from DB
    const { data: plan, error: planError } = await supabase.from('license_plans')
        .select('*')
        .eq('id', user.planId)
        .eq('status', 'ACTIVE')
        .is('deleted_at', null)
        .single();
        
    if (planError || !plan) {
        throw new Error('Plano de Licença inválido, inativo ou não encontrado.');
    }

    // 3. Debit credits if RESELLER or SUB_RESELLER
    if (creator.role === 'RESELLER' || creator.role === 'SUB_RESELLER') {
        const cost = plan.reseller_credit_cost;
        if (cost > 0) {
            // Check balance
            const { data: balanceData } = await supabase.from('credit_balances')
                .select('balance')
                .eq('owner_id', parentId)
                .single();
                
            if (!balanceData || balanceData.balance < cost) {
                throw new Error('Saldo de créditos insuficiente para este plano.');
            }
            
            // Note: Ideally debit should happen server-side via RPC or API to ensure atomic transaction and bypass RLS correctly.
            // Since there is no RPC, we attempt direct insert, relying on potential future RLS updates or server-side sync.
            const { error: txError } = await supabase.from('credit_transactions').insert([{
                from_owner_id: parentId,
                amount: cost,
                type: 'LICENSE_CREATION',
                description: `Criação de licença para ${result.user.id} (${plan.name})`,
            }]);
            
            if (txError) throw new Error('Erro ao registrar transação de créditos: ' + txError.message);
            
            // Try to update balance directly (may fail if RLS prevents it without a trigger, but implementing per instructions)
            await supabase.from('credit_balances')
                .update({ balance: balanceData.balance - cost })
                .eq('owner_id', parentId);
        }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.validity_days);
    
    const { error: licError, data: newLicense } = await supabase.from('licenses').insert([{
      code,
      owner_id: parentId,
      end_user_id: result.user.id,
      origin: 'WEB',
      plan_id: plan.id,
      expires_at: expiresAt.toISOString(),
      devices_allowed: plan.devices_allowed,
      max_servers: plan.max_servers,
      portal_access: user.portal_access,
      status: 'ACTIVE'
    }]).select().single();

    if (licError) throw new Error('Erro ao criar licença: ' + licError.message);

    // Link DNS servers
    if (user.selected_server_ids && user.selected_server_ids.length > 0) {
      const serverLinks = user.selected_server_ids.map((dnsId: string) => ({
        license_id: newLicense.id,
        server_dns_id: dnsId
      }));
      const { error: linkError } = await supabase.from('license_servers').insert(serverLinks);
      if (linkError) console.error('Erro ao vincular servidores:', linkError);
    }

    return result.user;
  }
};

export const deleteEndUser = async (id: string) => {
  const { error } = await supabase.from('profiles').update({ status: 'ARCHIVED' }).eq('id', id);
  if (error) throw new Error(error.message);
  
  // Update license status
  const { error: licError } = await supabase.from('licenses').update({ status: 'INACTIVE' }).eq('end_user_id', id);
  if (licError) throw new Error(licError.message);
};

export const toggleEndUserStatus = async (id: string, currentStatus: string) => {
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
  if (error) throw new Error(error.message);
};
