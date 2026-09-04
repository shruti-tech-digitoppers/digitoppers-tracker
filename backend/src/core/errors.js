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
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.code = err.code;

  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'INVALID_PARAMETER');
  } else if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    error = new AppError(`Invalid input data: ${messages.join('. ')}`, 400, 'VALIDATION_ERROR');
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`Duplicate entry for ${field}. Please use a unique value.`, 409, 'DUPLICATE_KEY');
  } else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const errorCode = error.errorCode || err.errorCode || 'INTERNAL_SERVER_ERROR';

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('ERROR 💥:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: error.message || 'Something went wrong on the server',
      ...(process.env.NODE_ENV === 'development' && statusCode === 500 && { stack: err.stack })
    }
  });
};

module.exports = { AppError, errorHandler };
