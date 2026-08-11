const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/server_dns_id:\s*dnsId/g, 'server_id: dnsId');
fs.writeFileSync('server.ts', code);
