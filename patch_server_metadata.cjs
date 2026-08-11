const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'const { email, password, full_name, role, parent_id, business_mode, username, portal_access, origin } = req.body;',
  'const { email, password, full_name, role, parent_id, business_mode, username, portal_access, origin, server_code, status } = req.body;'
);

content = content.replace(
  'origin: origin || \'ADMIN_CREATED\'',
  'origin: origin || \'ADMIN_CREATED\',\n          server_code,\n          status'
);

fs.writeFileSync('server.ts', content);
