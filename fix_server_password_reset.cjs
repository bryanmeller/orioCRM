const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetEndpoint = `  // Admin Auth Route (To check SUPER_ADMIN permissions dynamically)`;
const replacementEndpoint = `  // Admin Reset Password Route
  app.post('/api/admin/reset-user-password', async (req, res) => {
      try {
          const authHeader = req.headers.authorization;
          if (!authHeader) return res.status(401).json({ success: false, error: 'Unauthorized' });
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          const adminId = decoded.id;
          
          const { data: adminUser } = await supabaseAdmin.from('profiles').select('role, status').eq('id', adminId).single();
          if (!adminUser || adminUser.role !== 'SUPER_ADMIN' || adminUser.status !== 'ACTIVE') {
              return res.status(403).json({ success: false, error: 'Forbidden. Somente SUPER_ADMIN pode redefinir senhas.' });
          }
          
          const { userId, newPassword } = req.body;
          if (!userId || !newPassword || newPassword.length < 6) {
              return res.status(400).json({ success: false, error: 'Usuário inválido ou senha muito curta.' });
          }
          
          const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
              password: newPassword
          });
          
          if (error) {
              return res.status(500).json({ success: false, error: error.message });
          }
          
          await supabaseAdmin.from('audit_logs').insert([{
              actor_id: adminId,
              action: 'PASSWORD_RESET',
              entity_type: 'USER',
              entity_id: userId,
              metadata: { message: 'Senha redefinida pelo SUPER_ADMIN' }
          }]);
          
          res.json({ success: true });
      } catch (err: any) {
          res.status(500).json({ success: false, error: err.message });
      }
  });

  // Admin Auth Route (To check SUPER_ADMIN permissions dynamically)`;

code = code.replace(targetEndpoint, replacementEndpoint);
fs.writeFileSync('server.ts', code);
