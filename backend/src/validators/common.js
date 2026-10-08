const Joi = require('joi');

const objectId = Joi.string().hex().length(24).messages({
  'string.hex': '{{#label}} must be a valid id',
  'string.length': '{{#label}} must be a valid id',
});

const phone = Joi.string()
  .trim()
  .pattern(/^\+?[0-9\s-]{7,18}$/)
  .messages({ 'string.pattern.base': 'phone must be a valid phone number (e.g. +923001234567)' });

// Pictures are never accepted as free-form URLs: they are uploaded as a multipart file (field "image")
// and stored on Cloudinary. The only value allowed in the body is '' = "remove the current picture".
const imageClear = Joi.string().valid('').messages({
  'any.only': 'Upload the picture as a file in the "image" form field (multipart/form-data); URLs are not accepted',
});

const paging = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

const boolQuery = Joi.boolean().truthy('true', '1').falsy('false', '0');

const timeHHMM = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).messages({ 'string.pattern.base': '{{#label}} must be HH:mm (24h)' });

module.exports = { Joi, objectId, phone, imageClear, paging, boolQuery, timeHHMM };
