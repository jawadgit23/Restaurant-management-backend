class ApiError extends Error {
  constructor(statusCode, message, errors = [], code) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', errors, code) { return new ApiError(400, msg, errors, code); }
  static unauthorized(msg = 'Authentication required', code) { return new ApiError(401, msg, [], code); }
  static forbidden(msg = 'You do not have permission to perform this action', code) { return new ApiError(403, msg, [], code); }
  static notFound(msg = 'Resource not found') { return new ApiError(404, msg); }
  static conflict(msg = 'Conflict', errors, code) { return new ApiError(409, msg, errors, code); }
  static unprocessable(msg = 'Validation failed', errors) { return new ApiError(422, msg, errors); }
}

module.exports = ApiError;
