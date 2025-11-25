import { Router } from 'express';
import { DonationController } from '../controllers/donation.controller';
import { authenticate, authorize, requireApprovedUser } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createDonationSchema, validateDonationSchema } from '../validators/donation.validator';
import { receiptUpload } from '../middleware/upload';

const router = Router();
const donationController = new DonationController();

// Public donation form (for walk-in donations)
router.post('/public', validate(createDonationSchema), (req, res) => donationController.createPublic(req, res));

// Protected routes
router.use(authenticate);
router.use(requireApprovedUser);

router.get('/', (req, res) => donationController.getAll(req, res));
router.get('/my-donations', (req, res) => donationController.getMyDonations(req, res));
router.get('/:id', (req, res) => donationController.getById(req, res));
router.post('/', validate(createDonationSchema), (req, res) => donationController.create(req, res));
router.patch('/:id', (req, res) => donationController.update(req, res));

// Admin/Accountant only
router.patch(
  '/:id/validate',
  authorize(['ADMIN', 'ACCOUNTANT']),
  receiptUpload.single('attachment'),
  validate(validateDonationSchema),
  (req, res) => donationController.validate(req, res)
);
router.delete('/:id', authorize(['ADMIN']), (req, res) => donationController.delete(req, res));

export default router;
