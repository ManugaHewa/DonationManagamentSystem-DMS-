import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { JOB_NAMES } from './jobs';
import { sendAcknowledgmentEmail } from './processors/acknowledgment-email.processor';
import { generateReceiptPDF } from './processors/receipt-pdf.processor';
import { sendYearEndReceipts } from './processors/year-end-receipts.processor';
import { sendAlokaPujaReminder } from './processors/aloka-puja-reminder.processor';
import { generateDonationReport } from './processors/donation-report.processor';

dotenv.config();

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Job processors mapping
const processors: Record<string, (job: Job) => Promise<any>> = {
  [JOB_NAMES.SEND_ACKNOWLEDGMENT_EMAIL]: sendAcknowledgmentEmail,
  [JOB_NAMES.GENERATE_RECEIPT_PDF]: generateReceiptPDF,
  [JOB_NAMES.SEND_YEAR_END_RECEIPTS]: sendYearEndReceipts,
  [JOB_NAMES.ALOKA_PUJA_REMINDER]: sendAlokaPujaReminder,
  [JOB_NAMES.DONATION_REPORT]: generateDonationReport,
};

// Create workers for each job type
Object.entries(processors).forEach(([jobName, processor]) => {
  const worker = new Worker(
    jobName,
    async (job: Job) => {
      logger.info(`Processing job: ${jobName} [${job.id}]`);
      try {
        const result = await processor(job);
        logger.info(`Job completed: ${jobName} [${job.id}]`);
        return result;
      } catch (error) {
        logger.error(`Job failed: ${jobName} [${job.id}]`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    }
  );

  worker.on('completed', (job) => {
    logger.info(`✅ Job completed: ${jobName} [${job.id}]`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Job failed: ${jobName} [${job?.id}]`, err);
  });

  logger.info(`🔄 Worker started for: ${jobName}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing workers...');
  await connection.quit();
  process.exit(0);
});

logger.info('🚀 Worker service started');
