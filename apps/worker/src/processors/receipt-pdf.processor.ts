import { Job } from 'bullmq';
import { prisma } from '@dms/database';
import PDFDocument from 'pdfkit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';
import { Readable } from 'stream';

interface ReceiptPDFJobData {
  receiptId: string;
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

export async function generateReceiptPDF(job: Job<ReceiptPDFJobData>) {
  const { receiptId } = job.data;

  try {
    // Fetch receipt details
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        donor: true,
        donation: {
          include: {
            cause: true,
          },
        },
      },
    });

    if (!receipt) {
      throw new Error(`Receipt not found: ${receiptId}`);
    }

    // Create PDF
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // PDF Header
    doc
      .fontSize(20)
      .text('Official Donation Receipt', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .text('Halton-Peel Buddhist Cultural Society', { align: 'center' })
      .text('[Address Line 1]', { align: 'center' })
      .text('[City, Province, Postal Code]', { align: 'center' })
      .text('CRA Registration #: [XXXXXXXXX]', { align: 'center' })
      .moveDown(2);

    // Receipt Number and Date
    doc
      .fontSize(10)
      .text(`Receipt Number: ${receipt.receiptNumber}`, { align: 'left' })
      .text(`Issue Date: ${new Date(receipt.issuedAt).toLocaleDateString()}`, { align: 'left' })
      .moveDown(2);

    // Donor Information
    doc
      .fontSize(12)
      .text('Donor Information:', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text(`${receipt.donor.firstName} ${receipt.donor.lastName}`)
      .text(receipt.donor.address)
      .text(`${receipt.donor.city}, ${receipt.donor.province} ${receipt.donor.postalCode}`)
      .text(`Email: ${receipt.donor.email}`)
      .moveDown(2);

    // Donation Details
    doc
      .fontSize(12)
      .text('Donation Details:', { underline: true })
      .moveDown(0.5);

    if (receipt.donation) {
      doc
        .fontSize(10)
        .text(`Date Received: ${new Date(receipt.donation.dateRecorded).toLocaleDateString()}`)
        .text(`Purpose: ${receipt.donation.cause.name}`)
        .text(`Amount: $${receipt.totalAmount.toFixed(2)} ${receipt.donation.currency}`)
        .text(`Eligible Amount for Tax Receipt: $${receipt.taxDeductible.toFixed(2)}`)
        .moveDown(2);
    }

    // Tax Information
    doc
      .fontSize(10)
      .text(
        'This official donation receipt is for income tax purposes.',
        { align: 'left' }
      )
      .text(
        'This organization is registered as a charitable organization under the Income Tax Act (Canada).',
        { align: 'left' }
      )
      .moveDown(2);

    // Footer
    doc
      .fontSize(8)
      .text('Thank you for your generous support!', { align: 'center' })
      .text('For questions, contact: info@temple.org', { align: 'center' });

    doc.end();

    // Wait for PDF generation
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve());
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Upload to S3/MinIO
    const fileName = `receipts/${receipt.receiptNumber}-${Date.now()}.pdf`;
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: fileName,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      })
    );

    // Update receipt with file URL
    const fileUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${fileName}`;
    
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        fileUrl,
        fileName,
        printGenerated: true,
      },
    });

    logger.info(`Receipt PDF generated: ${receiptId}`);

    return { success: true, receiptId, fileUrl };
  } catch (error) {
    logger.error(`Failed to generate receipt PDF: ${receiptId}`, error);
    throw error;
  }
}
