const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

const importStatement = "import { BuyCreditsTab } from './BuyCreditsTab';\n";

if (!content.includes('BuyCreditsTab')) {
    const importIndex = content.indexOf("import { AdminUser }");
    if (importIndex !== -1) {
        content = content.substring(0, importIndex) + importStatement + content.substring(importIndex);
    }
}

const startIndex = content.indexOf("{activeTab === 'buy-credits' && (");
const endIndex = content.indexOf("{/* MODULE 14: SUBTAB - PEDIDOS (credit_orders) */}");

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{activeTab === 'buy-credits' && (
        <BuyCreditsTab
          currentUser={currentUser}
          setActiveTab={setActiveTab}
          currentBalance={balances?.find(b => b.owner_id === currentUser.id)?.balance || 0}
        />
      )}

      `;
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  
  fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
  console.log('Replaced successfully');
} else {
  console.log('Could not find indices', startIndex, endIndex);
}
