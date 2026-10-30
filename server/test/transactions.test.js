import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Category } from '../src/models/category.model.js';
import { Transaction } from '../src/models/transaction.model.js';
import { ensureDefaultCategories } from '../src/services/category.service.js';
import { AUTH_COOKIE_NAME, CSRF_COOKIE_NAME } from '../src/services/token.service.js';

let mongoServer;

describe('Transactions & Categories Integration Tests', () => {
  let userACookie = '';
  let userACsrf = '';
  let userACsrfHeader = '';

  let userBCookie = '';
  let userBCsrf = '';
  let userBCsrfHeader = '';

  let defaultCategoryId = '';
  let userACustomCategoryId = '';
  let testTransactionId = '';

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Seed default categories
    await ensureDefaultCategories();

    // Signup User A
    const resA = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'User Alpha',
        email: 'alpha@example.com',
        password: 'Password123!',
      });
    assert.equal(resA.status, 201);
    const cookiesA = resA.headers['set-cookie'] || [];
    userACookie = cookiesA.find((c) => c.includes(`${AUTH_COOKIE_NAME}=`)).split(';')[0];
    userACsrf = cookiesA.find((c) => c.includes(`${CSRF_COOKIE_NAME}=`)).split(';')[0];
    userACsrfHeader = userACsrf.split('=')[1];

    // Signup User B
    const resB = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'User Beta',
        email: 'beta@example.com',
        password: 'Password123!',
      });
    assert.equal(resB.status, 201);
    const cookiesB = resB.headers['set-cookie'] || [];
    userBCookie = cookiesB.find((c) => c.includes(`${AUTH_COOKIE_NAME}=`)).split(';')[0];
    userBCsrf = cookiesB.find((c) => c.includes(`${CSRF_COOKIE_NAME}=`)).split(';')[0];
    userBCsrfHeader = userBCsrf.split('=')[1];

    // Find a system default category (e.g. Salary or Food)
    const foodCat = await Category.findOne({ name: 'Food', type: 'expense' });
    assert.ok(foodCat);
    defaultCategoryId = foodCat._id.toString();
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // -------------------------------------------------------------
  // CATEGORIES TESTS
  // -------------------------------------------------------------

  it('GET /api/categories lists default categories for authenticated user', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Cookie', [`${userACookie}; ${userACsrf}`]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.categories.length >= 13); // Default categories exist
  });

  it('POST /api/categories allows user to create a custom category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader)
      .send({
        name: 'Gaming & Subscriptions',
        type: 'expense',
        icon: 'gamepad',
        color: '#8b5cf6',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.category.name, 'Gaming & Subscriptions');
    userACustomCategoryId = res.body.data.category.id;
  });

  it('POST /api/categories prevents duplicate category for the same user and type', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader)
      .send({
        name: 'Gaming & Subscriptions',
        type: 'expense',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'DUPLICATE_CATEGORY');
  });

  it('PATCH /api/categories/:id prevents modifying system default categories', async () => {
    const res = await request(app)
      .patch(`/api/categories/${defaultCategoryId}`)
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader)
      .send({ name: 'Hacked Food' });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('PATCH /api/categories/:id prevents User B from modifying User A custom category', async () => {
    const res = await request(app)
      .patch(`/api/categories/${userACustomCategoryId}`)
      .set('Cookie', [`${userBCookie}; ${userBCsrf}`])
      .set('X-CSRF-Token', userBCsrfHeader)
      .send({ name: 'Tampered Name' });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  // -------------------------------------------------------------
  // TRANSACTIONS CRUD & VALIDATION
  // -------------------------------------------------------------

  it('POST /api/transactions creates valid income transaction', async () => {
    const salaryCat = await Category.findOne({ name: 'Salary', type: 'income' });

    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader)
      .send({
        type: 'income',
        amount: 75000,
        category: salaryCat._id.toString(),
        description: 'October Salary Direct Deposit',
        date: '2026-10-01T09:00:00.000Z',
        paymentMethod: 'bank_transfer',
        notes: 'Tech Corp salary',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.transaction.amount, 75000);
    assert.equal(res.body.data.transaction.type, 'income');
  });

  it('POST /api/transactions creates valid expense transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader)
      .send({
        type: 'expense',
        amount: 2450.5,
        category: defaultCategoryId,
        description: 'Supermarket Grocery Run',
        date: '2026-10-05T14:30:00.000Z',
        paymentMethod: 'upi',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.transaction.amount, 2450.5);
    testTransactionId = res.body.data.transaction.id;
  });

  it('POST /api/transactions creates valid transfer transaction (no category required)', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader)
      .send({
        type: 'transfer',
        amount: 10000,
        description: 'Transfer to Savings Pot',
        date: '2026-10-10T12:00:00.000Z',
        paymentMethod: 'bank_transfer',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.transaction.type, 'transfer');
  });

  it('POST /api/transactions rejects zero, negative, or invalid amounts', async () => {
    const resZero = await request(app)
      .post('/api/transactions')
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader)
      .send({
        type: 'expense',
        amount: 0,
        category: defaultCategoryId,
        description: 'Zero test',
        date: '2026-10-10',
        paymentMethod: 'cash',
      });
    assert.equal(resZero.status, 400);

    const resNeg = await request(app)
      .post('/api/transactions')
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader)
      .send({
        type: 'expense',
        amount: -500,
        category: defaultCategoryId,
        description: 'Neg test',
        date: '2026-10-10',
        paymentMethod: 'cash',
      });
    assert.equal(resNeg.status, 400);
  });

  it('POST /api/transactions rejects expense without category', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader)
      .send({
        type: 'expense',
        amount: 100,
        description: 'No category',
        date: '2026-10-10',
        paymentMethod: 'cash',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  // -------------------------------------------------------------
  // CROSS-USER SECURITY
  // -------------------------------------------------------------

  it('GET /api/transactions/:id rejects User B attempting to view User A transaction', async () => {
    const res = await request(app)
      .get(`/api/transactions/${testTransactionId}`)
      .set('Cookie', [`${userBCookie}; ${userBCsrf}`]);

    assert.equal(res.status, 404); // Returns 404 to avoid leaking existence
  });

  it('PATCH /api/transactions/:id rejects User B attempting to update User A transaction', async () => {
    const res = await request(app)
      .patch(`/api/transactions/${testTransactionId}`)
      .set('Cookie', [`${userBCookie}; ${userBCsrf}`])
      .set('X-CSRF-Token', userBCsrfHeader)
      .send({ amount: 999999 });

    assert.equal(res.status, 404);
  });

  it('DELETE /api/transactions/:id rejects User B attempting to delete User A transaction', async () => {
    const res = await request(app)
      .delete(`/api/transactions/${testTransactionId}`)
      .set('Cookie', [`${userBCookie}; ${userBCsrf}`])
      .set('X-CSRF-Token', userBCsrfHeader);

    assert.equal(res.status, 404);
  });

  // -------------------------------------------------------------
  // SUMMARY & TRANSFER EXCLUSION
  // -------------------------------------------------------------

  it('GET /api/transactions/summary correctly calculates totals and excludes transfers', async () => {
    const res = await request(app)
      .get('/api/transactions/summary?month=2026-10')
      .set('Cookie', [`${userACookie}; ${userACsrf}`]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const { totals } = res.body.data;
    assert.equal(totals.income, 75000);
    assert.equal(totals.expense, 2450.5);
    assert.equal(totals.transfer, 10000); // Recorded separately
    assert.equal(totals.netSavings, 75000 - 2450.5); // Transfers strictly excluded from net savings!
  });

  // -------------------------------------------------------------
  // CATEGORY DELETION REFERENTIAL INTEGRITY
  // -------------------------------------------------------------

  it('DELETE /api/categories/:id prevents deleting custom category if referenced by transactions', async () => {
    // Create transaction referencing User A's custom category
    await request(app)
      .post('/api/transactions')
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader)
      .send({
        type: 'expense',
        amount: 799,
        category: userACustomCategoryId,
        description: 'Gaming Pass',
        date: '2026-10-15',
        paymentMethod: 'card',
      });

    // Try deleting custom category
    const res = await request(app)
      .delete(`/api/categories/${userACustomCategoryId}`)
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader);

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'CATEGORY_IN_USE');
  });

  // -------------------------------------------------------------
  // UPDATE & DELETE TRANSACTION
  // -------------------------------------------------------------

  it('PATCH /api/transactions/:id updates transaction description and amount', async () => {
    const res = await request(app)
      .patch(`/api/transactions/${testTransactionId}`)
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader)
      .send({
        amount: 2500,
        description: 'Supermarket Grocery Run (Updated)',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.transaction.amount, 2500);
    assert.equal(res.body.data.transaction.description, 'Supermarket Grocery Run (Updated)');
  });

  it('DELETE /api/transactions/:id removes transaction', async () => {
    const res = await request(app)
      .delete(`/api/transactions/${testTransactionId}`)
      .set('Cookie', [`${userACookie}; ${userACsrf}`])
      .set('X-CSRF-Token', userACsrfHeader);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify it is gone
    const getRes = await request(app)
      .get(`/api/transactions/${testTransactionId}`)
      .set('Cookie', [`${userACookie}; ${userACsrf}`]);
    assert.equal(getRes.status, 404);
  });
});

