const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

content = content.replace(/                  <\/select>\n                  \)}\n                <\/div>/g,
                          "                  </select>\n                </div>");

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
