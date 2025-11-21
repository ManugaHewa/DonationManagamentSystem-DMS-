import cron from 'node-cron';
import { queueJob } from '../utils/queue';
import { JOB_NAMES } from '../jobs';
import { logger } from '../utils/logger';

// Daily Aloka Puja reminders (7 days ahead) - Run at 9 AM daily
cron.schedule('0 9 * * *', async () => {
  logger.info('Running daily Aloka Puja reminder job');
  try {
    await queueJob(JOB_NAMES.ALOKA_PUJA_REMINDER, { daysAhead: 7 });
  } catch (error) {
    logger.error('Failed to queue Aloka Puja reminder job', error);
  }
});

// Year-end receipts - Run on January 15th at 2 AM
cron.schedule('0 2 15 1 *', async () => {
  const previousYear = new Date().getFullYear() - 1;
  logger.info(`Running year-end receipts job for ${previousYear}`);
  try {
    await queueJob(JOB_NAMES.SEND_YEAR_END_RECEIPTS, { fiscalYear: previousYear });
  } catch (error) {
    logger.error('Failed to queue year-end receipts job', error);
  }
});

logger.info('📅 Scheduled jobs initialized');
