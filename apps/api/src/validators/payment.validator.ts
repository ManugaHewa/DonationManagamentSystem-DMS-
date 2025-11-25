import { z } from 'zod';

export const cardPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('CAD'),
  cardNumber: z.string(),
  expMonth: z.number().min(1).max(12),
  expYear: z.number().min(0).max(99),
  cvc: z.string().min(3).max(4),
  mode: z.enum(['live', 'test']).optional(),
});
