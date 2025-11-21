import { z } from 'zod';

export const createAlokaPujaSchema = z.object({
  donorId: z.string().uuid().optional(),
  pujaDate: z.string(),
  pujaType: z.string(),
  notifyStaff: z.boolean().optional(),
  notes: z.string().optional(),
});

export const updateAlokaPujaSchema = createAlokaPujaSchema.partial();
