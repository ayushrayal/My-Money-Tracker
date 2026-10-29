import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const AUTH_COOKIE_NAME = 'mmt_auth';
export const CSRF_COOKIE_NAME = 'mmt_csrf';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return null;
  }
}

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function setAuthCookies(res, user) {
  const token = signToken({
    sub: user._id.toString(),
    email: user.email,
  });

  const csrfToken = generateCsrfToken();

  // HttpOnly JWT Session Cookie
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
    maxAge: SEVEN_DAYS_MS,
  });

  // Client-readable CSRF Token Cookie (Double-Submit Cookie pattern)
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
    maxAge: SEVEN_DAYS_MS,
  });

  return { token, csrfToken };
}

export function clearAuthCookies(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
  });

  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
  });
}

