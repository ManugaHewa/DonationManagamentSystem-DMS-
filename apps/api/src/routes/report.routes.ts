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
router.get('/dashboard', (req, res) => reportController.getDashboardStats(req, res));

// Donation reports
router.get('/donations', (req, res) => reportController.getDonationReport(req, res));
router.post('/donations/generate', validate(generateReportSchema), (req, res) =>
  reportController.generateDonationReport(req, res)
);

// Donor reports
router.get('/donors', (req, res) => reportController.getDonorReport(req, res));
router.get('/donors/summary', (req, res) => reportController.getDonorSummary(req, res));

// Financial reports
router.get('/financial/summary', (req, res) => reportController.getFinancialSummary(req, res));
router.get('/financial/by-cause', (req, res) => reportController.getFinancialByCause(req, res));
router.get('/financial/by-type', (req, res) => reportController.getFinancialByType(req, res));

// Tax receipt reports
router.get('/tax-receipts/:fiscalYear', (req, res) => reportController.getTaxReceiptReport(req, res));

// Export reports (simple stubs for now)
router.get('/export/csv', (req, res) => reportController.exportCSV(req, res));
router.get('/export/excel', (req, res) => reportController.exportExcel(req, res));
router.get('/export/pdf', (req, res) => reportController.exportPDF(req, res));

export default router;
