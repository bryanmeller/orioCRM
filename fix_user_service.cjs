const fs = require('fs');

let userService = fs.readFileSync('src/services/admin/userService.ts', 'utf8');

userService = userService.replace(
  /const response = await fetch\('\/api\/admin\/create-auth-user'[\s\S]*?body: JSON\.stringify\(payload\)\n  \}\);[\s\S]*?if \(!response\.ok\) throw new Error\(result\.error \|\| 'Erro ao criar usuário'\);\n  if \(result\.success !== true\) throw new Error\('Criação não concluída completamente\.'\);\n  \n  return result\.user;/m,
  `const result = await secureFetchJSON('/api/admin/create-auth-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${(await supabase.auth.getSession()).data.session?.access_token}\`
    },
    body: JSON.stringify(payload)
  });
  
  if (result.success !== true) throw new Error('Criação não concluída completamente.');
  
  return result.user;`
);

fs.writeFileSync('src/services/admin/userService.ts', userService);
