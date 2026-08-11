# Configuração do Supabase - StreamFlix TV

Siga as etapas abaixo exatamente na ordem apresentada para configurar o banco de dados e a conta de Super Administrador no seu projeto Supabase.

### ETAPA 1
Abrir:
`Supabase -> SQL Editor -> New query`

Copiar e executar todo o conteúdo de:
`supabase/setup/01_complete_database.sql`

Confirmar que apareceu:
`Success. No rows returned` (ou resultado equivalente sem erros).

### ETAPA 2
Abrir:
`Supabase -> Table Editor`

Confirmar que as seguintes tabelas foram criadas no schema `public`:
- profiles
- provider_plans
- license_plans
- provider_subscriptions
- iptv_servers
- licenses
- license_servers
- license_devices
- credit_balances
- credit_transactions
- payment_orders
- audit_logs
- system_settings

### ETAPA 3
Abrir:
`Supabase -> Authentication -> Users`

Clicar em:
`Add user -> Create new user`

Criar:
- **E-mail:** `admin@streamflixtv.local`
- **Senha:** `Admin@123456`

*(Marcar o e-mail como confirmado ou desativar a verificação de e-mail nas configurações de Auth, se houver necessidade)*

### ETAPA 4
Voltar para:
`Supabase -> SQL Editor -> New query`

Copiar e executar todo o conteúdo de:
`supabase/setup/02_create_super_admin_profile.sql`

Verifique se a consulta no final do script retornou o registro do super administrador criado.

### ETAPA 5
Abrir uma nova aba de SQL Editor:
`Supabase -> SQL Editor -> New query`

Copiar e executar todo o conteúdo de:
`supabase/setup/03_validate_installation.sql`

Verifique os resultados:
1. RLS (`rowsecurity`) deve estar ativado para todas as tabelas.
2. Todas as tabelas listadas devem aparecer nos resultados de `Table Row Counts`.
3. A consulta de `Super Admin Check` deve retornar o usuário com papel `SUPER_ADMIN`.
4. Não devem haver usuários em Auth sem profiles correspondentes (exceto se a trigger `auto_create_profile_from_auth` não rodou ou se faltou meta data, mas para o admin nós forçamos a criação na ETAPA 4).

### ETAPA 6
Testar o login real no site usando as credenciais do super administrador:
- **E-mail:** `admin@streamflixtv.local`
- **Senha:** `Admin@123456`

### ETAPA 7
Após o primeiro login bem-sucedido no painel, altere sua senha temporária no portal ou diretamente no painel do Supabase, se necessário, para garantir a segurança da instalação.
