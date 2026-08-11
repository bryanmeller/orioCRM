const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');
if (!content.includes("import { BuyCreditsTab }")) {
  content = "import { BuyCreditsTab } from './BuyCreditsTab';\n" + content;
  fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
}
