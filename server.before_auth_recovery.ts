import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { lynxRouter } from './server/routes/lynxRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'streamflix_super_secret_key_123';
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Lynx API Routes
  app.use('/api/lynx', lynxRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Flutter App API: Request Trial
  
  app.post('/api/admin/create-auth-user', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (userError || !user) return res.status(401).json({ error: 'Não autorizado' });
      
      const { email, password, full_name, role, parent_id, business_mode, username } = req.body;
      
      // Use supabaseAdmin to create the user in Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password || 'ChangeMe123!',
        email_confirm: true,
        user_metadata: {
          full_name,
          role,
          username,
          parent_id
        }
      });
      
      if (createError) {
        return res.status(400).json({ error: createError.message });
      }
      
      // Profile is auto-created by trigger in the database, but let's make sure it is updated correctly or wait for the trigger
      
      res.json({ user: newUser.user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro interno' });
    }
  });

  app.post('/v1/auth/app/trial', async (req, res) => {
    try {
      const { deviceId } = req.body;
      if (!deviceId) return res.status(400).json({ success: false, error: 'Device ID required' });
      
      // Look for existing trial
      const { data: existingLicense } = await supabaseAdmin.from('licenses')
        .select('*')
        .eq('trial_device_id', deviceId)
        .eq('status', 'TRIAL')
        .single();
        
      if (existingLicense) {
        if (new Date(existingLicense.valid_until) < new Date()) {
           return res.status(403).json({ success: false, error: 'Seu período de teste já expirou.' });
        }
        return res.json({ success: true, licenseCode: existingLicense.code, message: 'Trial recuperado com sucesso.' });
      }

      // Check if this device ever had a trial before
      const { data: pastTrial } = await supabaseAdmin.from('licenses')
        .select('*')
        .eq('trial_device_id', deviceId)
        .limit(1);
        
      if (pastTrial && pastTrial.length > 0) {
        return res.status(403).json({ success: false, error: 'Este dispositivo já utilizou o teste gratuito.' });
      }

      const trialCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 7);

      const { data, error } = await supabaseAdmin.from('licenses').insert([{
        code: trialCode,
        status: 'TRIAL',
        valid_until: validUntil.toISOString(),
        trial_device_id: deviceId,
        max_devices: 1
      }]).select().single();

      if (error) throw error;
      res.json({ success: true, licenseCode: data.code });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Flutter App API: Login
  app.post('/v1/auth/app/login', async (req, res) => {
    try {
      const { licenseCode, username, password, deviceId } = req.body;
      
      // Authenticate user via Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: username + '@streamflix.local',
        password
      });

      if (authError || !authData.user) {
         return res.status(401).json({ success: false, error: 'Usuário ou senha incorretos' });
      }

      const { data: license, error: licenseError } = await supabaseAdmin.from('licenses')
        .select('*')
        .eq('code', licenseCode)
        .eq('user_id', authData.user.id)
        .single();

      if (licenseError || !license) {
         return res.status(401).json({ success: false, error: 'Licença inválida ou não pertence a este usuário' });
      }

      if (license.status === 'BLOCKED' || license.status === 'INACTIVE') {
         return res.status(403).json({ success: false, error: 'Licença bloqueada ou inativa.' });
      }

      if (new Date(license.valid_until) < new Date()) {
         return res.status(403).json({ success: false, error: 'Licença expirada.' });
      }
      
      // Device check/registration
      const { data: devices } = await supabaseAdmin.from('devices').select('*').eq('license_code', licenseCode);
      const existingDevices = devices || [];
      const currentDevice = existingDevices.find(d => d.device_id === deviceId);
      
      if (!currentDevice) {
         if (existingDevices.length >= (license.max_devices || 1)) {
             return res.status(403).json({ success: false, error: 'Esta licença atingiu o limite de dispositivos permitidos.' });
         }
         await supabaseAdmin.from('devices').insert([{
             license_code: licenseCode,
             device_id: deviceId,
             name: 'Device ' + (existingDevices.length + 1)
         }]);
      }

      const { data: servers } = await supabaseAdmin.from('iptv_servers').select('*');

      const token = jwt.sign({ id: authData.user.id, code: licenseCode }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        token,
        user: { id: authData.user.id, username },
        license: {
            code: license.code,
            status: license.status,
            valid_until: license.valid_until,
            max_devices: license.max_devices,
            used_devices: currentDevice ? existingDevices.length : existingDevices.length + 1
        },
        servers: servers || []
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Portal Login
  app.post('/api/auth/portal/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new Error('Credenciais inválidas');
      
      const token = jwt.sign({ id: data.user.id, email }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, user: { id: data.user.id, email } });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  // Portal Me
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
  });

  // Portal Remove Device
  app.post('/api/portal/remove-device', async (req, res) => {
      try {
          const { deviceId } = req.body;
          const { error } = await supabaseAdmin.from('devices').delete().eq('id', deviceId);
          if (error) throw new Error(error.message);
          res.json({ success: true });
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  // Mock Content for TV Simulator
  app.get('/api/content/channels', (req, res) => {
      res.json([
          { id: 'c1', name: 'Canal 1', group: 'Esportes', icon: '' },
          { id: 'c2', name: 'Canal 2', group: 'Filmes', icon: '' },
      ]);
  });
  app.get('/api/content/movies', (req, res) => {
      res.json([
          { id: 'm1', name: 'Filme A', year: 2023, rating: 8.5 },
          { id: 'm2', name: 'Filme B', year: 2022, rating: 7.2 },
      ]);
  });
  app.get('/api/content/series', (req, res) => {
      res.json([
          { id: 's1', name: 'Série X', seasons: 2 },
          { id: 's2', name: 'Série Y', seasons: 5 },
      ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
