import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

// Mount health endpoint: GET /api/health
router.use('/health', healthRoutes);

// Mount authentication endpoints: /api/auth/*
router.use('/auth', authRoutes);

// General API root info: GET /api
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'My Money Tracker API — Phase 2 Authentication & MongoDB Foundation',
    endpoints: {
      health: '/api/health',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
      },
    },
  });
});

export default router;
