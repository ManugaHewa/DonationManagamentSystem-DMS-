import { Job } from 'bullmq';
import { prisma, DonationStatus } from '@dms/database';
import { logger } from '../utils/logger';
import { queueJob } from '../utils/queue';
import { JOB_NAMES } from '../jobs';

interface YearEndReceiptsJobData {
  fiscalYear: number;
  batchSize?: number;
}

export async function sendYearEndReceipts(job: Job<YearEndReceiptsJobData>) {
  const { fiscalYear, batchSize = 50 } = job.data;

  try {
    logger.info(`Processing year-end receipts for ${fiscalYear}`);

    // Find all donors with validated donations in fiscal year
    const startDate = new Date(`${fiscalYear}-01-01`);
    const endDate = new Date(`${fiscalYear}-12-31`);

    const donors = await prisma.donor.findMany({
      where: {
        donations: {
          some: {
            status: DonationStatus.VALIDATED,
            dateRecorded: {
              gte: startDate,
              lte: endDate,
            },
            isTaxDeductible: true,
          },
        },
      },
      include: {
        donations: {
          where: {
            status: DonationStatus.VALIDATED,
            dateRecorded: {
              gte: startDate,
              lte: endDate,
            },
            isTaxDeductible: true,
          },
          include: {
            cause: true,
          },
        },
      },
    });

    logger.info(`Found ${donors.length} donors for year-end receipts`);

    let processed = 0;
    let errors = 0;

    // Process in batches
    for (let i = 0; i < donors.length; i += batchSize) {
      const batch = donors.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (donor) => {
          try {
            // Calculate totals
            const totalAmount = donor.donations.reduce(
              (sum, donation) => sum + Number(donation.amount),
              0
            );

            const taxDeductible = donor.donations.reduce(
              (sum, donation) => sum + Number(donation.netAmount),
              0
            );

            // Check if receipt already exists
            const existingReceipt = await prisma.receipt.findFirst({
              where: {
                donorId: donor.id,
                fiscalYear,
                type: 'YEAR_END_SUMMARY',
              },
            });

            if (existingReceipt) {
              logger.info(`Receipt already exists for donor ${donor.id} - ${fiscalYear}`);
              return;
            }

            // Generate receipt number
            const receiptNumber = `YE${fiscalYear}-${donor.id.substring(0, 8).toUpperCase()}`;

            // Create receipt
            const receipt = await prisma.receipt.create({
              data: {
                receiptNumber,
                donorId: donor.id,
                type: 'YEAR_END_SUMMARY',
                format: 'EMAIL',
                fiscalYear,
                totalAmount,
                taxDeductible,
              },
            });

            // Queue PDF generation
            await queueJob(JOB_NAMES.GENERATE_RECEIPT_PDF, {
              receiptId: receipt.id,
            });

            processed++;
            logger.info(`Year-end receipt created for donor ${donor.id}`);
          } catch (error) {
            errors++;
            logger.error(`Failed to create receipt for donor ${donor.id}`, error);
          }
        })
      );

      // Update progress
      await job.updateProgress(Math.round(((i + batch.length) / donors.length) * 100));
    }

    logger.info(
      `Year-end receipts processing completed: ${processed} successful, ${errors} errors`
    );

    return {
      success: true,
      fiscalYear,
      totalDonors: donors.length,
      processed,
      errors,
    };
  } catch (error) {
    logger.error(`Failed to process year-end receipts for ${fiscalYear}`, error);
    throw error;
  }
}
