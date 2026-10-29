import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { AUTH_COOKIE_NAME, CSRF_COOKIE_NAME } from '../src/services/token.service.js';

let mongoServer;

describe('Authentication & MongoDB Integration Tests', () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // 1. Health check verification
  it('GET /api/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'healthy');
  });

  // 2. Signup with valid input
  let userAuthCookie = '';
  let userCsrfCookie = '';
  let userCsrfToken = '';

  it('POST /api/auth/signup with valid input creates account and sets HttpOnly cookies', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test Investor',
        email: 'investor@example.com',
        password: 'Password123!',
        currency: 'USD',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, 'investor@example.com');
    assert.equal(res.body.data.user.name, 'Test Investor');
    assert.equal(res.body.data.user.currency, 'USD');

    // CRITICAL SECURITY ASSERTION: Password hash must NEVER be in response
    assert.equal(res.body.data.user.passwordHash, undefined);
    assert.equal(res.body.data.user.password, undefined);

    // Verify Set-Cookie header contains HttpOnly mmt_auth and mmt_csrf
    const cookies = res.headers['set-cookie'] || [];
    assert.ok(cookies.some((c) => c.includes(`${AUTH_COOKIE_NAME}=`) && c.includes('HttpOnly')));
    assert.ok(cookies.some((c) => c.includes(`${CSRF_COOKIE_NAME}=`)));

    // Save cookies for subsequent tests
    const authCookieHeader = cookies.find((c) => c.includes(`${AUTH_COOKIE_NAME}=`));
    const csrfCookieHeader = cookies.find((c) => c.includes(`${CSRF_COOKIE_NAME}=`));
    userAuthCookie = authCookieHeader.split(';')[0];
    userCsrfCookie = csrfCookieHeader.split(';')[0];
    userCsrfToken = userCsrfCookie.split('=')[1];

    // Verify database record has hashed password, not plaintext
    const dbUser = await User.findOne({ email: 'investor@example.com' }).select('+passwordHash');
    assert.ok(dbUser);
    assert.ok(dbUser.passwordHash.startsWith('$2')); // bcrypt hash signature
    assert.notEqual(dbUser.passwordHash, 'Password123!');
  });

  // 3. Duplicate signup test
  it('POST /api/auth/signup rejects duplicate email with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Another Person',
        email: 'investor@example.com', // Same email
        password: 'Password999!',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'EMAIL_ALREADY_EXISTS');
  });

  // 4. Malformed input validation tests
  it('POST /api/auth/signup rejects invalid passwords (<8 chars or no numbers/uppercase)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Weak Pass',
        email: 'weak@example.com',
        password: 'weak',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.fields.password);
  });

  it('POST /api/auth/signup rejects invalid emails', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Bad Email',
        email: 'not-an-email',
        password: 'Password123!',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.fields.email);
  });

  // 5. Valid Login
  it('POST /api/auth/login succeeds with correct credentials and returns safe user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'investor@example.com',
        password: 'Password123!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, 'investor@example.com');
    assert.equal(res.body.data.user.passwordHash, undefined);
  });

  // 6. Invalid Login (wrong password or non-existent email)
  it('POST /api/auth/login returns generic 401 for incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'investor@example.com',
        password: 'WrongPassword!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
    assert.equal(res.body.error.message, 'Invalid email or password.');
  });

  it('POST /api/auth/login returns generic 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unknown_ghost@example.com',
        password: 'Password123!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
    assert.equal(res.body.error.message, 'Invalid email or password.');
  });

  // 7. GET /api/auth/me without authentication
  it('GET /api/auth/me rejects unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  // 8. GET /api/auth/me with valid session cookie
  it('GET /api/auth/me returns user profile when valid auth cookie is presented', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`${userAuthCookie}; ${userCsrfCookie}`]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, 'investor@example.com');
    assert.equal(res.body.data.user.passwordHash, undefined);
  });

  // 9. CSRF Protection on POST /api/auth/logout
  it('POST /api/auth/logout rejects state-changing request if CSRF token header is missing', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`${userAuthCookie}; ${userCsrfCookie}`]); // Missing X-CSRF-Token header

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'CSRF_INVALID');
  });

  it('POST /api/auth/logout succeeds with matching CSRF header and clears cookies', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`${userAuthCookie}; ${userCsrfCookie}`])
      .set('X-CSRF-Token', userCsrfToken);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify Set-Cookie clears mmt_auth
    const cookies = res.headers['set-cookie'] || [];
    assert.ok(cookies.some((c) => c.includes(`${AUTH_COOKIE_NAME}=;`)));
  });

  // 10. GET /api/auth/me after logout
  it('GET /api/auth/me fails with 401 after logging out', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`${AUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`]);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 11. Stricter Rate Limiting on Authentication endpoints
  it('Authentication rate limiter triggers 429 when max login attempts are exceeded', async () => {
    // We already made several auth calls (1 signup, 1 duplicate signup, 2 invalid signups, 1 login, 2 invalid logins = 7 requests)
    // Send additional requests to breach the limit of 10
    let lastRes;
    for (let i = 0; i < 5; i++) {
      lastRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ratelimit@example.com',
          password: 'Password123!',
        });
    }

    assert.equal(lastRes.status, 429);
    assert.equal(lastRes.body.success, false);
    assert.equal(lastRes.body.error.code, 'AUTH_RATE_LIMIT_EXCEEDED');
  });
});
