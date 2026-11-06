import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getAnalyticsOverview } from '../controllers/analytics.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/overview', getAnalyticsOverview);

export default router;

