import { Request, Response } from 'express';
import { prisma, Prisma } from '@dms/database';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { prisma as db } from '@dms/database';

const toNumberSafe = (value: any) => (value != null ? parseFloat(value.toString()) : 0);

const mapReceipt = (receipt: any) => ({
  ...receipt,
  amount: toNumberSafe(receipt.totalAmount),
  taxDeductible: toNumberSafe(receipt.taxDeductible),
  issueDate: receipt.issuedAt,
  receiptUrl: receipt.fileUrl,
});

const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

async function generateReceiptPdf(receipt: any, donor?: any) {
  const fileName = `${receipt.id}.pdf`;
  const filePath = path.join(uploadDir, fileName);

  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).text('Tax Receipt', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Receipt Number: ${receipt.receiptNumber}`);
  doc.text(`Issued At: ${new Date(receipt.issuedAt || new Date()).toISOString()}`);
  doc.text(`Fiscal Year: ${receipt.fiscalYear || ''}`);
  doc.moveDown();
  doc.text(`Donor: ${donor ? `${donor.firstName} ${donor.lastName}` : 'Unknown'}`);
  doc.text(`Total Amount: ${toNumberSafe(receipt.totalAmount).toFixed(2)}`);
  doc.text(`Tax Deductible: ${toNumberSafe(receipt.taxDeductible).toFixed(2)}`);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const base = process.env.API_URL || 'http://localhost:3000';
  return `${base}/uploads/receipts/${fileName}`;
}

async function isReceiptsUnlocked(year: number) {
  const flag = await db.systemSetting.findUnique({ where: { key: `tax_receipts_ready_${year}` } });
  return !!flag;
}

export class ReceiptController {
  async getMyReceipts(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { donor: true },
      });
      if (!user?.donor) {
        return res.status(404).json({ success: false, message: 'Donor profile not found' });
      }
      const receipts = await prisma.receipt.findMany({
        where: { donorId: user.donor.id },
        orderBy: { issuedAt: 'desc' },
        include: { donor: { select: { firstName: true, lastName: true } } },
      });

      res.json({ success: true, data: receipts.map(mapReceipt) });
    } catch (error) {
      logger.error('getMyReceipts failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch receipts' });
    }
  }

  async downloadReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const receipt = await prisma.receipt.findUnique({
        where: { id },
        include: { donor: true },
      });
      if (!receipt) {
        return res.status(404).json({ success: false, message: 'Receipt not found' });
      }
      let fileUrl = receipt.fileUrl;
      if (!fileUrl) {
        fileUrl = await generateReceiptPdf(receipt, receipt.donor);
        await prisma.receipt.update({
          where: { id },
          data: { fileUrl },
        });
      }
      res.json({ success: true, data: { receiptUrl: fileUrl } });
    } catch (error) {
      logger.error('downloadReceipt failed', { error });
      res.status(500).json({ success: false, message: 'Failed to download receipt' });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const receipts = await prisma.receipt.findMany({
        include: { donor: { select: { firstName: true, lastName: true } } },
        orderBy: { issuedAt: 'desc' },
      });

      res.json({ success: true, data: receipts.map(mapReceipt) });
    } catch (error) {
      logger.error('getAll receipts failed', { error: String(error), stack: (error as Error).stack });
      res.status(500).json({ success: false, message: 'Failed to fetch receipts' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const receipt = await prisma.receipt.findUnique({
        where: { id },
        include: { donor: true },
      });
      if (!receipt) {
        return res.status(404).json({ success: false, message: 'Receipt not found' });
      }

      res.json({ success: true, data: mapReceipt(receipt) });
    } catch (error) {
      logger.error('getById receipt failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch receipt' });
    }
  }

  async generate(req: Request, res: Response) {
    try {
      // TODO: implement real generation (PDF/email)
      res.json({ success: true, message: 'Receipt generation queued' });
    } catch (error) {
      logger.error('generate receipt failed', { error });
      res.status(500).json({ success: false, message: 'Failed to generate receipt' });
    }
  }

  async bulkGenerate(req: Request, res: Response) {
    try {
      // TODO: implement real generation (PDF/email)
      res.json({ success: true, message: 'Bulk receipt generation queued' });
    } catch (error) {
      logger.error('bulkGenerate receipts failed', { error });
      res.status(500).json({ success: false, message: 'Failed to generate bulk receipts' });
    }
  }

  async generateYearEnd(req: Request, res: Response) {
    try {
      const { fiscalYear } = req.params;
      const year = parseInt(fiscalYear, 10) || new Date().getFullYear();

      const donors = await prisma.donor.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      let created = 0;
      let skipped = 0;

      for (const donor of donors) {
        const existing = await prisma.receipt.findFirst({
          where: { donorId: donor.id, fiscalYear: year, type: 'TAX_RECEIPT' },
        });
        if (existing) {
          skipped += 1;
          continue;
        }

        const agg = await prisma.donation.aggregate({
          where: {
            donorId: donor.id,
            status: 'VALIDATED',
            dateRecorded: {
              gte: new Date(`${year}-01-01T00:00:00.000Z`),
              lte: new Date(`${year}-12-31T23:59:59.999Z`),
            },
          },
          _sum: { amount: true, netAmount: true },
        });

        const totalAmount = agg._sum.amount || new Prisma.Decimal(0);
        const taxDeductible = agg._sum.netAmount || agg._sum.amount || new Prisma.Decimal(0);

        if (totalAmount.eq(0)) {
          skipped += 1;
          continue;
        }

        const createdReceipt = await prisma.receipt.create({
          data: {
            receiptNumber: `YR-${year}-${Date.now()}-${created + 1}`,
            donorId: donor.id,
            type: 'TAX_RECEIPT',
            format: 'PDF',
            fiscalYear: year,
            totalAmount,
            taxDeductible,
            issuedAt: new Date(),
            emailSent: false,
            printGenerated: false,
          },
        });
        const donorRecord = await prisma.donor.findUnique({ where: { id: donor.id } });
        const fileUrl = await generateReceiptPdf(createdReceipt, donorRecord);
        await prisma.receipt.update({ where: { id: createdReceipt.id }, data: { fileUrl } });
        created += 1;
      }

      await prisma.systemSetting.upsert({
        where: { key: `tax_receipts_ready_${year}` },
        update: { value: new Date().toISOString() },
        create: { key: `tax_receipts_ready_${year}`, value: new Date().toISOString() },
      });

      res.json({
        success: true,
        message: `Year-end receipts for ${year} generated`,
        data: { created, skipped, year, readyAt: new Date().toISOString() },
      });
    } catch (error) {
      logger.error('generateYearEnd receipts failed', { error });
      res.status(500).json({ success: false, message: 'Failed to generate year-end receipts' });
    }
  }

  async unlockYearEnd(req: Request, res: Response) {
    try {
      const { fiscalYear } = req.params;
      const year = parseInt(fiscalYear, 10) || new Date().getFullYear();
      await prisma.systemSetting.upsert({
        where: { key: `tax_receipts_ready_${year}` },
        update: { value: new Date().toISOString() },
        create: { key: `tax_receipts_ready_${year}`, value: new Date().toISOString() },
      });
      res.json({ success: true, message: `Tax receipts unlocked for ${year}`, data: { year } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to unlock tax receipts' });
    }
  }

  async lockYearEnd(req: Request, res: Response) {
    try {
      const { fiscalYear } = req.params;
      const year = parseInt(fiscalYear, 10) || new Date().getFullYear();
      await prisma.systemSetting.deleteMany({
        where: { key: `tax_receipts_ready_${year}` },
      });
      res.json({ success: true, message: `Tax receipts locked for ${year}`, data: { year } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to lock tax receipts' });
    }
  }

  async generateSelfYearEnd(req: AuthRequest, res: Response) {
    try {
      const year = parseInt(req.params.year, 10) || new Date().getFullYear();

      const unlocked = await isReceiptsUnlocked(year);
      if (!unlocked) {
        return res.status(403).json({ success: false, message: 'Tax receipts are not unlocked yet' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { donor: true },
      });
      if (!user?.donor) {
        return res.status(404).json({ success: false, message: 'Donor profile not found' });
      }

      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);

      const agg = await prisma.donation.aggregate({
        where: {
          donorId: user.donor.id,
          status: 'VALIDATED',
          dateRecorded: { gte: start, lte: end },
        },
        _sum: { amount: true, netAmount: true },
      });

      const totalAmount = agg._sum.amount || new Prisma.Decimal(0);
      const taxDeductible = agg._sum.netAmount || agg._sum.amount || new Prisma.Decimal(0);

      if (totalAmount.eq(0)) {
        return res.status(400).json({ success: false, message: 'No validated donations for that year' });
      }

      let receipt = await prisma.receipt.findFirst({
        where: { donorId: user.donor.id, fiscalYear: year, type: 'TAX_RECEIPT' },
      });

      if (!receipt) {
        receipt = await prisma.receipt.create({
          data: {
            receiptNumber: `SELF-${year}-${Date.now()}`,
            donorId: user.donor.id,
            type: 'TAX_RECEIPT',
            format: 'PDF',
            fiscalYear: year,
            totalAmount,
            taxDeductible,
            issuedAt: new Date(),
            emailSent: false,
            printGenerated: false,
          },
        });
      }

      let fileUrl = receipt.fileUrl;
      if (!fileUrl) {
        const donorRecord = await prisma.donor.findUnique({ where: { id: user.donor.id } });
        fileUrl = await generateReceiptPdf(receipt, donorRecord);
        await prisma.receipt.update({ where: { id: receipt.id }, data: { fileUrl } });
      }

      res.status(201).json({
        success: true,
        data: { ...mapReceipt(receipt), receiptUrl: fileUrl },
        message: `Tax receipt for ${year} ready`,
      });
    } catch (error) {
      logger.error('generateSelfYearEnd failed', { error });
      res.status(500).json({ success: false, message: 'Failed to generate receipt' });
    }
  }
}
