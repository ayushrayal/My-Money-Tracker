import { Router } from 'express';
import { signup, login, logout, getCurrentUser } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../validators/auth.validator.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { verifyCsrf } from '../middleware/csrf.middleware.js';

const router = Router();

// Public Authentication endpoints with strict rate limiting
router.post('/signup', authRateLimiter, validateRequest(signupSchema), signup);
router.post('/login', authRateLimiter, validateRequest(loginSchema), login);

// Authenticated session endpoints
router.post('/logout', verifyCsrf, requireAuth, logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;

