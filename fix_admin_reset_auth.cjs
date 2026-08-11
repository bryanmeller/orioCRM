const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetEndpoint = `  // Admin Reset Password Route
  app.post('/api/admin/reset-user-password', async (req, res) => {
      try {
          const authHeader = req.headers.authorization;
          if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          const adminId = decoded.id;`;

const replacementEndpoint = `  // Admin Reset Password Route
  app.post('/api/admin/reset-user-password', async (req, res) => {
      try {
          const authHeader = req.headers.authorization;
          if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });
          const token = authHeader.split(' ')[1];
          
          // Verify using Supabase
          const { data: { user: adminUserAuth }, error: authError } = await supabaseAdmin.auth.getUser(token);
          if (authError || !adminUserAuth) {
             return res.status(401).json({ success: false, error: 'Unauthorized' });
          }
          const adminId = adminUserAuth.id;`;

code = code.replace(targetEndpoint, replacementEndpoint);
fs.writeFileSync('server.ts', code);
