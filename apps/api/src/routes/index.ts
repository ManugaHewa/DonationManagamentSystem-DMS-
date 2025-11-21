import { Router } from 'express';
import authRoutes from './auth.routes';
import donorRoutes from './donor.routes';
import donationRoutes from './donation.routes';
import receiptRoutes from './receipt.routes';
import reportRoutes from './report.routes';
import alokaPujaRoutes from './aloka-puja.routes';
import donationCauseRoutes from './donation-cause.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/donors', donorRoutes);
router.use('/donations', donationRoutes);
router.use('/donation-causes', donationCauseRoutes);
router.use('/receipts', receiptRoutes);
router.use('/reports', reportRoutes);
router.use('/aloka-puja', alokaPujaRoutes);

export default router;
