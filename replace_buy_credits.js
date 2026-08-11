const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

const startIndex = content.indexOf("{activeTab === 'buy-credits' && (");
const endIndex = content.indexOf("{/* MODULE 14: SUBTAB - PEDIDOS (credit_orders) */}");

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) +
    `{activeTab === 'buy-credits' && (
        <BuyCreditsTab
          currentUser={currentUser}
          setActiveTab={setActiveTab}
          currentBalance={balances?.find(b => b.owner_id === currentUser.id)?.balance || 0}
        />
      )}

      ` + content.substring(endIndex);
  
  fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', newContent);
  console.log('Replaced successfully');
} else {
  console.log('Could not find indices', startIndex, endIndex);
}
