const { Joi, objectId } = require('./common');
const env = require('../config/env');

const quantity = Joi.number().integer().min(1).max(env.maxLineQuantity).messages({
  'number.min': 'quantity must be at least 1',
  'number.max': `quantity cannot exceed ${env.maxLineQuantity}`,
  'number.integer': 'quantity must be a whole number',
});

// NOTE: price/total fields are intentionally NOT accepted – they are stripped by validation.
const addItem = { body: Joi.object({ menuItemId: objectId.required(), quantity: quantity.default(1) }) };
const updateItem = { params: Joi.object({ menuItemId: objectId.required() }), body: Joi.object({ quantity: quantity.required() }) };
const removeItem = { params: Joi.object({ menuItemId: objectId.required() }) };
const applyCoupon = { body: Joi.object({ code: Joi.string().trim().uppercase().max(30).required() }) };

module.exports = { addItem, updateItem, removeItem, applyCoupon, quantity };
