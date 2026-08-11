export class LynxClient {
  constructor() {
  }

  async createPixCharge(orderId: string, amount: number, description: string) {
    throw new Error('Pagamento temporariamente indisponível. Integração com o Gateway em configuração.');
  }

  async getCharge(transactionId: string) {
    throw new Error('Pagamento temporariamente indisponível. Integração com o Gateway em configuração.');
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    return false;
  }
}
