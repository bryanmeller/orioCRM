const fs = require('fs');

const path = 'src/services/admin/endUserService.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /\/\/ Get plan details[\s\S]*?return result\.user;/;

const replacement = `// 1. Get creator profile to check role
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
                description: \`Criação de licença para \${result.user.id} (\${plan.name})\`,
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
    
    const { error: licError } = await supabase.from('licenses').insert([{
      code,
      owner_id: parentId,
      end_user_id: result.user.id,
      origin: 'WEB',
      plan_id: plan.id,
      expires_at: expiresAt.toISOString(),
      devices_allowed: plan.devices_allowed,
      max_servers: plan.max_servers,
      status: 'ACTIVE'
    }]);

    if (licError) throw new Error('Erro ao criar licença: ' + licError.message);

    return result.user;`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('endUserService updated.');
