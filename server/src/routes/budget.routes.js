import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { verifyCsrfToken } from '../middleware/csrf.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  copyBudgetSchema,
} from '../validators/budget.validator.js';
import {
  getBudget,
  createBudget,
  updateBudget,
  copyBudget,
  applyOwnerPreset,
  listBudgetHistory,
} from '../controllers/budget.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getBudget);
router.get('/history', listBudgetHistory);

router.post('/', verifyCsrfToken, validate(createBudgetSchema), createBudget);
router.patch('/:id', verifyCsrfToken, validate(updateBudgetSchema), updateBudget);
router.post('/copy', verifyCsrfToken, validate(copyBudgetSchema), copyBudget);
router.post('/preset', verifyCsrfToken, applyOwnerPreset);
router.post('/preset/owner', verifyCsrfToken, applyOwnerPreset);

export default router;
