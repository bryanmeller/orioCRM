const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const regex2 = /\/\/ 1\. URL verification[\s\S]*?const { error: insertProfileError } = await supabaseAdmin\.from\('profiles'\)\.insert\(profilePayload\);/m;

const replacement2 = `// 1. Data Normalization
      let finalUsername = username;
      if (!finalUsername) {
        finalUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 10000);
      }

      let officialRole = role;
      if (role === 'PROVEDOR') officialRole = 'PROVIDER';
      if (role === 'REVENDA') officialRole = 'RESELLER';
      if (role === 'SUBREVENDA') officialRole = 'SUB_RESELLER';

      let finalBusinessMode = business_mode;
      if (!finalBusinessMode) {
        if (officialRole === 'PROVIDER') finalBusinessMode = 'PROVIDER';
        else if (officialRole === 'RESELLER') finalBusinessMode = 'RESELLER';
        else if (officialRole === 'SUB_RESELLER') finalBusinessMode = 'SUB_RESELLER';
        else if (officialRole === 'SUPER_ADMIN') finalBusinessMode = 'SYSTEM';
        else finalBusinessMode = 'CUSTOMER';
      }

      const finalParentId = parent_id ? parent_id : null;

      // 2. Create Auth User
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password || 'ChangeMe123!',
        email_confirm: true,
        user_metadata: {
          full_name,
          role: officialRole,
          username: finalUsername,
          parent_id: finalParentId,
          business_mode: finalBusinessMode,
          portal_access: portal_access || false,
          origin: origin || 'ADMIN_CREATED',
          status: status || 'ACTIVE'
        }
      });
      
      if (createError) {
        return res.status(400).json({ error: createError.message });
      }

      const userId = newUser.user.id;

      // 3. Upsert public.profiles (handles trigger collisions)
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

      const { error: insertProfileError } = await supabaseAdmin.from('profiles').upsert(profilePayload);`;

serverCode = serverCode.replace(regex2, replacement2);

fs.writeFileSync('server.ts', serverCode);
