const fs = require('fs');
let lines = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8').split('\n');

lines[687] = lines[687].replace('</div>', '</form>');
lines[1998] = lines[1998].replace('</div>', '</form>');
lines[2169] = lines[2169].replace('</div>', '</form>');
lines[2245] = lines[2245].replace('</div>', '</form>');

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', lines.join('\n'));
