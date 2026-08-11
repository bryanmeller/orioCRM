const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetRemove = `  // Portal Remove Device
  app.post('/api/portal/remove-device', async (req, res) => {
      try {
          const { deviceId } = req.body;
          const { error } = await supabaseAdmin.from('devices').delete().eq('id', deviceId);
          if (error) throw new Error(error.message);
          res.json({ success: true });
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });`;

const replacementRemove = `  // Portal Remove Device
  app.post('/api/portal/remove-device', async (req, res) => {
      try {
          const { deviceId } = req.body;
          const { error } = await supabaseAdmin.from('license_devices').delete().eq('id', deviceId);
          if (error) throw new Error(error.message);
          res.json({ success: true });
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });`;

code = code.replace(targetRemove, replacementRemove);
fs.writeFileSync('server.ts', code);
