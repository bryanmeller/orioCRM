import { supabaseAdmin } from '../../supabaseAdmin.js';

export class LynxWebhookService {
  constructor() {
  }

  async handleWebhook(payload: any, signature: string | null) {
    throw new Error('Pagamento temporariamente indisponível. Integração com o Gateway em configuração.');
  }
}
