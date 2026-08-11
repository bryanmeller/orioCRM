const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetPortalMe = `  // Portal Me
  app.get('/api/portal/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.id;
      
      const { data: user, error } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
      
      if (error || !user) {
          const { data: lic } = await supabaseAdmin.from('licenses').select('*').eq('user_id', userId).single();
          if (lic) {
              const { data: devices } = await supabaseAdmin.from('devices').select('*').eq('license_code', lic.code);
              return res.json({ user: lic, licenses: [lic], devices: devices || [], purchases: [] });
          }
          return res.status(404).json({ error: 'User not found' });
      }
      
      const { data: licenses } = await supabaseAdmin.from('licenses').select('*').eq('user_id', user.id);
      let allDevices: any[] = [];
      if (licenses && licenses.length > 0) {
          const codes = licenses.map((l: any) => l.code);
          const { data: devices } = await supabaseAdmin.from('devices').select('*').in('license_code', codes);
          allDevices = devices || [];
      }
      
      res.json({ user, licenses: licenses || [], devices: allDevices, purchases: [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });`;

const replacementPortalMe = `  // Portal Me
  app.get('/api/portal/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.id;
      
      const { data: user, error } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
      
      if (error || !user) {
          return res.status(404).json({ error: 'User not found' });
      }
      
      const { data: licenses } = await supabaseAdmin.from('licenses').select('*, plan:license_plans(*)').eq('end_user_id', user.id);
      
      let allDevices: any[] = [];
      if (licenses && licenses.length > 0) {
          const licenseIds = licenses.map((l: any) => l.id);
          const { data: devices } = await supabaseAdmin.from('license_devices').select('*').in('license_id', licenseIds);
          allDevices = devices || [];
      }
      
      // Map licenses to match CustomerPortal format
      const formattedLicenses = (licenses || []).map((lic: any) => ({
          id: lic.id,
          code6Char: lic.code,
          planName: lic.plan ? lic.plan.name : 'Plano',
          expiresAt: new Date(lic.expires_at).toLocaleDateString(),
          status: lic.status === 'ACTIVE' ? 'ATIVA' : lic.status === 'EXPIRED' ? 'EXPIRADA' : lic.status === 'BLOCKED' ? 'BLOQUEADA' : lic.status === 'TRIAL' ? 'TRIAL' : lic.status,
          dnsList: [] // We could fetch license_servers if needed
      }));
      
      res.json({ user, licenses: formattedLicenses, devices: allDevices, purchases: [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });`;

code = code.replace(targetPortalMe, replacementPortalMe);
fs.writeFileSync('server.ts', code);
