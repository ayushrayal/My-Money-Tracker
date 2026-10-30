import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { verifyCsrfToken } from '../middleware/csrf.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  createSavingsContributionSchema,
} from '../validators/savings.validator.js';
import {
  listSavingsGoals,
  getSavingsGoal,
  createSavingsGoal,
  updateSavingsGoal,
  recordSavingsContribution,
  deleteSavingsContribution,
  applyOwnerSavingsPreset,
} from '../controllers/savings.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listSavingsGoals);
router.post('/preset', verifyCsrfToken, applyOwnerSavingsPreset);
router.post('/preset/owner', verifyCsrfToken, applyOwnerSavingsPreset);

router.post('/', verifyCsrfToken, validate(createSavingsGoalSchema), createSavingsGoal);
router.get('/:id', getSavingsGoal);
router.patch('/:id', verifyCsrfToken, validate(updateSavingsGoalSchema), updateSavingsGoal);

router.post('/:id/contributions', verifyCsrfToken, validate(createSavingsContributionSchema), recordSavingsContribution);
router.delete('/:id/contributions/:contribId', verifyCsrfToken, deleteSavingsContribution);

export default router;
