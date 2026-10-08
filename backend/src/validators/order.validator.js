const { Joi, objectId, phone, paging } = require('./common');
const { quantity } = require('./cart.validator');
const { ORDER_STATUSES, PAYMENT_METHODS } = require('../utils/constants');

const deliveryAddress = Joi.object({
  address: Joi.string().trim().min(3).max(300).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  postalCode: Joi.string().trim().max(12).allow(''),
});

const placeOrder = {
  body: Joi.object({
    deliveryAddress: deliveryAddress.required(),
    phone: phone.required(),
    paymentMethod: Joi.string().valid(...PAYMENT_METHODS).default('cash'),
    notes: Joi.string().trim().max(500).allow(''),
    couponCode: Joi.string().trim().uppercase().max(30).allow(''),
    customerName: Joi.string().trim().max(80),
  }),
};

// Staff-created order from the POS terminal. Items carry NO prices.
const posOrder = {
  params: Joi.object({ restaurantId: objectId.required() }),
  body: Joi.object({
    items: Joi.array().items(Joi.object({ menuItemId: objectId.required(), quantity: quantity.required() })).min(1).max(100).required(),
    orderType: Joi.string().valid('dine_in', 'takeaway', 'delivery').default('dine_in'),
    customerName: Joi.string().trim().max(80).allow(''),
    phone: phone.allow(''),
    deliveryAddress: Joi.object({
      address: Joi.string().trim().max(300).allow(''),
      city: Joi.string().trim().max(80).allow(''),
      postalCode: Joi.string().trim().max(12).allow(''),
    }),
    paymentMethod: Joi.string().valid(...PAYMENT_METHODS).default('cash'),
    couponCode: Joi.string().trim().uppercase().max(30).allow(''),
    notes: Joi.string().trim().max(500).allow(''),
  }),
};

const myOrders = {
  query: Joi.object({ ...paging, status: Joi.string().valid(...ORDER_STATUSES) }),
};

const idParam = { params: Joi.object({ orderId: objectId.required() }) };

const updateStatus = {
  params: Joi.object({ orderId: objectId.required() }),
  body: Joi.object({ status: Joi.string().valid(...ORDER_STATUSES).required() }),
};

const restaurantOrders = {
  params: Joi.object({ restaurantId: objectId.required() }),
  query: Joi.object({
    ...paging,
    status: Joi.string().valid(...ORDER_STATUSES),
    from: Joi.date().iso(),
    to: Joi.date().iso(),
    search: Joi.string().trim().max(60),
  }),
};

module.exports = { placeOrder, posOrder, myOrders, idParam, updateStatus, restaurantOrders };
