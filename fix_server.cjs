const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ 3\. Create public\.profiles[\s\S]*?if\s*\(insertProfileError\)\s*\{[\s\S]*?return res\.status\(500\)\.json\(\{ error: 'Erro ao criar perfil\. Usuário Auth removido\.' \}\);[\s\S]*?\}/m;

const replacement = `// 3. Create public.profiles
      // Normalizar username
      let finalUsername = username;
      if (!finalUsername) {
        finalUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 10000);
      }

      // Definir business_mode
      let finalBusinessMode = business_mode;
      if (!finalBusinessMode) {
        if (role === 'PROVIDER' || role === 'PROVEDOR') finalBusinessMode = 'PROVIDER';
        else if (role === 'RESELLER' || role === 'REVENDA') finalBusinessMode = 'RESELLER';
        else if (role === 'SUB_RESELLER' || role === 'SUBREVENDA') finalBusinessMode = 'SUB_RESELLER';
        else if (role === 'SUPER_ADMIN') finalBusinessMode = 'SYSTEM';
        else finalBusinessMode = 'CUSTOMER';
      }

      // Definir parent_id seguro
      const finalParentId = parent_id ? parent_id : null;

      // Definir role oficial
      let officialRole = role;
      if (role === 'PROVEDOR') officialRole = 'PROVIDER';
      if (role === 'REVENDA') officialRole = 'RESELLER';
      if (role === 'SUBREVENDA') officialRole = 'SUB_RESELLER';

      const profilePayload = {
        id: userId,
        full_name,
        role: officialRole,
        parent_id: finalParentId,
        username: finalUsername,
        email: email,
        status: status || 'ACTIVE',
        business_mode: finalBusinessMode,
        portal_access: portal_access || false
      };

      const { error: insertProfileError } = await supabaseAdmin.from('profiles').insert(profilePayload);

      if (insertProfileError) {
        console.error('Profile Insert Error:', insertProfileError);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return res.status(500).json({ 
          error: 'Erro ao criar perfil.', 
          code: insertProfileError.code, 
          details: insertProfileError.message 
        });
      }`;

serverCode = serverCode.replace(regex, replacement);

fs.writeFileSync('server.ts', serverCode);
