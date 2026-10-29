export function validateRequest(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const fieldErrors = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.') || 'root';
          if (!fieldErrors[path]) {
            fieldErrors[path] = issue.message;
          }
        }

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues[0]?.message || 'Invalid input data',
            fields: fieldErrors,
          },
        });
      }

      next(error);
    }
  };
}

