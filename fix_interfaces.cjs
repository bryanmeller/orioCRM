const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

code = code.replace(/serverCode\?: string;/g, 'provider_code?: number;');
code = code.replace(/acc\.serverCode/g, 'acc.provider_code');

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', code);
