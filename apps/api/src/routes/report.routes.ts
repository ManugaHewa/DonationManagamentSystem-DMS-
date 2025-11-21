import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateReportSchema } from '../validators/report.validator';

const router = Router();
const reportController = new ReportController();

// All report routes require authentication and admin/accountant role
router.use(authenticate);
router.use(authorize(['ADMIN', 'ACCOUNTANT']));

// Dashboard statistics
router.get('/dashboard', reportController.getDashboardStats);

// Donation reports
router.get('/donations', reportController.getDonationReport);
router.post('/donations/generate', validate(generateReportSchema), reportController.generateDonationReport);

// Donor reports
router.get('/donors', reportController.getDonorReport);
router.get('/donors/summary', reportController.getDonorSummary);

// Financial reports
router.get('/financial/summary', reportController.getFinancialSummary);
router.get('/financial/by-cause', reportController.getFinancialByCause);
router.get('/financial/by-type', reportController.getFinancialByType);

// Tax receipt reports
router.get('/tax-receipts/:fiscalYear', reportController.getTaxReceiptReport);

// Export reports (simple stubs for now)
router.get('/export/csv', reportController.exportCSV);
router.get('/export/excel', reportController.exportExcel);
router.get('/export/pdf', reportController.exportPDF);

export default router;
