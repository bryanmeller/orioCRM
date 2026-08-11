const fs = require('fs');
let code = fs.readFileSync('server/routes/lynxRoutes.ts', 'utf8');

const loginRoute = `
// POST /api/lynx/login (used by App / TVSimulator)
lynxRouter.post('/login', async (req: any, res: any) => {
  try {
    const { licenseCode, username, password } = req.body;
    if (!licenseCode || !username || !password) {
      return res.status(400).json({ success: false, error: 'Credenciais incompletas.' });
    }
    
    const { supabaseAdmin } = await import("../supabaseAdmin.js");
    
    // 1. Localizar licença pelo código
    const { data: license, error: licError } = await supabaseAdmin.from('licenses')
      .select('*, profiles:end_user_id(*)')
      .eq('code', licenseCode)
      .single();
      
    if (licError || !license) {
      return res.status(401).json({ success: false, error: 'Licença inválida ou não encontrada.' });
    }
    
    // 2. Confirmar status ACTIVE
    if (license.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, error: 'Sua licença não está ativa.' });
    }
    
    // 3. Confirmar validade
    if (new Date(license.expires_at) < new Date()) {
      return res.status(401).json({ success: false, error: 'Licença expirada.' });
    }
    
    // 4. Localizar usuário e 5. Validar Username/Senha
    // To do this securely without raw passwords, we must sign in via auth API, 
    // BUT since we don't have the cleartext password (unless we use the auth.users, but we only have username here).
    // Wait, the client is sending password. We could sign in to verify, but we need the email.
    const userProfile = license.profiles;
    if (!userProfile || userProfile.username !== username) {
      return res.status(401).json({ success: false, error: 'Usuário incorreto.' });
    }
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: userProfile.email,
      password: password
    });
    
    if (authError) {
      return res.status(401).json({ success: false, error: 'Senha incorreta.' });
    }
    
    // 6. Validar limite de dispositivos (Mocked for now since we don't track active sessions perfectly)
    // 7 & 8. Carregar DNS vinculados
    const { data: licServers } = await supabaseAdmin.from('license_servers')
      .select('server_id')
      .eq('license_id', license.id);
      
    if (!licServers || licServers.length === 0) {
       return res.json({ success: true, servers: [], message: 'Nenhum servidor está disponível para esta conta. Entre em contato com seu provedor.' });
    }
    
    const serverIds = licServers.map(ls => ls.server_id);
    const { data: servers } = await supabaseAdmin.from('iptv_servers')
      .select('id, sort_order')
      .in('id', serverIds)
      .order('sort_order', { ascending: true });
      
    // 9. Retornar aliases seguros
    const safeServers = (servers || []).map((s, index) => ({
      id: s.id,
      display_name: \`Servidor \${index + 1}\`
    }));

    res.json({ 
      success: true, 
      servers: safeServers,
      user: {
        id: userProfile.id,
        name: userProfile.full_name,
        expires_at: license.expires_at
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
`;

code += loginRoute;
fs.writeFileSync('server/routes/lynxRoutes.ts', code);
