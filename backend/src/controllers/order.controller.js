const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { ok, created } = require('../utils/apiResponse');
const { getPagination, buildPagination } = require('../utils/pagination');
const orderService = require('../services/order.service');
const { getRestaurantOrFail, assertCanManageRestaurant, managedRestaurantIds } = require('../services/access.service');

const POPULATE = [
  { path: 'restaurant', select: 'name city phone' },
  { path: 'user', select: 'name email phone' },
];

async function loadOrderForUser(orderId, user) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (!(await orderService.canViewOrder(user, order))) throw ApiError.forbidden('You do not have access to this order');
  return order;
}

/** Shared filter builder for staff order lists. */
function buildStaffFilter(query, base = {}) {
  const filter = { ...base };
  if (query.status) filter.orderStatus = query.status;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) {
      const to = new Date(query.to);
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(query.to))) to.setUTCHours(23, 59, 59, 999); // date-only → whole day
      filter.createdAt.$lte = to;
    }
  }
  if (query.search) filter.orderNumber = new RegExp(escapeRegex(query.search), 'i');
  return filter;
}

async function paginatedOrders(req, res, filter, message) {
  const { page, limit, skip } = getPagination(req.query);
  const [orders, total] = await Promise.all([
    Order.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  ok(res, message, orders, { pagination: buildPagination({ page, limit }, total) });
}

// POST /api/orders
exports.placeOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrderFromCart(req.user, req.body);
  await order.populate(POPULATE);
  created(res, 'Order placed successfully', order);
});

// POST /api/restaurants/:restaurantId/orders/pos  (staff)
exports.placePosOrder = asyncHandler(async (req, res) => {
  const restaurant = await getRestaurantOrFail(req.params.restaurantId);
  assertCanManageRestaurant(req.user, restaurant);
  const order = await orderService.createPosOrder(req.user, restaurant, req.body);
  await order.populate(POPULATE);
  created(res, 'Order recorded successfully', order);
});

// GET /api/orders/my-orders
exports.myOrders = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.status) filter.orderStatus = req.query.status;
  return paginatedOrders(req, res, filter, 'Orders fetched successfully');
});

// GET /api/orders/:orderId
exports.getOne = asyncHandler(async (req, res) => {
  const order = await loadOrderForUser(req.params.orderId, req.user);
  await order.populate(POPULATE);
  ok(res, 'Order fetched successfully', order);
});

// PATCH /api/orders/:orderId/cancel  (customer, own order)
exports.cancel = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw ApiError.notFound('Order not found');
  await orderService.cancelOrder(order, req.user);
  await order.populate(POPULATE);
  ok(res, 'Order cancelled successfully', order);
});

// PATCH /api/orders/:orderId/status  (restaurant_admin of that restaurant, admin)
exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw ApiError.notFound('Order not found');
  const restaurant = await getRestaurantOrFail(order.restaurant);
  assertCanManageRestaurant(req.user, restaurant);
  await orderService.updateStatus(order, req.body.status, req.user);
  await order.populate(POPULATE);
  ok(res, `Order status updated to ${order.orderStatus}`, order);
});

// GET /api/restaurants/:restaurantId/orders
exports.restaurantOrders = asyncHandler(async (req, res) => {
  const restaurant = await getRestaurantOrFail(req.params.restaurantId);
  assertCanManageRestaurant(req.user, restaurant);
  return paginatedOrders(req, res, buildStaffFilter(req.query, { restaurant: restaurant._id }), 'Restaurant orders fetched successfully');
});

// DELETE /api/admin/orders/:orderId  (super admin only – hard delete for data clean-up)
exports.remove = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) throw ApiError.notFound('Order not found');
  await order.deleteOne();
  ok(res, 'Order deleted successfully', null);
});

exports._buildStaffFilter = buildStaffFilter;
exports._paginatedOrders = paginatedOrders;
exports._managedRestaurantIds = managedRestaurantIds;
