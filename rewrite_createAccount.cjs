const fs = require('fs');

let userService = fs.readFileSync('src/services/admin/userService.ts', 'utf8');

const regex = /export const createAccount = async \([\s\S]*?return user;\n};/;

const replacement = `export const createAccount = async (payload: {
  email: string;
  password?: string;
  full_name: string;
  role: string;
  parent_id?: string;
  business_mode?: string;
  plan_id?: string;
  server_code?: string;
  status?: string;
}) => {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  if (!token) throw new Error("Sessão administrativa inválida. Entre novamente.");

  const result = await secureFetchJSON('/api/admin/create-auth-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify(payload)
  });
  
  if (result.success !== true || result.profileCreated !== true) {
    throw new Error('Criação não concluída completamente.');
  }
  
  return result.user;
};`;

userService = userService.replace(regex, replacement);

fs.writeFileSync('src/services/admin/userService.ts', userService);
