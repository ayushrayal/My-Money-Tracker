export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The requested resource '${req.method} ${req.originalUrl}' was not found.`,
    },
  });
}

