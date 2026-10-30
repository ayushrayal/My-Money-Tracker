import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { verifyCsrfToken } from '../middleware/csrf.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createSalarySchema,
  receiveSalarySchema,
  addAdditionalIncomeSchema,
} from '../validators/salary.validator.js';
import {
  getSalary,
  configureSalary,
  receiveSalary,
  addAdditionalIncome,
  listSalaryHistory,
} from '../controllers/salary.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getSalary);
router.get('/history', listSalaryHistory);

router.post('/', verifyCsrfToken, validate(createSalarySchema), configureSalary);
router.post('/receive', verifyCsrfToken, validate(receiveSalarySchema), receiveSalary);
router.post('/additional', verifyCsrfToken, validate(addAdditionalIncomeSchema), addAdditionalIncome);
router.post('/additional-income', verifyCsrfToken, validate(addAdditionalIncomeSchema), addAdditionalIncome);

export default router;
