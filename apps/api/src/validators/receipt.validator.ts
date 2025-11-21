import { z } from 'zod';

export const generateReceiptSchema = z.object({
  donationId: z.string().uuid(),
  type: z.string(),
  format: z.string(),
});

export const bulkReceiptSchema = z.object({
  donationIds: z.array(z.string().uuid()),
  type: z.string(),
  format: z.string(),
});
