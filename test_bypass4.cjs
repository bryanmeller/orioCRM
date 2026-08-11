const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

serverCode = serverCode.replace(
  "res.status(500).json({ error: 'Erro interno' });",
  "require('fs').writeFileSync('internal_error.txt', err.toString() + err.stack);\n      res.status(500).json({ error: 'Erro interno' });"
);

fs.writeFileSync('server.ts', serverCode);
