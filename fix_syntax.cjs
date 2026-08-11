const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

content = content.replace(/                }<\/div>\n                \)}\n                \{\(currentUser\.role === 'REVENDA' \|\| currentUser\.role === 'SUBREVENDA'\) && \(/g, 
                          "                </div>\n                {(currentUser.role === 'REVENDA' || currentUser.role === 'SUBREVENDA') && (");
// Also need to remove the first `)}`
content = content.replace(/                  <\/select>\n                  \)}\n                <\/div>\n                \)}\n                \{\(currentUser\.role === 'REVENDA'/g,
                          "                  </select>\n                </div>\n                {(currentUser.role === 'REVENDA'");

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
