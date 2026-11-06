import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { verifyCsrfToken } from '../middleware/csrf.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  updatePreferencesSchema,
} from '../validators/profile.validator.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  updatePreferences,
} from '../controllers/profile.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getProfile);
router.patch('/', verifyCsrfToken, validate(updateProfileSchema), updateProfile);
router.post('/change-password', verifyCsrfToken, validate(changePasswordSchema), changePassword);
router.patch('/preferences', verifyCsrfToken, validate(updatePreferencesSchema), updatePreferences);

export default router;

