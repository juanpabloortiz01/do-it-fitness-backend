function errorHandler(err, req, res, next) {
  console.error('❌', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
}

module.exports = errorHandler;
