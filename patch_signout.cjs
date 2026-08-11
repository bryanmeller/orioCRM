const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

content = content.replace(/await supabase\.auth\.signOut\(\);\n\s*return;/g, 'return;');

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
