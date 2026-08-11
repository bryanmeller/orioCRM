# StreamFlix TV

Plataforma unificada para gerenciamento IPTV/M3U, composta por um backend Node.js (Express) robusto, um painel Web em React e a arquitetura em Flutter (App).

## Módulos Principais
1. **Frontend Web:** Painel Administrativo multi-perfil e Portal de auto-serviço (React + Tailwind).
2. **Backend API:** Processa autenticação, integrações de pagamento e gerencia o App (Express).
3. **Database:** Supabase (PostgreSQL) com Row Level Security (RLS) habilitado.
4. **App (Flutter):** Aplicação para Android TV / Fire TV, baseada em `flutter_app/`.

## Informações Adicionais
* **Integração Lynx (Pagamentos):** Encontra-se pendente de chaves e documentação oficial e os módulos de PIX encontram-se temporariamente desativados. Ver arquivo `LYNX_INTEGRATION_PENDING.md`.
* **Build e Instalação (App):** O processo de build de APKs e AABs precisa ser realizado em ambiente local que contenha o SDK do Flutter. Ver `APP_BUILD.md`.
* **Deployment (Servidor):** Instruções de deploy do painel e API se encontram em `DEPLOYMENT.md`.
* **Auditoria de Homologação:** Documento `HOMOLOGATION_REPORT.md` descreve as entregas finais.
