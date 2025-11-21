import { Request, Response } from 'express';
import { prisma } from '@dms/database';
import { AuthRequest } from '../middleware/auth';

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
      const receipts = await prisma.taxReceipt.findMany({
        where: { donorId: user.donor.id },
        orderBy: { issuedAt: 'desc' },
        include: { donor: { select: { firstName: true, lastName: true } } },
      });

      const mapped = receipts.map((receipt) => ({
        ...receipt,
        amount: parseFloat(receipt.totalAmount.toString()),
        taxDeductible: parseFloat(receipt.taxDeductible.toString()),
        issueDate: receipt.issuedAt,
        receiptUrl: receipt.fileUrl,
      }));

      res.json({ success: true, data: mapped });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch receipts' });
    }
  }

  async downloadReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const receipt = await prisma.taxReceipt.findUnique({ where: { id } });
      if (!receipt) {
        return res.status(404).json({ success: false, message: 'Receipt not found' });
      }
      res.json({ success: true, data: { receiptUrl: receipt.receiptUrl } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to download receipt' });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const receipts = await prisma.taxReceipt.findMany({
        include: { donor: { select: { firstName: true, lastName: true } } },
        orderBy: { issuedAt: 'desc' },
      });

      const mapped = receipts.map((receipt) => ({
        ...receipt,
        amount: parseFloat(receipt.totalAmount.toString()),
        taxDeductible: parseFloat(receipt.taxDeductible.toString()),
        issueDate: receipt.issuedAt,
        receiptUrl: receipt.fileUrl,
      }));

      res.json({ success: true, data: mapped });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch receipts' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const receipt = await prisma.taxReceipt.findUnique({
        where: { id },
        include: { donor: true },
      });
      if (!receipt) {
        return res.status(404).json({ success: false, message: 'Receipt not found' });
      }
      const mapped = {
        ...receipt,
        amount: parseFloat(receipt.totalAmount.toString()),
        taxDeductible: parseFloat(receipt.taxDeductible.toString()),
        issueDate: receipt.issuedAt,
        receiptUrl: receipt.fileUrl,
      };

      res.json({ success: true, data: mapped });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch receipt' });
    }
  }

  async generate(req: Request, res: Response) {
    try {
      const data = req.body;
      // Receipt generation logic would go here
      res.json({ success: true, message: 'Receipt generation queued' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to generate receipt' });
    }
  }

  async bulkGenerate(req: Request, res: Response) {
    try {
      const data = req.body;
      // Bulk receipt generation logic would go here
      res.json({ success: true, message: 'Bulk receipt generation queued' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to generate bulk receipts' });
    }
  }

  async generateYearEnd(req: Request, res: Response) {
    try {
      const { fiscalYear } = req.params;
      // Year-end receipt generation logic would go here
      res.json({ success: true, message: `Year-end receipts for ${fiscalYear} generation queued` });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to generate year-end receipts' });
    }
  }
}
