import { CSRF_COOKIE_NAME } from '../services/token.service.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function verifyCsrf(req, res, next) {
  // Safe read-only HTTP methods are exempt from CSRF verification
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Exempt unauthenticated public endpoints (login, signup) that establish initial session
  if (req.path === '/signup' || req.path === '/login') {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_INVALID',
        message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
      },
    });
  }

  next();
}

