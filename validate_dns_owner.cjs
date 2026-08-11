const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetIf = `        if (selected_server_ids && selected_server_ids.length > 0) {
          const serverLinks = selected_server_ids.map((dnsId) => ({
            license_id: newLicense.id,
            server_id: dnsId
          }));
          await supabaseAdmin.from('license_servers').insert(serverLinks);
        }`;

const replacementIf = `        if (selected_server_ids && selected_server_ids.length > 0) {
          // Validate that the selected DNS belong to the creator
          const { data: validServers } = await supabaseAdmin.from('iptv_servers')
            .select('id')
            .in('id', selected_server_ids)
            .eq('owner_id', user.id);
            
          if (!validServers || validServers.length !== selected_server_ids.length) {
            await supabaseAdmin.auth.admin.deleteUser(userId);
            await supabaseAdmin.from('profiles').delete().eq('id', userId);
            return res.status(400).json({ error: 'Um ou mais Servidores (DNS) selecionados não pertencem à sua conta.' });
          }
          
          if (selected_server_ids.length > plan.max_servers) {
            await supabaseAdmin.auth.admin.deleteUser(userId);
            await supabaseAdmin.from('profiles').delete().eq('id', userId);
            return res.status(400).json({ error: 'Quantidade de Servidores (DNS) excede o limite do plano.' });
          }

          const serverLinks = selected_server_ids.map((dnsId) => ({
            license_id: newLicense.id,
            server_id: dnsId
          }));
          await supabaseAdmin.from('license_servers').insert(serverLinks);
        }`;

code = code.replace(targetIf, replacementIf);
fs.writeFileSync('server.ts', code);
