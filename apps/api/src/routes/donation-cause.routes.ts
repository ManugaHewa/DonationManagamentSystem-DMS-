import { Router } from 'express';
import { prisma } from '@dms/database';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const causes = await prisma.donationCause.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: causes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch donation causes' });
  }
});

export default router;
