const fs = require('fs');

const apiUtilsImport = `import { secureFetchJSON } from './apiUtils';\n`;

let userService = fs.readFileSync('src/services/admin/userService.ts', 'utf8');
userService = apiUtilsImport + userService;
userService = userService.replace(
  /const response = await fetch\('\/api\/admin\/create-auth-user', \{[\s\S]*?body: JSON\.stringify\(payload\)\n  \}\);\n  const result = await response\.json\(\);\n  if \(\!response\.ok\) throw new Error\(result\.error \|\| 'Erro ao criar usuário'\);/g,
  `const result = await secureFetchJSON('/api/admin/create-auth-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${(await supabase.auth.getSession()).data.session?.access_token}\`
    },
    body: JSON.stringify(payload)
  });`
);
fs.writeFileSync('src/services/admin/userService.ts', userService);

let endUserService = fs.readFileSync('src/services/admin/endUserService.ts', 'utf8');
endUserService = apiUtilsImport + endUserService;
endUserService = endUserService.replace(
  /const response = await fetch\('\/api\/admin\/create-auth-user', \{[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?portal_access: user\.portal_access\n      \}\)\n    \}\);\n    const result = await response\.json\(\);\n    if \(\!response\.ok\) throw new Error\(result\.error \|\| 'Erro ao criar usuário final'\);/g,
  `const result = await secureFetchJSON('/api/admin/create-auth-user', {
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
        portal_access: user.portal_access
      })
    });`
);
fs.writeFileSync('src/services/admin/endUserService.ts', endUserService);
