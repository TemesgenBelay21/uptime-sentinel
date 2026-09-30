/**
 * Global Express error handler.
 * Always send JSON with a consistent shape.
 */
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${req.method} ${req.path} →`, err);
  }

  res.status(status).json({ message, ...(err.errors && { errors: err.errors }) });
};

module.exports = errorHandler;
