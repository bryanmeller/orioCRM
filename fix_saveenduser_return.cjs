const fs = require('fs');
let code = fs.readFileSync('src/services/admin/endUserService.ts', 'utf8');
code = code.replace(/return result\.user;/, 'return result;');
fs.writeFileSync('src/services/admin/endUserService.ts', code);
