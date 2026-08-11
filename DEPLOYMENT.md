# Deployment - Backend & Frontend (Web)

O painel administrativo e a API do StreamFlix TV foram projetados para rodar em Node.js (Express + Vite) e são compatíveis com Docker e Google Cloud Run.

## Variáveis de Ambiente Necessárias
As seguintes variáveis devem estar no `.env` ou injetadas na nuvem:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`: Credenciais públicas Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Obrigatório para ações administrativas da API (criação de usuários, licenças).
- `JWT_SECRET`: Chave forte para os tokens da API do App.
- `NODE_ENV=production`: Para ativar os recursos de otimização e servir os assets pelo Express.
- Gateway Lynx: `LYNX_API_URL`, `LYNX_CLIENT_ID`, `LYNX_CLIENT_SECRET`, `LYNX_WEBHOOK_SECRET` (Atualmente desativados no backend, aguardando documentação oficial).

## Script de Build
```bash
npm run build
```
O build realiza dois processos:
1. `vite build` -> compila o Frontend (React/Tailwind) e gera em `dist/`.
2. `esbuild server.ts ...` -> compila a API Express (Backend) para `dist/server.cjs`.

## Script de Start
```bash
npm start
```
(Irá iniciar `node dist/server.cjs`). O servidor rodará na porta definida em `PORT` (Padrão 3000) e servirá tanto a API `/api/v1` quanto os arquivos estáticos do Vite.

## Banco de Dados
A API necessita do Supabase (PostgreSQL). As tabelas, restrições, funções e políticas RLS devem estar aplicadas. O arquivo `supabase-schema.sql` (ou equivalente na pasta `supabase/migrations`) possui a estrutura oficial do sistema.

## Notas sobre o Gateway LYNX
Atualmente, qualquer chamada de cobrança PIX no painel exibirá um alerta: *"Pagamento temporariamente indisponível"*, e a API lançará erro para previnir pagamentos incorretos. A integração só deverá ser reativada após obtenção de uma documentação oficial do Lynx.
