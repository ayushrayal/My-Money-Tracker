import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import transactionRoutes from './transaction.routes.js';
import salaryRoutes from './salary.routes.js';
import budgetRoutes from './budget.routes.js';
import loanRoutes from './loan.routes.js';
import savingsRoutes from './savings.routes.js';

const router = Router();

// Mount health endpoint: GET /api/health
router.use('/health', healthRoutes);

// Mount authentication endpoints: /api/auth/*
router.use('/auth', authRoutes);

// Mount categories endpoints: /api/categories/*
router.use('/categories', categoryRoutes);

// Mount transactions endpoints: /api/transactions/*
router.use('/transactions', transactionRoutes);

// Mount Phase 4 endpoints
router.use('/salary', salaryRoutes);
router.use('/budgets', budgetRoutes);
router.use('/loans', loanRoutes);
router.use('/savings', savingsRoutes);

// General API root info: GET /api
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'My Money Tracker API — Phase 4 Salary, Budgets, Loans & Savings',
    endpoints: {
      health: '/api/health',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
      },
      categories: {
        list: 'GET /api/categories',
        create: 'POST /api/categories',
        update: 'PATCH /api/categories/:id',
        delete: 'DELETE /api/categories/:id',
      },
      transactions: {
        list: 'GET /api/transactions',
        summary: 'GET /api/transactions/summary',
        create: 'POST /api/transactions',
        get: 'GET /api/transactions/:id',
        update: 'PATCH /api/transactions/:id',
        delete: 'DELETE /api/transactions/:id',
      },
      salary: {
        get: 'GET /api/salary',
        configure: 'POST /api/salary',
        receive: 'POST /api/salary/receive',
        additionalIncome: 'POST /api/salary/additional-income',
        history: 'GET /api/salary/history',
      },
      budgets: {
        get: 'GET /api/budgets',
        create: 'POST /api/budgets',
        update: 'PATCH /api/budgets/:id',
        copy: 'POST /api/budgets/copy',
        preset: 'POST /api/budgets/preset/owner',
        history: 'GET /api/budgets/history',
      },
      loans: {
        list: 'GET /api/loans',
        create: 'POST /api/loans',
        get: 'GET /api/loans/:id',
        update: 'PATCH /api/loans/:id',
        payments: 'POST /api/loans/:id/payments',
        preset: 'POST /api/loans/preset/owner',
      },
      savings: {
        list: 'GET /api/savings',
        create: 'POST /api/savings',
        get: 'GET /api/savings/:id',
        update: 'PATCH /api/savings/:id',
        contributions: 'POST /api/savings/:id/contributions',
        preset: 'POST /api/savings/preset/owner',
      },
    },
  });
});

export default router;
