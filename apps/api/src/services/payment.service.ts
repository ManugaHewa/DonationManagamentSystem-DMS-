import { randomUUID } from 'crypto';

type CardPaymentRequest = {
  amount: number;
  currency?: string;
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  mode?: 'live' | 'test';
};

type CardPaymentResult = {
  transactionId: string;
  authorizationCode: string;
  amount: number;
  currency: string;
  status: 'AUTHORIZED' | 'DECLINED';
  simulated: boolean;
  mode: 'live' | 'test';
  last4: string;
};

export class PaymentService {
  private luhnCheck(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let toggle = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (toggle) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      toggle = !toggle;
    }
    return sum % 10 === 0;
  }

  async processCardPayment(payload: CardPaymentRequest): Promise<CardPaymentResult> {
    const { amount, currency = 'CAD', cardNumber, expMonth, expYear, cvc, mode = 'test' } = payload;

    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    if (!cardNumber || !this.luhnCheck(cardNumber)) {
      throw new Error('Invalid card number');
    }
    if (!cvc || cvc.length < 3 || cvc.length > 4) {
      throw new Error('Invalid CVC');
    }
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // YY
    const currentMonth = now.getMonth() + 1;
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      throw new Error('Card expired');
    }

    // In test mode, always simulate approval for recognized test numbers (4242...) and decline otherwise
    const isTestMode = mode === 'test' || !process.env.STRIPE_SECRET_KEY;
    const approved =
      isTestMode && (cardNumber.endsWith('4242') || cardNumber.replace(/\D/g, '') === '4111111111111111');

    if (!approved && isTestMode) {
      throw new Error('Test transaction declined (use 4242 4242 4242 4242 to approve)');
    }

    return {
      transactionId: `txn_${randomUUID()}`,
      authorizationCode: Math.floor(100000 + Math.random() * 900000).toString(),
      amount,
      currency,
      status: 'AUTHORIZED',
      simulated: isTestMode,
      mode: isTestMode ? 'test' : 'live',
      last4: cardNumber.slice(-4),
    };
  }
}
