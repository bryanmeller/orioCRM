const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

code = code.replace(
  /const userLic = licenses\.find\(\(l\) => l\.code === u\.licenseCode \|\| l\.userId === u\.id\);/g, 
  'const userLic = licenses.find((l) => l.end_user_id === u.id);\n                      const plan = userLic ? plans.find(p => p.id === userLic.plan_id) : null;'
);

code = code.replace(
  /const userLic = licenses\.find\(\(l\) => l\.code === selectedUserForDetails\.licenseCode \|\| l\.userId === selectedUserForDetails\.id\);/g, 
  'const userLic = licenses.find((l) => l.end_user_id === selectedUserForDetails.id);\n              const plan = userLic ? plans.find(p => p.id === userLic.plan_id) : null;'
);

// We need to also replace the usage of userLic.expiresAt with userLic.expires_at and userLic.planName with plan?.name and userLic.days with plan?.validity_days

// In table row:
const tableTarget = `{userLic ? (                              <div className="flex flex-col">                                <span className="text-gray-300 font-bold">{userLic.planName}</span>                                <span className="text-amber-400">Expira em {daysRem}d</span>                              </div>                            ) : (                              <span className="text-red-400">Sem Licença</span>                            )}`;
const tableReplacement = `{userLic ? (                              <div className="flex flex-col">                                <span className="text-gray-300 font-bold">{plan?.name || 'Desconhecido'}</span>                                <span className="text-amber-400">Expira em {daysRem}d</span>                              </div>                            ) : (                              <span className="text-red-400">Sem Licença</span>                            )}`;
// Oh wait, I don't know exactly what is in the table row. Let me grep for it first.
