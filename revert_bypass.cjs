const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

serverCode = serverCode.replace(
  "if (authHeader === 'Bearer BYPASS') {\n        var user = { id: 'test_super_admin' };\n        var creatorProfile = { role: 'SUPER_ADMIN', status: 'ACTIVE', deleted_at: null };\n      } else {\n      \n      const token",
  "const token"
);

serverCode = serverCode.replace(
  "}\n      const { email, password, full_name",
  "const { email, password, full_name"
);

serverCode = serverCode.replace(
  "require('fs').writeFileSync('internal_error.txt', err.toString() + err.stack);\n      res.status(500).json({ error: 'Erro interno' });",
  "res.status(500).json({ error: 'Erro interno' });"
);
serverCode = serverCode.replace(
  "require('fs').writeFileSync('profile_error.json', JSON.stringify(insertProfileError));\n        console.error('Profile Insert Error:', insertProfileError);",
  "console.error('Profile Insert Error:', insertProfileError);"
);

fs.writeFileSync('server.ts', serverCode);
