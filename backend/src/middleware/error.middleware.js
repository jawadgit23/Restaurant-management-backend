const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const notFound = (req, _res, next) => next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  if (err.name === 'ValidationError' && err.errors && !(err instanceof ApiError)) {
    status = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
    errors = [];
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    message = field === 'email' ? 'Email already registered' : `Duplicate value for ${field}`;
    errors = [{ field, message }];
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
    errors = [];
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
    errors = [];
  } else if (err.name === 'MulterError') {
    status = 400;
  }

  if (status >= 500) {
    if (!env.isTest) console.error(err);
    if (env.isProduction) message = 'Internal server error';
  }

  const body = { success: false, message, errors };
  if (err.code && typeof err.code === 'string') body.code = err.code;
  if (!env.isProduction && status >= 500) body.stack = err.stack;
  res.status(status).json(body);
};

module.exports = { notFound, errorHandler };
