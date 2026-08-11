==================================================
RELATÓRIO DE AUDITORIA - VERSÃO 1.0.0
==================================================

1. Código morto:
- Funções antigas de geração de código aleatório ou senhas temporárias que foram sobrepostas pelas rotas de criação do painel.
- Estruturas de manipulação de saldo (`manage_balance`) que em alguns locais ainda tentam validar regras de negócio do lado do cliente.

2. Arquivos órfãos:
- `temp.sql`, `fix2.py`, `fix_server.py`, `add_credit_rpc.sql`, `add_deleted_at.sql`, `patch_hooks.sh`, `patch_server.sh`, `update_admin_auth.sh`, `split_script.sh`, `check_admin.ts`, `generate_sql.sh`, `get_chunks.sh` e `chunk1.txt` a `chunk4.txt`.

3. Componentes sem uso:
- O módulo TVSimulator possui componentes que são puramente para simulação (`TVHomeScreen`, `TVLiveTvView`, `TVMoviesView`, `TVSeriesView`, `TVFavoritesView`, `TVSettingsView`). O aplicativo Flutter real substitui esta simulação.

4. Rotas sem uso:
- Rota de webhook do Lynx (marcada como pendente/erro) não é efetivamente consumida.

5. Endpoints sem uso:
- Nenhum. Todos os endpoints em `server.ts` de `v1` e API do Flutter estão cobertos por funcionalidades do painel ou do app.

6. Services sem uso:
- `src/server/services/AuthService.ts`, `src/server/services/PermissionService.ts`, `src/server/services/SessionService.ts`, `src/server/services/UserService.ts` (Esses parecem ser resquícios de uma arquitetura anterior ou duplicados do backend real em Node).

7. Repositories sem uso:
- `src/server/repositories/*` (TransactionRepository, UserRepository, LicenseRepository, SessionRepository, ContentRepository) - Arquivos no Frontend que tentavam simular backend.

8. Imports desnecessários:
- Importação do `axios` em arquivos legados, se houver, ou no package.json.

9. Dependências desnecessárias:
- `@google/genai`
- `axios` (não utilizado nos fetchs atuais da API Express)
- `motion`
- `pg` (O backend interage com o Supabase usando REST/fetch ou `@supabase/supabase-js`, e a lib `pg` nativa está sem uso no client).
- Em Dev Dependencies: `autoprefixer`, `tailwindcss` (Substituído pelo `@tailwindcss/vite` na v4).

10. Variáveis de ambiente não utilizadas:
- Nenhuma identificada, todas do `.env.example` estão mapeadas, exceto as do Lynx que estão documentadas como pendentes.

11. TODOs encontrados:
- O projeto apresenta ausência de marcações TODO diretas nos componentes principais. A lógica está fechada com as rotas.

12. FIXMEs encontrados:
- Ausência de FIXMEs espalhados, o código foi reescrito limpando marcações antigas.

13. Mocks restantes:
- Mock do Simulador de TV (lista de filmes locais, canais JSON estáticos). Esse mock é aceitável por ser apenas visualização no painel Web, o app Flutter não os utiliza mais.

14. console.logs restantes:
- `src/components/TVSimulator/*.tsx` possui `console.error` de manipulações de player.
- `src/components/CustomerPortal/CustomerPortal.tsx` linha 142.
- `src/hooks/useSupabaseData.ts` linha 54.
- `server/routes/lynxRoutes.ts` linha 85.

15. Código comentado desnecessário:
- Trechos no `TVLiveTvView` e `TVSeriesView` contêm handlers antigos comentados.

16. Problemas de segurança encontrados:
- Os repositórios simulados (`src/server/repositories`) no frontend podem induzir o desenvolvedor a colocar lógicas de backend no navegador se não forem excluídos.

17. Problemas de performance encontrados:
- O hook `useSupabaseData` pode causar re-renderizações desnecessárias em montagens caso as dependências do `useEffect` não estejam estritamente controladas, o que foi parcialmente mitigado.

18. Problemas de arquitetura encontrados:
- A pasta `src/server/` dentro do ambiente React cria confusão com o `server/` root. A arquitetura Web deve apenas chamar a API, e não ter repositórios.

19. Problemas de organização encontrados:
- Arquivos de shell, scripts python, arquivos txt sujos no diretório principal.
- Pastas de migrações (`supabase/migrations` e `supabase/setup`) contendo várias tentativas sobrepostas.

20. Arquivos que podem ser removidos:
- Todos os arquivos `.txt`, `.py`, `.sh` de manutenção na raiz.
- A pasta `src/server/` inteira.
- `public/db_admin.sql`, `public/db_schema.sql` se a versão de produção está em `supabase-schema.sql`.
- `temp.sql`.

21. Correções recomendadas:
- Remover as dependências não utilizadas (`npm uninstall @google/genai axios motion pg`).
- Limpar os scripts na raiz.
- Deletar a pasta `src/server/` para evitar vazamento de contexto.
- Remover consoles explícitos.
- Consolidar as migrações SQL.

22. Prioridade de cada correção:
- Limpeza da pasta `src/server/`: ALTA
- Limpeza dos scripts sujos na raiz: MÉDIA
- Desinstalação de pacotes obsoletos: MÉDIA
- Limpeza de console.logs: BAIXA
- Remoção do simulador mockado (opcional caso a equipe deseje manter para o painel): BAIXA
