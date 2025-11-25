import { z } from 'zod';
import { Currency, DonationType } from '@prisma/client';

export const createDonationSchema = z.object({
  causeId: z.string().min(1, 'Cause is required'),
  type: z.nativeEnum(DonationType, { required_error: 'Type is required' }),
  amount: z.number().positive('Amount must be positive'),
  currency: z.nativeEnum(Currency).default(Currency.CAD),
  processorFees: z.number().min(0).optional(),
  donorRemarks: z.string().optional(),
  templeRemarks: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  otherCause: z.string().optional(),
});

const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') {
    return val === 'true' || val === '1';
  }
  if (typeof val === 'boolean') return val;
  return undefined;
}, z.boolean());

export const validateDonationSchema = z.object({
  approved: booleanish,
  remarks: z.string().optional(),
});
