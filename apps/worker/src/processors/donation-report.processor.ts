import { Job } from 'bullmq';
import { prisma } from '@dms/database';
import { logger } from '../utils/logger';
import { Workbook } from 'exceljs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

interface DonationReportJobData {
  startDate: string;
  endDate: string;
  format: 'excel' | 'csv';
  requestedBy: string;
}

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export async function generateDonationReport(job: Job<DonationReportJobData>) {
  const { startDate, endDate, format, requestedBy } = job.data;

  try {
    logger.info(`Generating donation report: ${startDate} to ${endDate}`);

    // Fetch donations
    const donations = await prisma.donation.findMany({
      where: {
        dateRecorded: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        donor: true,
        cause: true,
      },
      orderBy: {
        dateRecorded: 'asc',
      },
    });

    logger.info(`Found ${donations.length} donations for report`);

    // Create Excel workbook
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Donations');

    // Add headers
    worksheet.columns = [
      { header: 'Date Recorded', key: 'dateRecorded', width: 15 },
      { header: 'Date Verified', key: 'dateVerified', width: 15 },
      { header: 'Donor Name', key: 'donorName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Cause', key: 'cause', width: 20 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Processor Fees', key: 'processorFees', width: 15 },
      { header: 'Net Amount', key: 'netAmount', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Donor Remarks', key: 'donorRemarks', width: 30 },
      { header: 'Temple Remarks', key: 'templeRemarks', width: 30 },
    ];

    // Add data
    donations.forEach((donation) => {
      worksheet.addRow({
        dateRecorded: new Date(donation.dateRecorded).toLocaleDateString(),
        dateVerified: donation.dateVerified
          ? new Date(donation.dateVerified).toLocaleDateString()
          : '',
        donorName: donation.donor
          ? `${donation.donor.firstName} ${donation.donor.lastName}`
          : 'Anonymous',
        email: donation.donor?.email || '',
        cause: donation.cause.name,
        type: donation.type,
        amount: Number(donation.amount),
        currency: donation.currency,
        processorFees: Number(donation.processorFees || 0),
        netAmount: Number(donation.netAmount),
        status: donation.status,
        donorRemarks: donation.donorRemarks || '',
        templeRemarks: donation.templeRemarks || '',
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0ea5e9' },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Upload to S3
    const fileName = `reports/donation-report-${startDate}-to-${endDate}-${Date.now()}.xlsx`;
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: fileName,
        Body: buffer,
        ContentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    );

    const fileUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${fileName}`;

    logger.info(`Donation report generated: ${fileName}`);

    return {
      success: true,
      startDate,
      endDate,
      totalDonations: donations.length,
      fileUrl,
      fileName,
    };
  } catch (error) {
    logger.error('Failed to generate donation report', error);
    throw error;
  }
}
