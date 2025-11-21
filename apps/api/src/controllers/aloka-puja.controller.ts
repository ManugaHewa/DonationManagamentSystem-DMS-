import { Request, Response } from 'express';
import { prisma } from '@dms/database';
import { AuthRequest } from '../middleware/auth';

export class AlokaPujaController {
  async getAll(req: Request, res: Response) {
    try {
      const pujas = await prisma.alokaPuja.findMany({
        include: {
          donor: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { pujaDate: 'asc' },
      });
      res.json({ success: true, data: pujas });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch Aloka Pujas' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const puja = await prisma.alokaPuja.findUnique({
        where: { id },
        include: { donor: true },
      });
      if (!puja) {
        return res.status(404).json({ success: false, message: 'Aloka Puja not found' });
      }
      res.json({ success: true, data: puja });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch Aloka Puja' });
    }
  }

  async getMyPujas(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { donor: true },
      });
      if (!user?.donor) {
        return res.status(404).json({ success: false, message: 'Donor profile not found' });
      }
      const pujas = await prisma.alokaPuja.findMany({
        where: { donorId: user.donor.id },
        orderBy: { pujaDate: 'desc' },
      });
      res.json({ success: true, data: pujas });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch your Aloka Pujas' });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body;
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { donor: true },
      });
      if (!user?.donor) {
        return res.status(404).json({ success: false, message: 'Donor profile not found' });
      }
      const puja = await prisma.alokaPuja.create({
        data: { ...data, donorId: user.donor.id },
      });
      res.status(201).json({ success: true, data: puja, message: 'Aloka Puja scheduled' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create Aloka Puja' });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const puja = await prisma.alokaPuja.update({
        where: { id },
        data,
      });
      res.json({ success: true, data: puja, message: 'Aloka Puja updated' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update Aloka Puja' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.alokaPuja.delete({ where: { id } });
      res.json({ success: true, message: 'Aloka Puja deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete Aloka Puja' });
    }
  }

  async getUpcoming(req: Request, res: Response) {
    try {
      const { days } = req.params;
      const daysAhead = parseInt(days) || 7;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      const pujas = await prisma.alokaPuja.findMany({
        where: {
          pujaDate: { gte: new Date(), lte: futureDate },
        },
        include: { donor: true },
        orderBy: { pujaDate: 'asc' },
      });
      res.json({ success: true, data: pujas });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch upcoming Aloka Pujas' });
    }
  }
}
