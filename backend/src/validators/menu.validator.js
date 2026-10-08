const { Joi, objectId, imageClear, paging, boolQuery } = require('./common');

const fields = {
  category: objectId,
  name: Joi.string().trim().min(2).max(120),
  description: Joi.string().trim().max(1000).allow(''),
  price: Joi.number().min(0).max(1000000),
  discountPrice: Joi.number().min(0).max(1000000).allow(null),
  image: imageClear,
  ingredients: Joi.array().items(Joi.string().trim().max(60)).max(40),
  isAvailable: Joi.boolean(),
  stockStatus: Joi.string().valid('in_stock', 'low_stock', 'out_of_stock'),
  preparationTime: Joi.number().integer().min(0).max(600),
  rating: Joi.number().min(0).max(5),
};

const create = {
  params: Joi.object({ restaurantId: objectId.required() }),
  body: Joi.object({
    ...fields,
    category: fields.category.required(),
    name: fields.name.required(),
    price: fields.price.required(),
  }),
};

const update = {
  params: Joi.object({ menuItemId: objectId.required() }),
  body: Joi.object(fields).min(1),
};

const list = {
  params: Joi.object({ restaurantId: objectId.required() }),
  query: Joi.object({
    ...paging,
    category: objectId,
    search: Joi.string().trim().max(100),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    available: boolQuery,
    sort: Joi.string().valid('name', '-name', 'price', '-price', 'createdAt', '-createdAt', '-orderCount').default('name'),
  }),
};

const availability = {
  params: Joi.object({ menuItemId: objectId.required() }),
  body: Joi.object({ isAvailable: Joi.boolean().required() }),
};

const idParam = { params: Joi.object({ menuItemId: objectId.required() }) };

module.exports = { create, update, list, availability, idParam };
