const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

// Fix 1: userLic in table
code = code.replace(
  /const userLic = licenses\.find\(\(l\) => l\.code === u\.licenseCode \|\| l\.userId === u\.id\);\n                      const daysRem = userLic \? getDaysRemaining\(userLic\.expiresAt\) : null;/g,
  `const userLic = licenses.find((l) => l.end_user_id === u.id);
                      const daysRem = userLic ? getDaysRemaining(userLic.expires_at) : null;`
);

// Fix 2: u.licenseCode in table cell
code = code.replace(
  /\{u\.licenseCode \? \(\s*<div className="flex items-center gap-1 text-gray-300 font-bold">\s*<span className="truncate max-w-\[120px\]">\{u\.licenseCode\}<\/span>\s*<button\s*onClick=\{\(\) => \{\s*navigator\.clipboard\.writeText\(u\.licenseCode!\);\s*showToast\('UUID da licença copiado!'\);\s*\}\}/gs,
  `{userLic?.code ? (
                              <div className="flex items-center gap-1 text-gray-300 font-bold">
                                <span className="truncate max-w-[120px]">{userLic.code}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(userLic.code);
                                    showToast('UUID da licença copiado!');
                                  }}`
);

// Fix 3: expiresAt in table cell
code = code.replace(
  /<span className="font-bold text-white block">\{userLic\.expiresAt\}<\/span>/g,
  `<span className="font-bold text-white block">{new Date(userLic.expires_at).toLocaleDateString()}</span>`
);

// Fix 4: userLic in modal
code = code.replace(
  /const userLic = licenses\.find\(\(l\) => l\.code === selectedUserForDetails\.licenseCode \|\| l\.userId === selectedUserForDetails\.id\);\n              const daysRem = userLic \? getDaysRemaining\(userLic\.expiresAt\) : null;/g,
  `const userLic = licenses.find((l) => l.end_user_id === selectedUserForDetails.id);
              const plan = userLic ? plans.find(p => p.id === userLic.plan_id) : null;
              const daysRem = userLic ? getDaysRemaining(userLic.expires_at) : null;`
);

// Fix 5: userLic details inside modal
code = code.replace(
  /<div className="font-bold text-white">\{userLic\.planName\} \(\{userLic\.days\} dias\)<\/div>/g,
  `<div className="font-bold text-white">{plan?.name || 'Plano Desconhecido'} ({plan?.validity_days || 0} dias)</div>`
);
code = code.replace(
  /<div className="font-bold text-amber-300">\{userLic\.expiresAt\} \(\{daysRem\} dias\)<\/div>/g,
  `<div className="font-bold text-amber-300">{new Date(userLic.expires_at).toLocaleDateString()} ({daysRem} dias)</div>`
);

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', code);
