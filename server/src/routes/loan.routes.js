import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { verifyCsrfToken } from '../middleware/csrf.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createLoanSchema,
  updateLoanSchema,
  createLoanPaymentSchema,
  updateLoanPaymentSchema,
} from '../validators/loan.validator.js';
import {
  listLoans,
  getLoan,
  createLoan,
  updateLoan,
  recordLoanPayment,
  updateLoanPayment,
  deleteLoanPayment,
  applyOwnerLoansPreset,
} from '../controllers/loan.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listLoans);
router.post('/preset', verifyCsrfToken, applyOwnerLoansPreset);
router.post('/preset/owner', verifyCsrfToken, applyOwnerLoansPreset);

router.post('/', verifyCsrfToken, validate(createLoanSchema), createLoan);
router.get('/:id', getLoan);
router.patch('/:id', verifyCsrfToken, validate(updateLoanSchema), updateLoan);

router.post('/:id/payments', verifyCsrfToken, validate(createLoanPaymentSchema), recordLoanPayment);
router.patch('/:id/payments/:paymentId', verifyCsrfToken, validate(updateLoanPaymentSchema), updateLoanPayment);
router.delete('/:id/payments/:paymentId', verifyCsrfToken, deleteLoanPayment);

export default router;
