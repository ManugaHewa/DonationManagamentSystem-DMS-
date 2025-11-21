import { z } from 'zod';

export const generateReportSchema = z.object({
  reportType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  format: z.string().optional(),
});
