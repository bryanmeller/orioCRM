# LYNX Gateway - Integração Pendente

A integração com o Gateway de pagamento LYNX foi preparada estruturalmente, mas permanece desativada no momento devido à falta de documentação oficial, payloads e credenciais.

Para finalizar a integração, os seguintes itens são necessários:

1. **Documentação Oficial:** Formatos de payloads para criação de transações PIX.
2. **Endpoints Oficiais:** URLs exatas para API em Sandbox e Produção.
3. **Credenciais de Autenticação:** Client ID e Client Secret válidos.
4. **Validação de Webhook:** A fórmula ou método oficial da LYNX para validação (HMAC-SHA256, chaves públicas, etc).
5. **Eventos e Status do Webhook:** Lista detalhada dos possíveis status de transações e formatos dos eventos para garantir o processamento correto.

## Status Atual
- As rotas `server/routes/lynxRoutes.ts` e arquivos de serviço existem.
- A tabela `payment_orders` está criada e funcional.
- O botão "GERAR PAGAMENTO PIX LYNX" nos painéis exibe atualmente a mensagem *"Pagamento temporariamente indisponível. Integração com o Gateway em configuração."*

Assim que a documentação da LYNX estiver disponível, ativaremos os serviços.
