const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');
content = content.replace('Entrar via Supabase', 'Entrar');
fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
