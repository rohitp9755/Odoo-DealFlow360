function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && status === 500 ? { detail: err.message } : {})
  });
}

module.exports = { notFound, errorHandler };
