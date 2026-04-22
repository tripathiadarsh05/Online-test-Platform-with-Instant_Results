function notFoundHandler(req, res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || 'Server error'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
