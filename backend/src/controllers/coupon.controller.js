const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/apiResponse');
const { getPagination, buildPagination } = require('../utils/pagination');
const { ROLES } = require('../utils/constants');
const { getRestaurantOrFail, assertCanManageRestaurant, managedRestaurantIds } = require('../services/access.service');
const Restaurant = require('../models/Restaurant');

/** Restaurant admins may only touch coupons that belong to one of their restaurants. */
async function assertCanManageCoupon(user, coupon) {
  if (user.role === ROLES.ADMIN) return;
  if (!coupon.restaurant) throw ApiError.forbidden('Only a super admin can manage platform-wide coupons');
  const restaurant = await Restaurant.findById(coupon.restaurant);
  assertCanManageRestaurant(user, restaurant);
}

async function loadCoupon(id) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return coupon;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  const ids = await managedRestaurantIds(req.user);
  if (ids) filter.restaurant = { $in: ids };
  if (req.query.restaurant) {
    if (ids && !ids.map(String).includes(String(req.query.restaurant))) throw ApiError.forbidden('You do not manage this restaurant');
    filter.restaurant = req.query.restaurant;
  }
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive;

  const { page, limit, skip } = getPagination(req.query);
  const [items, total] = await Promise.all([
    Coupon.find(filter).populate('restaurant', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Coupon.countDocuments(filter),
  ]);
  ok(res, 'Coupons fetched successfully', items, { pagination: buildPagination({ page, limit }, total) });
});

exports.getByCode = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.params.code });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  // platform-wide coupons are readable by all staff (POS preview); branch coupons only by that branch's staff
  if (coupon.restaurant) await assertCanManageCoupon(req.user, coupon);
  ok(res, 'Coupon fetched successfully', coupon);
});

exports.create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.user.role === ROLES.RESTAURANT_ADMIN) {
    if (!data.restaurant) throw ApiError.unprocessable('Validation failed', [{ field: 'restaurant', message: 'restaurant is required' }]);
    assertCanManageRestaurant(req.user, await getRestaurantOrFail(data.restaurant));
  } else if (data.restaurant) {
    await getRestaurantOrFail(data.restaurant);
  }
  if (data.discountType === 'percentage' && data.discountValue > 100) {
    throw ApiError.unprocessable('Validation failed', [{ field: 'discountValue', message: 'Percentage cannot exceed 100' }]);
  }
  const coupon = await Coupon.create(data);
  created(res, 'Coupon created successfully', coupon);
});

exports.update = asyncHandler(async (req, res) => {
  const coupon = await loadCoupon(req.params.couponId);
  await assertCanManageCoupon(req.user, coupon);
  if ('restaurant' in req.body && req.user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('Only a super admin can move a coupon to another restaurant');
  }
  coupon.set(req.body);
  if (coupon.discountType === 'percentage' && coupon.discountValue > 100) {
    throw ApiError.unprocessable('Validation failed', [{ field: 'discountValue', message: 'Percentage cannot exceed 100' }]);
  }
  await coupon.save();
  ok(res, 'Coupon updated successfully', coupon);
});

exports.remove = asyncHandler(async (req, res) => {
  const coupon = await loadCoupon(req.params.couponId);
  await assertCanManageCoupon(req.user, coupon);
  await coupon.deleteOne();
  ok(res, 'Coupon deleted successfully', null);
});
