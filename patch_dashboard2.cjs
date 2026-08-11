const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

const regex = /<DashboardModule[\s\S]*?\/>/;

const newDashboard = `<DashboardModule
              currentUser={currentUser}
              accounts={Array.isArray(accounts) ? accounts : []}
              balances={Array.isArray(balances) ? balances : []}
              transactions={Array.isArray(transactions) ? transactions : []}
              providers={[]} 
              serverCodes={[]}
              licenses={Array.isArray(licenses) ? licenses : []}
              plans={Array.isArray(plans) ? plans : []}
              providerPlans={Array.isArray(providerPlans) ? providerPlans : []}
              providerSubscriptions={Array.isArray(providerSubscriptions) ? providerSubscriptions : []}
              accountDnsList={Array.isArray(accountDnsList) ? accountDnsList : []}
              endUsers={Array.isArray(endUsers) ? endUsers : []}
              creditOrders={[]}
              showToast={showToast}
            />`;

content = content.replace(regex, newDashboard);
fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
