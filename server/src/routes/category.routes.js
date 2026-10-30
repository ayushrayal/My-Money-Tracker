import { Router } from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { verifyCsrf } from '../middleware/csrf.middleware.js';
import { validateRequest } from '../middleware/validate.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/category.validator.js';

const router = Router();

// Protect all category endpoints
router.use(requireAuth);

router.get('/', listCategories);
router.post('/', verifyCsrf, validateRequest(createCategorySchema), createCategory);
router.patch('/:id', verifyCsrf, validateRequest(updateCategorySchema), updateCategory);
router.delete('/:id', verifyCsrf, deleteCategory);

export default router;

