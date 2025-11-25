import { Request, Response } from 'express';
import { prisma, Prisma, DonationStatus } from '@dms/database';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import { sendEmail } from '../utils/email';
import { getPreferredContact } from '../utils/contact';

export class DonationController {
  private async resolveCause(causeId: string, otherCause?: string) {
    let cause = await prisma.donationCause.findUnique({ where: { id: causeId } });

    if (!cause) {
      const causeName = otherCause || causeId;
      cause = await prisma.donationCause.findFirst({
        where: { name: { equals: causeName, mode: 'insensitive' } },
      });

      if (!cause) {
        cause = await prisma.donationCause.create({
          data: {
            name: causeName,
            description: otherCause || undefined,
          },
        });
      }
    }

    return cause;
  }

  private calculateNetAmount(amount: number, processorFees?: number) {
    const amountDecimal = new Prisma.Decimal(amount);
    const feesDecimal = processorFees ? new Prisma.Decimal(processorFees) : new Prisma.Decimal(0);
    return amountDecimal.minus(feesDecimal);
  }

  async createPublic(req: Request, res: Response) {
    try {
      const { causeId, type, amount, currency = 'CAD', processorFees, donorRemarks, templeRemarks, isAnonymous, otherCause } = req.body;

      const cause = await this.resolveCause(causeId, otherCause);

      const donation = await prisma.donation.create({
        data: {
          causeId: cause.id,
          type,
          amount: new Prisma.Decimal(amount),
          currency,
          processorFees: processorFees !== undefined ? new Prisma.Decimal(processorFees) : undefined,
          netAmount: this.calculateNetAmount(amount, processorFees),
          donorRemarks,
          templeRemarks,
          isAnonymous: !!isAnonymous,
        },
      });

      // Acknowledgment email (uses donorRemarks contact if provided)
      const contact = getPreferredContact(
        null,
        {
          email: req.body.email,
          mobile: req.body.mobile,
          landline: req.body.landline,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
        } as any
      );
      if (contact.type === 'email') {
        await sendEmail({
          to: contact.value,
          subject: 'Thank you for your donation',
          html: `<p>Thank you for your donation of ${currency} ${parseFloat(amount).toFixed(
            2
          )} toward ${cause.name}. We have recorded your contribution and it is pending validation.</p>`,
        });
      }

      res.status(201).json({ success: true, data: donation, message: 'Donation created' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create donation' });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const donations = await prisma.donation.findMany({
        include: { donor: true, cause: true },
        orderBy: { dateRecorded: 'desc' },
      });
      res.json({ success: true, data: donations });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch donations' });
    }
  }

  async getMyDonations(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { donor: true },
      });

      if (!user?.donor) {
        return res.status(404).json({ success: false, message: 'Donor profile not found' });
      }

      const donations = await prisma.donation.findMany({
        where: { donorId: user.donor.id },
        include: { cause: true },
        orderBy: { dateRecorded: 'desc' },
      });

      res.json({ success: true, data: donations });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch donations' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const donation = await prisma.donation.findUnique({
        where: { id },
        include: { donor: true, cause: true },
      });

      if (!donation) {
        return res.status(404).json({ success: false, message: 'Donation not found' });
      }

      res.json({ success: true, data: donation });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch donation' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { causeId, type, amount, currency = 'CAD', processorFees, donorRemarks, templeRemarks, isAnonymous, otherCause } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { donor: true },
      });

      if (!user?.donor) {
        return res.status(404).json({ success: false, message: 'Donor profile not found' });
      }

      const cause = await this.resolveCause(causeId, otherCause);

      const donation = await prisma.donation.create({
        data: {
          donorId: user.donor.id,
          causeId: cause.id,
          type,
          status: DonationStatus.PENDING_VALIDATION,
          amount: new Prisma.Decimal(amount),
          currency,
          processorFees: processorFees !== undefined ? new Prisma.Decimal(processorFees) : undefined,
          netAmount: this.calculateNetAmount(amount, processorFees),
          donorRemarks,
          templeRemarks,
          isAnonymous: !!isAnonymous,
        },
      });

      const contact = getPreferredContact(user, user?.donor);
      if (contact.type === 'email') {
        await sendEmail({
          to: contact.value,
          subject: 'Donation received',
          html: `<p>Hi ${user?.donor?.firstName || 'Donor'},</p>
                 <p>Thank you for your donation of ${currency} ${parseFloat(amount).toFixed(
                   2
                 )} toward ${cause.name}. Your donation is pending validation. We will notify you once validated.</p>`,
        });
      }

      res.status(201).json({ success: true, data: donation, message: 'Donation created' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create donation' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const data = req.body;
      const donation = await prisma.donation.update({ where: { id }, data });
      res.json({ success: true, data: donation, message: 'Donation updated' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update donation' });
    }
  }

  async validate(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const { approved, remarks } = req.body;
      const status = approved ? DonationStatus.VALIDATED : DonationStatus.CANCELLED;

      const fileUrl = req.file
        ? `/uploads/receipts/${path.basename(req.file.path)}`
        : undefined;

      const mergedRemarks = [remarks, fileUrl ? `Proof: ${fileUrl}` : null]
        .filter(Boolean)
        .join('\n');

      const donation = await prisma.donation.update({
        where: { id },
        data: { status, templeRemarks: mergedRemarks || undefined },
      });

      res.json({
        success: true,
        data: { ...donation, proofFileUrl: fileUrl },
        message: `Donation ${approved ? 'validated' : 'rejected'}`,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to validate donation' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;
      await prisma.donation.delete({ where: { id } });
      res.json({ success: true, message: 'Donation deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete donation' });
    }
  }
}
