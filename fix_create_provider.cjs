const fs = require('fs');

// 1. AdminHandlers.tsx
let hCode = fs.readFileSync('src/components/AdminPanel/AdminHandlers.tsx', 'utf8');
hCode = hCode.replace(/newAccServerCode,\s*setNewAccServerCode,/, '');
hCode = hCode.replace(/server_code:\s*apiRole\s*===\s*'PROVIDER'\s*\?\s*newAccServerCode\s*:\s*undefined,/, '');

// Remove the declarations
hCode = hCode.replace(/const \[newAccServerCode, setNewAccServerCode\] = useState\(''\);/, '');
fs.writeFileSync('src/components/AdminPanel/AdminHandlers.tsx', hCode);

// 2. AdminPanel.tsx
let pCode = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');
pCode = pCode.replace(/newAccServerCode,\s*setNewAccServerCode,/, '');
pCode = pCode.replace(/setNewAccServerCode\(''\);/g, '');
fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', pCode);

// 3. server.ts
let sCode = fs.readFileSync('server.ts', 'utf8');
sCode = sCode.replace(/server_code,/g, '');
fs.writeFileSync('server.ts', sCode);

// 4. userService.ts
let uCode = fs.readFileSync('src/services/admin/userService.ts', 'utf8');
uCode = uCode.replace(/server_code\?: string;/, '');
fs.writeFileSync('src/services/admin/userService.ts', uCode);

