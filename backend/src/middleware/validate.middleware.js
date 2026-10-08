const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

/**
 * validate({ body, query, params }) — each is a Joi schema.
 * Replaces the request parts with the sanitised values (unknown keys stripped, types coerced).
 */
const validate = (schemas) => (req, _res, next) => {
  const errors = [];
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const { value, error } = schemas[part].validate(req[part] ?? {}, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      error.details.forEach((d) => errors.push({ field: d.path.join('.'), location: part, message: d.message.replace(/"/g, '') }));
    } else if (part === 'query') {
      // req.query is a getter in newer Express builds – mutate instead of reassigning
      Object.keys(req.query).forEach((k) => delete req.query[k]);
      Object.assign(req.query, value);
    } else {
      req[part] = value;
    }
  }
  if (errors.length) return next(ApiError.unprocessable('Validation failed', errors));
  return next();
};

/** validateObjectId('restaurantId', 'categoryId') — rejects malformed MongoDB ids with 400. */
const validateObjectId = (...names) => (req, _res, next) => {
  for (const name of names) {
    const value = req.params[name];
    if (value !== undefined && !mongoose.isValidObjectId(value)) {
      return next(ApiError.badRequest(`Invalid ${name}`, [{ field: name, location: 'params', message: 'Must be a valid id' }]));
    }
  }
  return next();
};

module.exports = { validate, validateObjectId };
