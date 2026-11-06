import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { verifyCsrfToken } from '../middleware/csrf.middleware.js';
import {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
} from '../controllers/notification.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.patch('/:id/read', verifyCsrfToken, markAsRead);
router.post('/read-all', verifyCsrfToken, markAllRead);
router.delete('/:id', verifyCsrfToken, deleteNotification);

export default router;

