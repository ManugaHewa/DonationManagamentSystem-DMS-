import { Request, Response } from 'express';
import { prisma } from '@dms/database';
import PDFDocument from 'pdfkit';

const toNumberSafe = (value: any) => (value != null ? parseFloat(value.toString()) : 0);

export class ReportController {
  async getDashboardStats(req: Request, res: Response) {
    try {
      const totalDonations = await prisma.donation.count();
      const totalAmountAgg = await prisma.donation.aggregate({
        _sum: { amount: true },
      });
      const totalDonors = await prisma.donor.count();

      const totalAmount = totalAmountAgg._sum.amount ? parseFloat(totalAmountAgg._sum.amount.toString()) : 0;

      const stats = { totalDonations, totalAmount, totalDonors };
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('getDashboardStats failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
  }

  async getDonationReport(req: Request, res: Response) {
    try {
      const mapped = await this.fetchDonationRows();
      res.json({ success: true, data: mapped });
    } catch (error) {
      console.error('getDonationReport failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch donation report' });
    }
  }

  async generateDonationReport(req: Request, res: Response) {
    res.json({ success: true, message: 'Report generation queued' });
  }

  async getDonorReport(req: Request, res: Response) {
    try {
      const donors = await prisma.donor.findMany({
        include: { donations: true },
      });
      const mapped = donors.map((d) => ({
        id: d.id,
        name: `${d.firstName} ${d.lastName}`,
        email: d.email,
        totalDonations: d.donations.length,
        totalAmount: d.donations.reduce((sum, don) => sum + toNumberSafe(don.amount), 0),
      }));
      res.json({ success: true, data: mapped });
    } catch (error) {
      console.error('getDonorReport failed', error);
      res.status(500).json({ success: false, message: 'Failed to fetch donor report' });
    }
  }

  async getDonorSummary(req: Request, res: Response) {
    res.json({ success: true, data: { summary: 'Donor summary data' } });
  }

  async getFinancialSummary(req: Request, res: Response) {
    res.json({ success: true, data: { summary: 'Financial summary data' } });
  }

  async getFinancialByCause(req: Request, res: Response) {
    res.json({ success: true, data: { byCause: 'Financial by cause data' } });
  }

  async getFinancialByType(req: Request, res: Response) {
    res.json({ success: true, data: { byType: 'Financial by type data' } });
  }

  async getTaxReceiptReport(req: Request, res: Response) {
    const { fiscalYear } = req.params;
    res.json({ success: true, data: { fiscalYear, receipts: [] } });
  }

  private buildDonationCsv = async () => {
    const rows = await this.fetchDonationRows();
    const csvRows = rows.map((r) => ({
      Date: r.dateRecorded.toISOString(),
      Donor: r.donor,
      Cause: r.cause,
      Type: r.type,
      Status: r.status,
      Amount: r.amount.toFixed(2),
      Fees: r.processorFees.toFixed(2),
      Net: r.netAmount.toFixed(2),
      Currency: r.currency,
    }));
    const headers = Object.keys(csvRows[0] || { Date: '', Donor: '', Cause: '', Type: '', Status: '', Amount: '', Fees: '', Net: '', Currency: '' });
    const csvBody = csvRows
      .map((r) => headers.map((h) => `"${String((r as any)[h] ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    return headers.join(',') + '\n' + csvBody;
  };

  async exportCSV(req: Request, res: Response) {
    try {
      const csv = await this.buildDonationCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="donations.csv"');
      res.send(csv);
    } catch (error) {
      console.error('exportCSV failed', error);
      res.status(500).json({ success: false, message: 'Failed to export CSV', error: (error as Error).message });
    }
  }

  async exportExcel(req: Request, res: Response) {
    // For simplicity, return CSV but with .xlsx filename for bookkeeping import
    try {
      const csv = await this.buildDonationCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="donations.xlsx"');
      res.send(csv);
    } catch (error) {
      console.error('exportExcel failed', error);
      res.status(500).json({ success: false, message: 'Failed to export Excel', error: (error as Error).message });
    }
  }

  async exportPDF(req: Request, res: Response) {
    try {
      const rows = await this.fetchDonationRows();
      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="donations.pdf"');
      doc.pipe(res);

      doc.fontSize(16).text('Donations Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10);
      rows.forEach((r) => {
        doc.text(
          `${r.dateRecorded.toISOString().slice(0, 10)} | ${r.donor} | ${r.cause} | ${r.type} | ${r.status} | ${r.currency} ${r.amount.toFixed(
            2
          )} (Net: ${r.netAmount.toFixed(2)})`
        );
      });

      doc.end();
    } catch (error) {
      console.error('exportPDF failed', error);
      res.status(500).json({ success: false, message: 'Failed to export PDF', error: (error as Error).message });
    }
  }

  private async fetchDonationRows() {
    const donations = await prisma.donation.findMany({
      include: { donor: true, cause: true },
      orderBy: { dateRecorded: 'desc' },
    });
    return donations.map((d) => ({
      id: d.id,
      donor: d.donor ? `${d.donor.firstName} ${d.donor.lastName}` : 'Walk-in',
      cause: d.cause?.name || d.causeId,
      type: d.type,
      status: d.status,
      amount: toNumberSafe(d.amount),
      processorFees: toNumberSafe(d.processorFees),
      netAmount: toNumberSafe(d.netAmount),
      currency: d.currency,
      dateRecorded: d.dateRecorded,
    }));
  }
}
