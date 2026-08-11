const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel/AdminHandlers.tsx', 'utf8');

code = code.replace(
  /handleSimulateLynxWebhook, handleLogout/, 
  'handleSimulateLynxWebhook, handleLogout, newEndUserCredentials, setNewEndUserCredentials'
);

fs.writeFileSync('src/components/AdminPanel/AdminHandlers.tsx', code);
