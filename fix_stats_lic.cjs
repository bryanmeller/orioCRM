const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

code = code.replace(
  /const lic = licenses\.find\(\(l\) => l\.code === u\.licenseCode \|\| l\.userId === u\.id\);\n                  if \(!lic \|\| lic\.status !== 'ATIVA'\) return false;\n                  const days = getDaysRemaining\(lic\.expiresAt\);/g,
  `const lic = licenses.find((l) => l.end_user_id === u.id);
                  if (!lic || lic.status !== 'ACTIVE') return false;
                  const days = getDaysRemaining(lic.expires_at);`
);

code = code.replace(
  /return !u\.licenseCode && !licenses\.some\(\(l\) => l\.userId === u\.id\);/g,
  `return !licenses.some((l) => l.end_user_id === u.id);`
);

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', code);
