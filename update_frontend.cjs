const fs = require('fs');

let userService = fs.readFileSync('src/services/admin/userService.ts', 'utf8');
userService = userService.replace(
  "if (!response.ok) throw new Error(result.error || 'Erro ao criar usuário');\n  const user = result.user;\n  \n  return user;",
  "if (!response.ok) throw new Error(result.error || 'Erro ao criar usuário');\n  if (result.success !== true) throw new Error('Criação não concluída completamente.');\n  \n  return result.user;"
);
fs.writeFileSync('src/services/admin/userService.ts', userService);

let endUserService = fs.readFileSync('src/services/admin/endUserService.ts', 'utf8');
endUserService = endUserService.replace(
  "return result.user;\n  }\n};\n",
  "if (result.success !== true) throw new Error('Criação não concluída completamente.');\n    return result.user;\n  }\n};\n"
);
fs.writeFileSync('src/services/admin/endUserService.ts', endUserService);

