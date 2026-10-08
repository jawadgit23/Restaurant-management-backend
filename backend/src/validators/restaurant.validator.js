const { Joi, objectId, phone, imageClear, paging, boolQuery, timeHHMM } = require('./common');

const base = {
  name: Joi.string().trim().min(2).max(120),
  description: Joi.string().trim().max(1000).allow(''),
  phone,
  email: Joi.string().trim().lowercase().email(),
  address: Joi.string().trim().min(3).max(300),
  city: Joi.string().trim().min(2).max(80),
  area: Joi.string().trim().max(80).allow(''),
  manager: Joi.string().trim().max(80).allow(''),
  image: imageClear,
  openingTime: timeHHMM,
  closingTime: timeHHMM,
  isOpen: Joi.boolean(),
  status: Joi.string().valid('active', 'under_renovation', 'closed'),
  rating: Joi.number().min(0).max(5),
  openedOn: Joi.string().trim().max(40).allow(''),
};

const create = {
  body: Joi.object({
    ...base,
    name: base.name.required(),
    address: base.address.required(),
    city: base.city.required(),
    // only honoured for super admins (restaurant admins always own what they create)
    owner: objectId,
    isActive: Joi.boolean(),
  }),
};

const update = {
  params: Joi.object({ restaurantId: objectId.required() }),
  body: Joi.object({ ...base, isActive: Joi.boolean(), owner: objectId }).min(1),
};

const list = {
  query: Joi.object({
    ...paging,
    search: Joi.string().trim().max(100),
    city: Joi.string().trim().max(80),
    isActive: boolQuery,
    isOpen: boolQuery,
    owner: objectId,
    sort: Joi.string().valid('name', '-name', 'createdAt', '-createdAt', 'rating', '-rating').default('name'),
  }),
};

const idParam = { params: Joi.object({ restaurantId: objectId.required() }) };

module.exports = { create, update, list, idParam };
