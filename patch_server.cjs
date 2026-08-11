const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\('\/api\/admin\/create-auth-user', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Erro interno' \}\);\s*\}\s*\}\);/g;

const newEndpoint = `app.post('/api/admin/create-auth-user', async (req, res) => {
    try {
      if (!supabaseServiceKey) {
        return res.status(500).json({ error: 'Configuração administrativa do Supabase ausente.' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Não autorizado (Token ausente)' });
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (userError || !user) return res.status(401).json({ error: 'Não autorizado (Token inválido)' });
      
      // Verificar role no banco
      const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role, status, deleted_at').eq('id', user.id).single();
      if (profileError || !profile) return res.status(403).json({ error: 'Perfil não encontrado' });
      if (profile.deleted_at !== null) return res.status(403).json({ error: 'Perfil deletado' });
      if (profile.status !== 'ACTIVE') return res.status(403).json({ error: 'Perfil inativo' });
      if (!['SUPER_ADMIN', 'PROVEDOR', 'REVENDA', 'SUBREVENDA'].includes(profile.role) && !['SUPER_ADMIN', 'PROVIDER', 'RESELLER', 'SUB_RESELLER'].includes(profile.role)) {
         return res.status(403).json({ error: 'Não autorizado (Role insuficiente)' });
      }

      const { email, password, full_name, role, parent_id, business_mode, username, portal_access, origin } = req.body;
      
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
          origin: origin || 'ADMIN_CREATED'
        }
      });
      
      if (createError) {
        return res.status(400).json({ error: createError.message });
      }
      
      res.json({ user: newUser.user });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Erro interno' });
    }
  });`;

content = content.replace(regex, newEndpoint);
fs.writeFileSync('server.ts', content);
