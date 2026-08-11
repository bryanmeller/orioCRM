# Documentação do Projeto - StreamFlix

## 1. Visão Geral
Plataforma Multi-Tenant para gestão e venda de licenças de aplicativos IPTV, com arquitetura dividida em:
- **Painel Administrativo** (Super Admin, Provedor, Revenda, Sub-revenda)
- **Portal do Cliente** (Self-Service)
- **Aplicativo TV** (Simulador Android/FireTV/Tizen)
- **Painel Gateway de Pagamentos** (Lynx)

## 2. Estrutura do Banco de Dados (Supabase/PostgreSQL)

O banco é gerido pelo Supabase com RLS (Row Level Security) para garantir isolamento Multi-Tenant.
Principais tabelas:

- `accounts`: Contas de usuários organizadas por hierarquia (`SUPER_ADMIN`, `PROVEDOR`, `REVENDA`, `SUBREVENDA`). Mantém controle de saldos de créditos, status (ATIVA, BLOQUEADA) e personalização.
- `licenses`: Licenças dos usuários finais. Contém ID do proprietário, código de acesso único, usuário, senha, expiração, plano e status.
- `devices`: Dispositivos conectados. Relacionado por `license_code`, armazena `device_id`, sistema operacional, modelo.
- `license_plans`: Planos de licenças para venda aos usuários finais.
- `account_dns`: Servidores IPTV autorizados. Cada conta pode registrar seus domínios/DNS.
- `credit_balances`: Saldo de créditos das revendas e provedores.
- `credit_transactions`: Extrato e log de consumo de créditos.
- `credit_orders`: Pedidos de recarga de créditos com status de pagamento.

## 3. Estrutura das APIs

O backend é feito em Node.js com Express e interage com o Supabase.
Principais agrupamentos de rotas:

- **Auth**: `/api/auth/login`, `/api/auth/app/login`
- **Users**: `/api/users`, `/api/users/:id`
- **Licenses**: `/api/licenses`, `/api/licenses/:ownerId`, `/api/licenses/renew`, `/api/licenses/device/:id`
- **Plans**: `/api/plans`, `/api/plans/:ownerId`
- **DNS**: `/api/dns`, `/api/dns/:ownerId`
- **Finance**: `/api/finance/credit-balance`, `/api/finance/credit-transactions`, `/api/finance/credit-orders`

## 4. Fluxo de Autenticação

### Painel e Portal:
Utilizam o serviço do Supabase Authentication associado à tabela `accounts`.
Os tokens JWT gerados pelo Supabase validam a sessão em todas as APIs da plataforma (`requireAuth` middleware verifica os papéis permitidos).

### Aplicativo (TV):
Autentica no endpoint `/api/auth/app/login` com `licenseCode`, `username`, `password` e `deviceId`.
O backend verifica a validade da licença e a quantidade limite de `devices`.
Retorna lista de DNS disponíveis para conexão e dados de sessão.

## 5. Fluxo de Licenciamento

1. Revenda/Provedor cria plano em "Planos de Licença".
2. Em "Usuários Finais", criam nova licença, abatendo o custo em créditos.
3. Se a conta não tiver créditos, a operação é bloqueada.
4. O usuário final usa o Código, Usuário e Senha + Device ID para logar.
5. Quando atinge o tempo limite, a licença fica EXPIRADA. A renovação deduz novos créditos da Revenda/Provedor.

## 6. Fluxo de Pagamentos

1. O fluxo de B2B (Revenda comprando créditos do Provedor) ou B2C (Cliente Self-Service) utiliza o **Gateway Lynx**.
2. O pedido é gerado em `credit_orders` com status `PENDING`.
3. O Pix Copia e Cola/QR Code é gerado.
4. Após o pagamento ser compensado, o Webhook/Polling do Gateway altera a ordem para `PAID` e incrementa o saldo na `credit_balances`.

## 7. Estrutura de Permissões

A plataforma utiliza RBAC (Role-Based Access Control):
- **SUPER_ADMIN**: Visão e controle global.
- **PROVEDOR**: Administra suas revendas, clientes diretos e planos, visualizando apenas dados vinculados à sua conta.
- **REVENDA**: Administra seus clientes e sub-revendas. Só enxerga planos do seu provedor, deduzindo créditos no momento da emissão.
- **SUBREVENDA**: Semelhante à Revenda, mas dependente da hierarquia acima.
- **USUARIO_FINAL**: Apenas autentica no app e no Portal do Cliente.

O isolamento é provido via middlewares no Express e Políticas (RLS) no Supabase.

## 8. Processo de Publicação

### Backend & Frontend (Web)
O projeto atual pode ser compilado rodando `npm run build` e é servido na mesma porta 3000 em produção pelo arquivo `dist/server.cjs`.

### Aplicativo Flutter (Android / AAB / APK)
A documentação completa de build do aplicativo encontra-se em `flutter_app/README.md`.
Resumo do fluxo:
1. `cd flutter_app`
2. `flutter clean && flutter pub get`
3. Ajuste as keys e storePassword em `android/key.properties`
4. Build APK: `flutter build apk --release`
5. Build AAB (Play Store): `flutter build appbundle --release`
