const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

content = content.replace(/<\/form>/g, '</div>');

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
