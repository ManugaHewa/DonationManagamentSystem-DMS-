import { Router } from 'express';
import { ReceiptController } from '../controllers/receipt.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateReceiptSchema, bulkReceiptSchema } from '../validators/receipt.validator';

const router = Router();
const receiptController = new ReceiptController();

// All receipt routes require authentication
router.use(authenticate);

// Donor routes - view own receipts
router.get('/my-receipts', receiptController.getMyReceipts);
router.get('/:id/download', receiptController.downloadReceipt);
router.post('/self/year/:year', receiptController.generateSelfYearEnd);

// Admin/Accountant routes
router.get('/', authorize(['ADMIN', 'ACCOUNTANT', 'VOLUNTEER']), receiptController.getAll);
router.get('/:id', receiptController.getById);
router.post(
  '/generate',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(generateReceiptSchema),
  receiptController.generate
);
router.post(
  '/bulk',
  authorize(['ADMIN', 'ACCOUNTANT']),
  validate(bulkReceiptSchema),
  receiptController.bulkGenerate
);
router.post(
  '/year-end/:fiscalYear',
  authorize(['ADMIN', 'ACCOUNTANT']),
  receiptController.generateYearEnd
);
router.post(
  '/year-end/:fiscalYear/unlock',
  authorize(['ADMIN', 'ACCOUNTANT']),
  receiptController.unlockYearEnd
);
router.post(
  '/year-end/:fiscalYear/lock',
  authorize(['ADMIN', 'ACCOUNTANT']),
  receiptController.lockYearEnd
);

export default router;
