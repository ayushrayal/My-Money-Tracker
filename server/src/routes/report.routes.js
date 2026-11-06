import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getReportSummary,
  exportTransactionsCsv,
  exportMonthlySummaryCsv,
  exportLoansCsv,
  exportSavingsCsv,
} from '../controllers/report.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', getReportSummary);
router.get('/export/transactions', exportTransactionsCsv);
router.get('/export/monthly-summary', exportMonthlySummaryCsv);
router.get('/export/loans', exportLoansCsv);
router.get('/export/savings', exportSavingsCsv);

export default router;

