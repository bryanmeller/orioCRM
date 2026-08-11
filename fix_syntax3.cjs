const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

const target = `                  </select>\n                </div>\n                {(currentUser.role === 'REVENDA'`;
const replacement = `                  </select>\n                  )}\n                </div>\n                {(currentUser.role === 'REVENDA'`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
