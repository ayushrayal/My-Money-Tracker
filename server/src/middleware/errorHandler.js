import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  // If response has already started streaming, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: `An account or record with this ${field} already exists.`,
      },
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const fields = {};
    for (const [key, val] of Object.entries(err.errors || {})) {
      fields[key] = val.message;
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        fields,
      },
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const isServerFault = statusCode >= 500;

  // Log error safely on server side without logging sensitive credentials
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const safeMessage = isServerFault && env.IS_PRODUCTION
    ? 'An unexpected internal server error occurred.'
    : err.message || 'An unexpected error occurred.';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (isServerFault ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
      message: safeMessage,
      ...(env.NODE_ENV === 'development' && { details: err.stack }),
    },
  });
}
