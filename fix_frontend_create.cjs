const fs = require('fs');

let userService = fs.readFileSync('src/services/admin/userService.ts', 'utf8');

// We need to remove the balance and plan creation from userService.ts
const balanceRegex = /\/\/ Create credit balance[\s\S]*?\}\n  \}/;
userService = userService.replace(balanceRegex, '');

const providerRegex = /if \(payload\.role === 'PROVIDER' && payload\.plan_id\) \{[\s\S]*?\}\n  \}/;
userService = userService.replace(providerRegex, '');

fs.writeFileSync('src/services/admin/userService.ts', userService);

// Now for endUserService.ts
let endUserService = fs.readFileSync('src/services/admin/endUserService.ts', 'utf8');
const endUserBlock = /const result = await secureFetchJSON\('\/api\/admin\/create-auth-user', \{[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?\}\)[\s\S]*?\}\);[\s\S]*?if \(linkError\) console\.error\('Erro ao vincular servidores:', linkError\);\n    \}/;
const newEndUserBlock = `const result = await secureFetchJSON('/api/admin/create-auth-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${(await supabase.auth.getSession()).data.session?.access_token}\`
      },
      body: JSON.stringify({
        email: user.email || \`\${user.username}@mock.com\`,
        password: user.password,
        full_name: user.name,
        username: user.username,
        role: 'END_USER',
        parent_id: parentId,
        business_mode: 'CUSTOMER',
        portal_access: user.portal_access,
        plan_id: user.planId,
        selected_server_ids: user.selected_server_ids
      })
    });
`;

endUserService = endUserService.replace(endUserBlock, newEndUserBlock);
fs.writeFileSync('src/services/admin/endUserService.ts', endUserService);

console.log("Updated services");
