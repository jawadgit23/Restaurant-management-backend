const { Joi, objectId, imageClear, boolQuery } = require('./common');

const create = {
  params: Joi.object({ restaurantId: objectId.required() }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    description: Joi.string().trim().max(500).allow(''),
    image: imageClear,
    sortOrder: Joi.number().integer().min(0).max(10000),
    isActive: Joi.boolean(),
  }),
};

const update = {
  params: Joi.object({ categoryId: objectId.required() }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80),
    description: Joi.string().trim().max(500).allow(''),
    image: imageClear,
    sortOrder: Joi.number().integer().min(0).max(10000),
    isActive: Joi.boolean(),
  }).min(1),
};

const list = {
  params: Joi.object({ restaurantId: objectId.required() }),
  query: Joi.object({ isActive: boolQuery }),
};

const idParam = { params: Joi.object({ categoryId: objectId.required() }) };

module.exports = { create, update, list, idParam };
