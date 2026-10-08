const { Joi, objectId, paging } = require('./common');

const fields = {
  code: Joi.string().trim().uppercase().min(3).max(30).pattern(/^[A-Z0-9_-]+$/),
  restaurant: objectId.allow(null),
  discountType: Joi.string().valid('percentage', 'fixed', 'free_delivery'),
  discountValue: Joi.number().min(0).max(1000000),
  minimumOrder: Joi.number().min(0),
  maximumDiscount: Joi.number().min(0),
  expiryDate: Joi.date().iso().allow(null),
  usageLimit: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
};

const create = {
  body: Joi.object({ ...fields, code: fields.code.required(), discountType: fields.discountType.required() }),
};
const update = { params: Joi.object({ couponId: objectId.required() }), body: Joi.object(fields).min(1) };
const idParam = { params: Joi.object({ couponId: objectId.required() }) };
const list = { query: Joi.object({ ...paging, restaurant: objectId, isActive: Joi.boolean() }) };
const byCode = { params: Joi.object({ code: Joi.string().trim().uppercase().max(30).required() }) };

module.exports = { create, update, idParam, list, byCode };
