class AppError extends Error {
  constructor(message, statusCode, errorCode = 'API_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥:', err);
  }

  res.status(err.statusCode).json({
    success: false,
    error: {
      code: err.errorCode,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = { AppError, errorHandler };
