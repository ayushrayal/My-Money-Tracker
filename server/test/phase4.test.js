import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Category } from '../src/models/category.model.js';
import { Transaction } from '../src/models/transaction.model.js';
import { Salary } from '../src/models/salary.model.js';
import { Budget } from '../src/models/budget.model.js';
import { Loan } from '../src/models/loan.model.js';
import { LoanPayment } from '../src/models/loanPayment.model.js';
import { SavingsGoal } from '../src/models/savingsGoal.model.js';
import { SavingsContribution } from '../src/models/savingsContribution.model.js';
import { ensureDefaultCategories } from '../src/services/category.service.js';
import { AUTH_COOKIE_NAME, CSRF_COOKIE_NAME } from '../src/services/token.service.js';

let mongoServer;

describe('Phase 4: Salary, Budgets, Loans & Savings Integration Tests', () => {
  let userACookie = '';
  let userACsrf = '';
  let userACsrfHeader = '';

  let userBCookie = '';
  let userBCsrf = '';
  let userBCsrfHeader = '';

  let foodCategory;
  let homeCategory;
  let familySupportCategory;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    await ensureDefaultCategories();

    foodCategory = await Category.findOne({ name: 'Food & Dining', isDefault: true });
    homeCategory = await Category.findOne({ name: 'Housing & Rent', isDefault: true });
    familySupportCategory = await Category.findOne({ name: 'Family Support', isDefault: true });

    // User A
    const resA = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Alpha Owner',
        email: 'alpha.owner@example.com',
        password: 'Password123!',
      });
    assert.equal(resA.status, 201);
    const cookiesA = resA.headers['set-cookie'] || [];
    userACookie = cookiesA.find((c) => c.includes(`${AUTH_COOKIE_NAME}=`)).split(';')[0];
    userACsrf = cookiesA.find((c) => c.includes(`${CSRF_COOKIE_NAME}=`)).split(';')[0];
    userACsrfHeader = userACsrf.split('=')[1];

    // User B
    const resB = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Beta Other',
        email: 'beta.other@example.com',
        password: 'Password123!',
      });
    assert.equal(resB.status, 201);
    const cookiesB = resB.headers['set-cookie'] || [];
    userBCookie = cookiesB.find((c) => c.includes(`${AUTH_COOKIE_NAME}=`)).split(';')[0];
    userBCsrf = cookiesB.find((c) => c.includes(`${CSRF_COOKIE_NAME}=`)).split(';')[0];
    userBCsrfHeader = userBCsrf.split('=')[1];
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // =========================================================================
  // 1. SALARY & INCOME MANAGEMENT
  // =========================================================================
  describe('Module 1: Salary & Income Management', () => {
    const testMonth = '2026-11';

    it('POST /api/salary configures planned salary without creating a transaction ledger entry', async () => {
      const res = await request(app)
        .post('/api/salary')
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          month: testMonth,
          plannedAmount: 25000,
          expectedDay: 1,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.salary.status, 'planned');
      assert.equal(res.body.data.salary.plannedAmount, 25000);

      // Verify no income transaction exists yet
      const txCount = await Transaction.countDocuments({
        type: 'income',
        description: { $regex: /salary/i },
      });
      assert.equal(txCount, 0);
    });

    it('POST /api/salary/receive marks salary as received and links an income transaction', async () => {
      const res = await request(app)
        .post('/api/salary/receive')
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          month: testMonth,
          receivedAmount: 25000,
          receivedDate: `${testMonth}-01`,
          paymentMethod: 'bank_transfer',
          notes: 'November salary credited',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.salary.status, 'received');
      assert.equal(res.body.data.salary.receivedAmount, 25000);
      assert.ok(res.body.data.salary.linkedTransactionId);

      // Verify transaction was created in ledger
      const tx = await Transaction.findById(res.body.data.salary.linkedTransactionId);
      assert.ok(tx);
      assert.equal(tx.amount, 25000);
      assert.equal(tx.type, 'income');
      assert.equal(tx.paymentMethod, 'bank_transfer');
    });

    it('POST /api/salary/receive idempotently updates the existing transaction instead of duplicating it', async () => {
      const res = await request(app)
        .post('/api/salary/receive')
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          month: testMonth,
          receivedAmount: 26000, // Adjusted with bonus
          receivedDate: `${testMonth}-01`,
          paymentMethod: 'bank_transfer',
          notes: 'Updated salary with Diwali bonus',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.salary.receivedAmount, 26000);

      // Only ONE salary transaction should exist for this user in this month
      const txs = await Transaction.find({
        type: 'income',
        description: { $regex: /salary/i },
      });
      assert.equal(txs.length, 1);
      assert.equal(txs[0].amount, 26000);
    });

    it('POST /api/salary/additional adds extra income source and creates an income transaction', async () => {
      const res = await request(app)
        .post('/api/salary/additional')
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          month: testMonth,
          source: 'Freelance Design',
          amount: 3500,
          date: `${testMonth}-15`,
          paymentMethod: 'upi',
          notes: 'Website logo design payment',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.salary.additionalIncomes.length, 1);
      assert.equal(res.body.data.salary.additionalIncomes[0].amount, 3500);

      const additionalTxId = res.body.data.salary.additionalIncomes[0].linkedTransactionId || res.body.data.salary.additionalIncomes[0].transactionId;
      assert.ok(additionalTxId);

      const tx = await Transaction.findById(additionalTxId);
      assert.ok(tx);
      assert.equal(tx.amount, 3500);
      assert.equal(tx.description, 'Additional Income: Freelance Design');
    });
  });

  // =========================================================================
  // 2. MONTHLY BUDGET MANAGEMENT
  // =========================================================================
  describe('Module 2: Monthly Budget Management', () => {
    const testMonth = '2026-11';

    it('POST /api/budgets/preset applies the owner’s ₹25,000 budget allocations', async () => {
      const res = await request(app)
        .post('/api/budgets/preset')
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({ month: testMonth });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      const { budget } = res.body.data;
      assert.equal(budget.month, testMonth);
      assert.equal(budget.expectedIncome, 25000);
      assert.equal(budget.savingsTarget, 4000);
      assert.equal(budget.bufferAllocation, 2000);

      // Verify category allocations sum to ₹19,000 (total allocations = 19,000 + 4,000 savings + 2,000 buffer = 25,000)
      const allocatedSum = budget.categoryAllocations.reduce((s, c) => s + c.allocatedAmount, 0);
      assert.equal(allocatedSum, 19000);
    });

    it('GET /api/budgets correctly calculates actual spending and threshold warnings (80% & 100%)', async () => {
      // Find food category allocation in budget
      const budgetRes = await request(app)
        .get(`/api/budgets?month=${testMonth}`)
        .set('Cookie', [`${userACookie}; ${userACsrf}`]);

      assert.equal(budgetRes.status, 200);
      const foodAlloc = budgetRes.body.data.budget.categoryAllocations.find(
        (c) => c.categoryName.toLowerCase().includes('food')
      );
      assert.ok(foodAlloc, 'Food allocation must exist in budget');
      assert.equal(foodAlloc.allocatedAmount, 2000);

      // Create an expense of ₹1,700 (85% of ₹2,000) -> should trigger warning threshold (>=80%)
      const exp1 = await request(app)
        .post('/api/transactions')
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          type: 'expense',
          amount: 1700,
          category: foodAlloc.categoryId,
          description: 'Grocery shopping',
          date: `${testMonth}-05`,
          paymentMethod: 'upi',
        });
      assert.equal(exp1.status, 201);

      // Fetch budget again to check thresholds
      const check1 = await request(app)
        .get(`/api/budgets?month=${testMonth}`)
        .set('Cookie', [`${userACookie}; ${userACsrf}`]);

      const updatedFood1 = check1.body.data.budget.categoryAllocations.find(
        (c) => c.categoryName.toLowerCase().includes('food')
      );
      assert.equal(updatedFood1.actualSpent, 1700);
      assert.equal(updatedFood1.remainingAmount, 300);
      assert.equal(updatedFood1.thresholdStatus, 'warning'); // >= 80%

      // Create another expense of ₹400 -> total ₹2,100 (> 100%) -> should trigger exceeded threshold
      const exp2 = await request(app)
        .post('/api/transactions')
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          type: 'expense',
          amount: 400,
          category: foodAlloc.categoryId,
          description: 'Dinner delivery',
          date: `${testMonth}-08`,
          paymentMethod: 'cash',
        });
      assert.equal(exp2.status, 201);

      const check2 = await request(app)
        .get(`/api/budgets?month=${testMonth}`)
        .set('Cookie', [`${userACookie}; ${userACsrf}`]);

      const updatedFood2 = check2.body.data.budget.categoryAllocations.find(
        (c) => c.categoryName.toLowerCase().includes('food')
      );
      assert.equal(updatedFood2.actualSpent, 2100);
      assert.equal(updatedFood2.remainingAmount, -100);
      assert.equal(updatedFood2.thresholdStatus, 'exceeded'); // > 100%
    });

    it('POST /api/budgets/copy replicates previous month’s configuration to a new month', async () => {
      const nextMonth = '2026-12';
      const res = await request(app)
        .post('/api/budgets/copy')
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          sourceMonth: testMonth,
          targetMonth: nextMonth,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.budget.month, nextMonth);
      assert.equal(res.body.data.budget.expectedIncome, 25000);
      assert.equal(res.body.data.budget.savingsTarget, 4000);
      assert.equal(res.body.data.budget.categoryAllocations.length, 7);
    });
  });

  // =========================================================================
  // 3. INFORMAL LOAN MANAGEMENT
  // =========================================================================
  describe('Module 3: Informal Loan Management', () => {
    let loanAId;
    let smallLoan1Id;

    it('POST /api/loans/preset seeds the owner’s 5 active loans correctly', async () => {
      const res = await request(app)
        .post('/api/loans/preset')
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.loans.length, 5);

      const loanA = res.body.data.loans.find((l) => l.lenderName === 'Loan A');
      assert.ok(loanA);
      assert.equal(loanA.originalPrincipal, 8000);
      assert.equal(loanA.outstandingBalance, 8000);
      assert.equal(loanA.plannedMonthlyPayment, 1000);
      loanAId = loanA.id || loanA._id;

      const sm1 = res.body.data.loans.find((l) => l.lenderName === 'Small Loan 1');
      assert.ok(sm1);
      assert.equal(sm1.originalPrincipal, 2000);
      smallLoan1Id = sm1.id || sm1._id;
    });

    it('POST /api/loans/:id/payments records payment, updates balance atomically, and links an expense transaction', async () => {
      const res = await request(app)
        .post(`/api/loans/${loanAId}/payments`)
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          amount: 1000,
          paymentDate: '2026-11-05',
          paymentMethod: 'bank_transfer',
          notes: 'November scheduled payment',
          createTransaction: true,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.loan.outstandingBalance, 7000);
      assert.equal(res.body.data.loan.payments.length, 1);

      // Verify ledger transaction was created
      const linkedTxId = res.body.data.payment.linkedTransactionId || res.body.data.payment.transactionId;
      assert.ok(linkedTxId);
      const tx = await Transaction.findById(linkedTxId);
      assert.ok(tx);
      assert.equal(tx.amount, 1000);
      assert.equal(tx.type, 'expense');
    });

    it('POST /api/loans/:id/payments rejects payment exceeding outstanding balance', async () => {
      const res = await request(app)
        .post(`/api/loans/${loanAId}/payments`)
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          amount: 10000, // Balance is 7000
          paymentDate: '2026-11-06',
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'OVERPAYMENT_NOT_ALLOWED');
    });

    it('DELETE /api/loans/:id/payments/:paymentId correctly reverses payment and restores balance', async () => {
      // Get payment ID
      const loanRes = await request(app)
        .get(`/api/loans/${loanAId}`)
        .set('Cookie', [`${userACookie}; ${userACsrf}`]);

      const payment = loanRes.body.data.loan.payments[0];
      assert.ok(payment);
      const paymentId = payment.id || payment._id;

      const delRes = await request(app)
        .delete(`/api/loans/${loanAId}/payments/${paymentId}`)
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader);

      assert.equal(delRes.status, 200);
      assert.equal(delRes.body.data.loan.outstandingBalance, 8000);
      assert.equal(delRes.body.data.loan.payments.length, 0);

      // Verify linked transaction was deleted
      const txId = typeof payment.transactionId === 'object' && payment.transactionId !== null
        ? (payment.transactionId.id || payment.transactionId._id)
        : (payment.linkedTransactionId || payment.transactionId);
      const tx = await Transaction.findById(txId);
      assert.equal(tx, null);
    });

    it('POST /api/loans/:id/payments automatically marks loan status as "paid" when balance reaches 0', async () => {
      const res = await request(app)
        .post(`/api/loans/${smallLoan1Id}/payments`)
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          amount: 2000,
          paymentDate: '2026-11-10',
          notes: 'Full payoff of small loan 1',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.loan.outstandingBalance, 0);
      assert.equal(res.body.data.loan.status, 'paid');
    });

    it('User B cannot access or record payments on User A’s loan', async () => {
      const getRes = await request(app)
        .get(`/api/loans/${loanAId}`)
        .set('Cookie', [`${userBCookie}; ${userBCsrf}`]);
      assert.equal(getRes.status, 404);

      const payRes = await request(app)
        .post(`/api/loans/${loanAId}/payments`)
        .set('Cookie', [`${userBCookie}; ${userBCsrf}`])
        .set('X-CSRF-Token', userBCsrfHeader)
        .send({ amount: 500, paymentDate: '2026-11-10' });
      assert.equal(payRes.status, 404);
    });
  });

  // =========================================================================
  // 4. SAVINGS GOALS & CONTRIBUTIONS
  // =========================================================================
  describe('Module 4: Savings Goals & Contributions', () => {
    let emergencyGoalId;
    let contribId;

    it('POST /api/savings/preset creates the owner emergency fund goal with milestones', async () => {
      const res = await request(app)
        .post('/api/savings/preset')
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      const goal = res.body.data.goal;
      assert.equal(goal.name, 'Emergency Fund');
      assert.equal(goal.targetAmount, 30000);
      assert.equal(goal.monthlyTarget, 4000);
      assert.equal(goal.currentAmount, 0);
      assert.equal(goal.milestones.length, 3);
      assert.equal(goal.milestones[0].targetAmount, 10000);
      assert.equal(goal.milestones[0].achieved, false);

      emergencyGoalId = goal.id || goal._id;
    });

    it('POST /api/savings/:id/contributions updates current amount and evaluates milestone completion', async () => {
      // First contribution: ₹4,000 -> milestone ₹10,000 not met yet
      const res1 = await request(app)
        .post(`/api/savings/${emergencyGoalId}/contributions`)
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          amount: 4000,
          contributionDate: '2026-11-01',
          paymentMethod: 'bank_transfer',
          notes: 'November planned savings',
          recordAsTransfer: true,
        });

      assert.equal(res1.status, 201);
      assert.equal(res1.body.data.goal.currentAmount, 4000);
      assert.equal(res1.body.data.goal.milestones[0].achieved, false);

      // Verify transfer transaction was created (does not affect income or expense)
      const tx = await Transaction.findById(res1.body.data.contribution.linkedTransactionId || res1.body.data.contribution.transactionId);
      assert.ok(tx);
      assert.equal(tx.type, 'transfer');
      assert.equal(tx.amount, 4000);

      // Second contribution: ₹6,500 -> total ₹10,500 -> milestone ₹10,000 ACHIEVED!
      const res2 = await request(app)
        .post(`/api/savings/${emergencyGoalId}/contributions`)
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader)
        .send({
          amount: 6500,
          contributionDate: '2026-11-15',
          paymentMethod: 'upi',
          notes: 'Diwali bonus allocation',
        });

      assert.equal(res2.status, 201);
      assert.equal(res2.body.data.goal.currentAmount, 10500);

      const milestone10k = res2.body.data.goal.milestones.find((m) => m.targetAmount === 10000);
      assert.ok(milestone10k);
      assert.equal(milestone10k.achieved, true);
      assert.ok(milestone10k.achievedDate);

      contribId = res2.body.data.contribution.id || res2.body.data.contribution._id;
    });

    it('DELETE /api/savings/:id/contributions/:contribId recalculates balance and unchecks milestone if below threshold', async () => {
      const res = await request(app)
        .delete(`/api/savings/${emergencyGoalId}/contributions/${contribId}`)
        .set('Cookie', [`${userACookie}; ${userACsrf}`])
        .set('X-CSRF-Token', userACsrfHeader);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.goal.currentAmount, 4000);

      const milestone10k = res.body.data.goal.milestones.find((m) => m.targetAmount === 10000);
      assert.ok(milestone10k);
      assert.equal(milestone10k.achieved, false);
    });

    it('User B cannot view or contribute to User A’s savings goal', async () => {
      const getRes = await request(app)
        .get(`/api/savings/${emergencyGoalId}`)
        .set('Cookie', [`${userBCookie}; ${userBCsrf}`]);
      assert.equal(getRes.status, 404);

      const contribRes = await request(app)
        .post(`/api/savings/${emergencyGoalId}/contributions`)
        .set('Cookie', [`${userBCookie}; ${userBCsrf}`])
        .set('X-CSRF-Token', userBCsrfHeader)
        .send({ amount: 1000, contributionDate: '2026-11-20' });
      assert.equal(contribRes.status, 404);
    });
  });

  // =========================================================================
  // 5. DASHBOARD RECONCILIATION SUMMARY
  // =========================================================================
  describe('Module 5: Dashboard Reconciliation Summary', () => {
    it('GET /api/transactions/summary contains reconciled salary, budget, loans, and savings summaries', async () => {
      const res = await request(app)
        .get('/api/transactions/summary?month=2026-11')
        .set('Cookie', [`${userACookie}; ${userACsrf}`]);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      const { data } = res.body;
      assert.ok(data.totals);
      assert.ok(data.categoryBreakdown);

      // Verify Salary Summary
      assert.ok(data.salary, 'Salary block must be present');
      assert.equal(data.salary.status, 'received');
      assert.equal(data.salary.receivedAmount, 26000);
      assert.equal(data.salary.additionalIncomesTotal, 3500);

      // Verify Budget Summary
      assert.ok(data.budget, 'Budget block must be present');
      assert.equal(data.budget.expectedIncome, 25000);
      assert.equal(data.budget.savingsTarget, 4000);
      assert.equal(data.budget.bufferAllocation, 2000);

      // Verify Loans Summary
      assert.ok(data.loans, 'Loans block must be present');
      assert.ok(data.loans.totalOutstanding > 0);
      assert.ok(data.loans.activeLoansCount >= 4);

      // Verify Savings Summary
      assert.ok(data.savings, 'Savings block must be present');
      assert.equal(data.savings.totalCurrent, 4000);
      assert.ok(data.savings.emergencyFund);
      assert.equal(data.savings.emergencyFund.targetAmount, 30000);
    });
  });
});
