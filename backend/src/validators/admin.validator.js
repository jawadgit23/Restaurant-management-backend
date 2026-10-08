const { Joi, objectId, paging, boolQuery } = require('./common');
const { ORDER_STATUSES, ROLES } = require('../utils/constants');

const users = {
  query: Joi.object({
    ...paging,
    search: Joi.string().trim().max(100),
    role: Joi.string().valid(...Object.values(ROLES)),
    isBlocked: boolQuery,
  }),
};

const userId = { params: Joi.object({ userId: objectId.required() }) };

const orders = {
  query: Joi.object({
    ...paging,
    status: Joi.string().valid(...ORDER_STATUSES),
    restaurant: objectId,
    from: Joi.date().iso(),
    to: Joi.date().iso(),
    search: Joi.string().trim().max(60),
  }),
};

const restaurants = {
  query: Joi.object({ ...paging, search: Joi.string().trim().max(100), isActive: boolQuery }),
};

const setRole = {
  params: Joi.object({ userId: objectId.required() }),
  body: Joi.object({ role: Joi.string().valid(...Object.values(ROLES)).required() }),
};

module.exports = { users, userId, orders, restaurants, setRole };
