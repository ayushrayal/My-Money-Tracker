import { verifyToken, AUTH_COOKIE_NAME } from '../services/token.service.js';
import { User } from '../models/user.model.js';

export async function requireAuth(req, res, next) {
  try {
    // Read JWT from HttpOnly cookie first, then fallback to Authorization header
    let token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please log in.',
        },
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session has expired or is invalid. Please log in again.',
        },
      });
    }

    // Load user from database to ensure account still exists and is active
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Account no longer exists. Please register or contact support.',
        },
      });
    }

    // Attach authenticated user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

