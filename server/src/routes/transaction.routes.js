import { Router } from 'express';
import {
  createTransaction,
  listTransactions,
  getTransactionSummary,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transaction.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { verifyCsrf } from '../middleware/csrf.middleware.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '../validators/transaction.validator.js';

const router = Router();

// Protect all transaction endpoints
router.use(requireAuth);

router.get('/summary', getTransactionSummary);
router.get('/', listTransactions);
router.post('/', verifyCsrf, validateRequest(createTransactionSchema), createTransaction);
router.get('/:id', getTransactionById);
router.patch('/:id', verifyCsrf, validateRequest(updateTransactionSchema), updateTransaction);
router.delete('/:id', verifyCsrf, deleteTransaction);

export default router;

