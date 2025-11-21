export const JOB_NAMES = {
  SEND_ACKNOWLEDGMENT_EMAIL: 'send-acknowledgment-email',
  GENERATE_RECEIPT_PDF: 'generate-receipt-pdf',
  SEND_YEAR_END_RECEIPTS: 'send-year-end-receipts',
  ALOKA_PUJA_REMINDER: 'aloka-puja-reminder',
  DONATION_REPORT: 'donation-report',
} as const;

export type JobName = typeof JOB_NAMES[keyof typeof JOB_NAMES];
