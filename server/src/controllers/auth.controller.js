import { User } from '../models/user.model.js';
import { setAuthCookies, clearAuthCookies } from '../services/token.service.js';

export async function signup(req, res, next) {
  try {
    const { name, email, password, currency } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists.',
        },
      });
    }

    // Hash password with bcrypt work factor 12
    const passwordHash = await User.hashPassword(password);

    // Create user record
    const user = await User.create({
      name,
      email,
      passwordHash,
      currency: currency || 'USD',
    });

    // Set secure HttpOnly session cookie and CSRF cookie
    setAuthCookies(res, user);

    return res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    // Handle MongoDB duplicate key error (code 11000) under concurrent requests
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists.',
        },
      });
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Look up user including passwordHash
    const user = await User.findOne({ email }).select('+passwordHash');

    // Generic error message to prevent account enumeration
    const invalidCredentialsResponse = () =>
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });

    if (!user) {
      return invalidCredentialsResponse();
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return invalidCredentialsResponse();
    }

    // Set secure HttpOnly session cookie and CSRF cookie
    setAuthCookies(res, user);

    return res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res) {
  clearAuthCookies(res);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

export function getCurrentUser(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user.toJSON(),
    },
  });
}

