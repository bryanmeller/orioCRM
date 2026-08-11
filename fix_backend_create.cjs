const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

// We need to replace the entire POST /api/admin/create-auth-user block
const startRegex = /app\.post\('\/api\/admin\/create-auth-user', async \(req, res\) => \{/;
const endStr = `  });\n\n  app.post('/v1/auth/app/trial'`;

const startIdx = serverCode.search(startRegex);
const endIdx = serverCode.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find the endpoint block in server.ts");
    process.exit(1);
}

const newEndpoint = `app.post('/api/admin/create-auth-user', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Configuração administrativa do Supabase ausente.' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Não autorizado (Token ausente)' });
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (userError || !user) return res.status(401).json({ error: 'Não autorizado (Token inválido)' });
      
      // Verificar role no banco
      const { data: creatorProfile, error: profileError } = await supabaseAdmin.from('profiles').select('role, status, deleted_at').eq('id', user.id).single();
      if (profileError || !creatorProfile) return res.status(403).json({ error: 'Perfil não encontrado' });
      if (creatorProfile.deleted_at !== null) return res.status(403).json({ error: 'Perfil deletado' });
      if (creatorProfile.status !== 'ACTIVE') return res.status(403).json({ error: 'Perfil inativo' });
      if (!['SUPER_ADMIN', 'PROVEDOR', 'REVENDA', 'SUBREVENDA'].includes(creatorProfile.role) && !['SUPER_ADMIN', 'PROVIDER', 'RESELLER', 'SUB_RESELLER'].includes(creatorProfile.role)) {
         return res.status(403).json({ error: 'Não autorizado (Role insuficiente)' });
      }

      const { email, password, full_name, role, parent_id, business_mode, username, portal_access, origin, server_code, status, plan_id, selected_server_ids } = req.body;
      
      // 1. URL verification
      const projectRef = process.env.SUPABASE_URL.split('://')[1].split('.')[0];
      console.log('Project Ref:', projectRef);

      // 2. Create Auth User
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password || 'ChangeMe123!',
        email_confirm: true,
        user_metadata: {
          full_name,
          role,
          username,
          parent_id,
          portal_access: portal_access,
          origin: origin || 'ADMIN_CREATED',
          server_code,
          status
        }
      });
      
      if (createError) {
        return res.status(400).json({ error: createError.message });
      }

      const userId = newUser.user.id;

      // 3. Create public.profiles
      const { error: insertProfileError } = await supabaseAdmin.from('profiles').insert({
        id: userId,
        full_name,
        role,
        parent_id: parent_id || null,
        username,
        email: email || \`\${username}@mock.com\`,
        status: status || 'ACTIVE',
        business_mode,
        server_code,
        portal_access
      });

      if (insertProfileError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return res.status(500).json({ error: 'Erro ao criar perfil. Usuário Auth removido.' });
      }

      // 4. Fluxo especifico por Role
      let balanceCreated = false;

      if (role === 'RESELLER' || role === 'SUB_RESELLER' || role === 'REVENDA' || role === 'SUBREVENDA') {
        const { error: balanceError } = await supabaseAdmin.from('credit_balances').insert({
          owner_id: userId,
          balance: 0
        });
        if (balanceError) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          await supabaseAdmin.from('profiles').delete().eq('id', userId);
          return res.status(500).json({ error: 'Erro ao criar saldo da revenda.' });
        }
        balanceCreated = true;
      }

      if ((role === 'PROVIDER' || role === 'PROVEDOR') && plan_id) {
        const { data: plan } = await supabaseAdmin.from('provider_plans').select('*').eq('id', plan_id).single();
        if (plan) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          const { error: subError } = await supabaseAdmin.from('provider_subscriptions').insert({
            provider_id: userId,
            plan_id: plan.id,
            expires_at: expiresAt.toISOString(),
          });
          if (subError) {
            await supabaseAdmin.auth.admin.deleteUser(userId);
            await supabaseAdmin.from('profiles').delete().eq('id', userId);
            return res.status(500).json({ error: 'Erro ao vincular plano do provedor.' });
          }
        }
      }

      if (role === 'END_USER') {
        // Criar licença
        if (!plan_id) {
           await supabaseAdmin.auth.admin.deleteUser(userId);
           await supabaseAdmin.from('profiles').delete().eq('id', userId);
           return res.status(400).json({ error: 'Plano é obrigatório para Usuário Final' });
        }
        const { data: plan, error: planError } = await supabaseAdmin.from('license_plans')
            .select('*').eq('id', plan_id).eq('status', 'ACTIVE').is('deleted_at', null).single();
            
        if (planError || !plan) {
           await supabaseAdmin.auth.admin.deleteUser(userId);
           await supabaseAdmin.from('profiles').delete().eq('id', userId);
           return res.status(400).json({ error: 'Plano de Licença inválido.' });
        }

        // Debit credits if creator is Reseller
        if (creatorProfile.role === 'RESELLER' || creatorProfile.role === 'SUB_RESELLER' || creatorProfile.role === 'REVENDA' || creatorProfile.role === 'SUBREVENDA') {
            const cost = plan.reseller_credit_cost || plan.credit_cost || 0;
            if (cost > 0) {
                const { data: balanceData } = await supabaseAdmin.from('credit_balances').select('balance').eq('owner_id', user.id).single();
                if (!balanceData || balanceData.balance < cost) {
                    await supabaseAdmin.auth.admin.deleteUser(userId);
                    await supabaseAdmin.from('profiles').delete().eq('id', userId);
                    return res.status(400).json({ error: 'Saldo insuficiente.' });
                }
                
                await supabaseAdmin.from('credit_transactions').insert([{
                    from_owner_id: user.id,
                    amount: cost,
                    type: 'LICENSE_CREATION',
                    description: \`Criação de licença para \${userId}\`
                }]);
                
                await supabaseAdmin.from('credit_balances')
                    .update({ balance: balanceData.balance - cost })
                    .eq('owner_id', user.id);
            }
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.validity_days || plan.dias || 30);
        
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const { error: licError, data: newLicense } = await supabaseAdmin.from('licenses').insert([{
          code,
          owner_id: user.id, // Creator is owner
          end_user_id: userId,
          origin: origin || 'WEB',
          plan_id: plan.id,
          expires_at: expiresAt.toISOString(),
          devices_allowed: plan.devices_allowed,
          max_servers: plan.max_servers,
          portal_access: portal_access,
          status: 'ACTIVE'
        }]).select().single();
        
        if (licError) {
           await supabaseAdmin.auth.admin.deleteUser(userId);
           await supabaseAdmin.from('profiles').delete().eq('id', userId);
           return res.status(500).json({ error: 'Erro ao criar licença.' });
        }

        if (selected_server_ids && selected_server_ids.length > 0) {
          const serverLinks = selected_server_ids.map((dnsId) => ({
            license_id: newLicense.id,
            server_dns_id: dnsId
          }));
          await supabaseAdmin.from('license_servers').insert(serverLinks);
        }
      }

      // 5. Query again to confirm
      const { data: finalProfile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
      
      return res.status(200).json({ 
        success: true, 
        userId: userId, 
        profileCreated: !!finalProfile,
        balanceCreated: balanceCreated,
        user: newUser.user
      });
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro interno' });
    }
`;

serverCode = serverCode.substring(0, startIdx) + newEndpoint + serverCode.substring(endIdx);
fs.writeFileSync('server.ts', serverCode);
console.log("Updated server.ts");
