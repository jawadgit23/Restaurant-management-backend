const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { ok } = require('../utils/apiResponse');
const { getPagination, buildPagination } = require('../utils/pagination');
const { ROLES } = require('../utils/constants');
const { managedRestaurantIds } = require('../services/access.service');
const authService = require('../services/auth.service');
const orderController = require('./order.controller');

// ---------- Users (super admin) ----------
exports.listUsers = asyncHandler(async (req, res) => {
  const { search, role, isBlocked } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (isBlocked !== undefined) filter.isBlocked = isBlocked;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const { page, limit, skip } = getPagination(req.query);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  ok(res, 'Users fetched successfully', users, { pagination: buildPagination({ page, limit }, total) });
});

async function loadTargetUser(req) {
  const user = await User.findById(req.params.userId);
  if (!user) throw ApiError.notFound('User not found');
  if (String(user._id) === String(req.user._id)) throw ApiError.badRequest('You cannot perform this action on your own account');
  return user;
}

exports.blockUser = asyncHandler(async (req, res) => {
  const user = await loadTargetUser(req);
  if (user.role === ROLES.ADMIN) throw ApiError.forbidden('Super admin accounts cannot be blocked');
  user.isBlocked = true;
  await user.save({ validateModifiedOnly: true });
  await authService.revokeAllTokens(user._id);
  ok(res, 'User blocked successfully', user);
});

exports.unblockUser = asyncHandler(async (req, res) => {
  const user = await loadTargetUser(req);
  user.isBlocked = false;
  await user.save({ validateModifiedOnly: true });
  ok(res, 'User unblocked successfully', user);
});

exports.setUserRole = asyncHandler(async (req, res) => {
  const user = await loadTargetUser(req);
  user.role = req.body.role;
  await user.save({ validateModifiedOnly: true });
  await authService.revokeAllTokens(user._id); // old tokens carry the old role
  ok(res, 'User role updated successfully', user);
});

// ---------- Restaurants (scoped: admin = all, restaurant_admin = own) ----------
exports.listRestaurants = asyncHandler(async (req, res) => {
  const filter = {};
  const ids = await managedRestaurantIds(req.user);
  if (ids) filter._id = { $in: ids };
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: rx }, { area: rx }, { city: rx }];
  }
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 50 });
  const [items, total] = await Promise.all([
    Restaurant.find(filter).populate('owner', 'name email').sort({ createdAt: 1 }).skip(skip).limit(limit),
    Restaurant.countDocuments(filter),
  ]);

  // last-30-days activity per restaurant, used by the dashboard's Branches page
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const agg = await Order.aggregate([
    { $match: { restaurant: { $in: items.map((r) => r._id) }, createdAt: { $gte: since }, orderStatus: { $nin: ['cancelled', 'rejected'] } } },
    { $group: { _id: '$restaurant', orders: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, '$total', 0] } } } },
  ]);
  const statsById = new Map(agg.map((a) => [String(a._id), { orders: a.orders, revenue: a.revenue }]));
  const data = items.map((r) => ({ ...r.toJSON(), stats: statsById.get(String(r._id)) || { orders: 0, revenue: 0 } }));

  ok(res, 'Restaurants fetched successfully', data, { pagination: buildPagination({ page, limit }, total) });
});

// ---------- Orders (scoped) ----------
exports.listOrders = asyncHandler(async (req, res) => {
  const ids = await managedRestaurantIds(req.user);
  const base = {};
  if (ids) base.restaurant = { $in: ids };
  if (req.query.restaurant) {
    if (ids && !ids.map(String).includes(String(req.query.restaurant))) throw ApiError.forbidden('You do not manage this restaurant');
    base.restaurant = req.query.restaurant;
  }
  return orderController._paginatedOrders(req, res, orderController._buildStaffFilter(req.query, base), 'Orders fetched successfully');
});

// ---------- Dashboard (scoped) ----------
exports.dashboard = asyncHandler(async (req, res) => {
  const ids = await managedRestaurantIds(req.user);
  const scope = ids ? { restaurant: { $in: ids } } : {};
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalOrders, todaysOrders, pendingOrders, completedOrders, revenueAgg, totalRestaurants, totalUsers, byStatus] = await Promise.all([
    Order.countDocuments(scope),
    Order.countDocuments({ ...scope, createdAt: { $gte: startOfDay } }),
    Order.countDocuments({ ...scope, orderStatus: 'pending' }),
    Order.countDocuments({ ...scope, orderStatus: 'delivered' }),
    Order.aggregate([{ $match: { ...scope, orderStatus: 'delivered' } }, { $group: { _id: null, revenue: { $sum: '$total' } } }]),
    ids ? ids.length : Restaurant.countDocuments(),
    ids ? null : User.countDocuments(),
    Order.aggregate([{ $match: scope }, { $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
  ]);

  ok(res, 'Dashboard statistics fetched successfully', {
    totalUsers,
    totalRestaurants,
    totalOrders,
    totalRevenue: revenueAgg[0]?.revenue || 0,
    todaysOrders,
    pendingOrders,
    completedOrders,
    ordersByStatus: Object.fromEntries(byStatus.map((r) => [r._id, r.count])),
    scope: ids ? 'restaurant' : 'platform',
  });
});
