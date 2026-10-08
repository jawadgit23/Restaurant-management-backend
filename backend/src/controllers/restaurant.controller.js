const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { ok, created } = require('../utils/apiResponse');
const { getPagination, buildPagination } = require('../utils/pagination');
const { ROLES } = require('../utils/constants');
const { getRestaurantOrFail, canManageRestaurant, assertCanManageRestaurant } = require('../services/access.service');
const { uploadFromRequest, applyImageChange, withUploadCleanup, deleteImage } = require('../services/image.service');

const isAdmin = (u) => u && u.role === ROLES.ADMIN;

// GET /api/restaurants  (public)
exports.list = asyncHandler(async (req, res) => {
  const { search, city, isActive, isOpen, owner, sort } = req.query;
  const filter = {};

  if (isAdmin(req.user)) {
    if (isActive !== undefined) filter.isActive = isActive;
    if (owner) filter.owner = owner;
  } else if (req.user && req.user.role === ROLES.RESTAURANT_ADMIN && isActive === false) {
    // owners can look at their own deactivated restaurants – never somebody else's
    filter.isActive = false;
    filter.owner = req.user._id;
  } else {
    filter.isActive = true;
  }
  if (isOpen !== undefined) filter.isOpen = isOpen;
  if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { area: rx }, { city: rx }];
  }

  const { page, limit, skip } = getPagination(req.query);
  const sortBy = sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };
  const [items, total] = await Promise.all([
    Restaurant.find(filter).sort(sortBy).skip(skip).limit(limit),
    Restaurant.countDocuments(filter),
  ]);
  ok(res, 'Restaurants fetched successfully', items, { pagination: buildPagination({ page, limit }, total) });
});

// GET /api/restaurants/:restaurantId  (public) – details + categories + menu
exports.getOne = asyncHandler(async (req, res) => {
  const restaurant = await getRestaurantOrFail(req.params.restaurantId);
  const manager = canManageRestaurant(req.user, restaurant);
  if (!restaurant.isActive && !manager) throw ApiError.notFound('Restaurant not found');

  const catFilter = { restaurant: restaurant._id, ...(manager ? {} : { isActive: true }) };
  const itemFilter = { restaurant: restaurant._id, ...(manager ? {} : { isAvailable: true }) };
  const [categories, menu] = await Promise.all([
    Category.find(catFilter).sort({ sortOrder: 1, name: 1 }),
    MenuItem.find(itemFilter).sort({ name: 1 }),
  ]);

  ok(res, 'Restaurant fetched successfully', { ...restaurant.toJSON(), categories, menu });
});

// POST /api/restaurants  (restaurant_admin, admin)
exports.create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.user.role === ROLES.RESTAURANT_ADMIN) {
    data.owner = req.user._id; // can never create on behalf of someone else
    delete data.isActive;
  } else if (data.owner) {
    const owner = await User.findById(data.owner);
    if (!owner || owner.role === ROLES.CUSTOMER) {
      throw ApiError.unprocessable('Validation failed', [{ field: 'owner', message: 'Owner must be an existing restaurant admin or admin user' }]);
    }
  } else {
    data.owner = req.user._id;
  }
  const uploaded = await uploadFromRequest(req, 'areeba/restaurants');
  if (uploaded) Object.assign(data, { image: uploaded.url, imagePublicId: uploaded.publicId });
  const restaurant = await withUploadCleanup(uploaded, () => Restaurant.create(data));
  created(res, 'Restaurant created successfully', restaurant);
});

// PATCH /api/restaurants/:restaurantId  (owner / admin)
exports.update = asyncHandler(async (req, res) => {
  const restaurant = await getRestaurantOrFail(req.params.restaurantId, { withImageId: true });
  assertCanManageRestaurant(req.user, restaurant);

  if (!isAdmin(req.user) && ('isActive' in req.body || 'owner' in req.body)) {
    throw ApiError.forbidden('Only a super admin can activate/deactivate a restaurant or change its owner');
  }
  if (req.body.owner) {
    const owner = await User.findById(req.body.owner);
    if (!owner || owner.role === ROLES.CUSTOMER) {
      throw ApiError.unprocessable('Validation failed', [{ field: 'owner', message: 'Owner must be an existing restaurant admin or admin user' }]);
    }
  }
  const uploaded = await uploadFromRequest(req, 'areeba/restaurants');
  const previousImage = applyImageChange(restaurant, req.body, uploaded);
  const { image, ...rest } = req.body; // eslint-disable-line no-unused-vars
  restaurant.set(rest);
  await withUploadCleanup(uploaded, () => restaurant.save());
  await deleteImage(previousImage);
  ok(res, 'Restaurant updated successfully', restaurant);
});

// DELETE /api/restaurants/:restaurantId  (admin) – soft delete
exports.remove = asyncHandler(async (req, res) => {
  const restaurant = await getRestaurantOrFail(req.params.restaurantId);
  restaurant.isActive = false;
  restaurant.isOpen = false;
  restaurant.status = 'closed';
  await restaurant.save();
  ok(res, 'Restaurant deactivated successfully', restaurant);
});
