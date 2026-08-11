import { supabaseAdmin } from '../../supabaseAdmin.js';

export class LynxPaymentService {
  constructor() {
  }

  async createSelfServiceOrder(buyerId: string, planId: string) {
    throw new Error('Pagamento temporariamente indisponível. Integração com o Gateway em configuração.');
  }

  async createResellerCreditOrder(buyerId: string, credits: number, price: number) {
    throw new Error('Pagamento temporariamente indisponível. Integração com o Gateway em configuração.');
  }

  async createProviderSubscriptionOrder(buyerId: string, planId: string, isFirstTime: boolean = false) {
    throw new Error('Pagamento temporariamente indisponível. Integração com o Gateway em configuração.');
  }

  async createOrder(buyerId: string, orderType: string, referenceId: string | null, amount: number, credits: number, description: string) {
    throw new Error('Pagamento temporariamente indisponível. Integração com o Gateway em configuração.');
  }

  async getOrderStatus(orderId: string, userId: string) {
    throw new Error('Pagamento temporariamente indisponível. Integração com o Gateway em configuração.');
  }
}
