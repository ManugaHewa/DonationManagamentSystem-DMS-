import { Request, Response } from 'express';
import { prisma } from '@dms/database';
import { AuthRequest } from '../middleware/auth';

export class DonorController {
  async getAll(req: Request, res: Response) {
    try {
      const donors = await prisma.donor.findMany({
        include: { user: { select: { email: true, isActive: true } } },
      });
      res.json({ success: true, data: donors });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch donors' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const donor = await prisma.donor.findUnique({
        where: { id },
        include: { user: true, familyMembers: true },
      });
      if (!donor) {
        return res.status(404).json({ success: false, message: 'Donor not found' });
      }
      res.json({ success: true, data: donor });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch donor' });
    }
  }

  async getMyProfile(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { donor: { include: { familyMembers: true } } },
      });
      if (!user?.donor) {
        return res.status(404).json({ success: false, message: 'Donor profile not found' });
      }
      res.json({ success: true, data: user.donor });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const donor = await prisma.donor.create({ data });
      res.status(201).json({ success: true, data: donor, message: 'Donor created' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create donor' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const donor = await prisma.donor.update({ where: { id }, data });
      res.json({ success: true, data: donor, message: 'Donor updated' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update donor' });
    }
  }

  async updateMyProfile(req: AuthRequest, res: Response) {
    try {
      const data = req.body;
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { donor: true },
      });
      if (!user?.donor) {
        return res.status(404).json({ success: false, message: 'Donor profile not found' });
      }
      const donor = await prisma.donor.update({
        where: { id: user.donor.id },
        data,
      });
      res.json({ success: true, data: donor, message: 'Profile updated' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.donor.delete({ where: { id } });
      res.json({ success: true, message: 'Donor deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete donor' });
    }
  }

  async getFamilyMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const members = await prisma.donor.findMany({
        where: { primaryDonorId: id },
      });
      res.json({ success: true, data: members });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch family members' });
    }
  }

  async addFamilyMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const member = await prisma.donor.create({
        data: { ...data, primaryDonorId: id },
      });
      res.status(201).json({ success: true, data: member, message: 'Family member added' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to add family member' });
    }
  }

  async updateFamilyMember(req: Request, res: Response) {
    try {
      const { memberId } = req.params;
      const data = req.body;
      const member = await prisma.donor.update({
        where: { id: memberId },
        data,
      });
      res.json({ success: true, data: member, message: 'Family member updated' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update family member' });
    }
  }

  async deleteFamilyMember(req: Request, res: Response) {
    try {
      const { memberId } = req.params;
      await prisma.donor.delete({ where: { id: memberId } });
      res.json({ success: true, message: 'Family member deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete family member' });
    }
  }
}
