const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { ok, created } = require('../utils/apiResponse');
const { getPagination, buildPagination } = require('../utils/pagination');
const { getRestaurantOrFail, canManageRestaurant, assertCanManageRestaurant } = require('../services/access.service');
const { uploadFromRequest, applyImageChange, withUploadCleanup, deleteImage } = require('../services/image.service');

async function assertCategoryBelongs(categoryId, restaurantId) {
  const category = await Category.findById(categoryId);
  if (!category) throw ApiError.unprocessable('Validation failed', [{ field: 'category', message: 'Category does not exist' }]);
  if (String(category.restaurant) !== String(restaurantId)) {
    throw ApiError.unprocessable('Validation failed', [{ field: 'category', message: 'Category belongs to a different restaurant' }]);
  }
  return category;
}

async function loadItem(id) {
  const item = await MenuItem.findById(id).select('+imagePublicId');
  if (!item) throw ApiError.notFound('Menu item not found');
  const restaurant = await Restaurant.findById(item.restaurant);
  return { item, restaurant };
}

// POST /api/restaurants/:restaurantId/menu
exports.create = asyncHandler(async (req, res) => {
  const restaurant = await getRestaurantOrFail(req.params.restaurantId);
  assertCanManageRestaurant(req.user, restaurant);
  await assertCategoryBelongs(req.body.category, restaurant._id);
  if (req.body.discountPrice != null && req.body.discountPrice >= req.body.price) {
    throw ApiError.unprocessable('Validation failed', [{ field: 'discountPrice', message: 'discountPrice must be lower than price' }]);
  }
  const uploaded = await uploadFromRequest(req, 'areeba/menu');
  const data = { ...req.body, restaurant: restaurant._id };
  if (uploaded) Object.assign(data, { image: uploaded.url, imagePublicId: uploaded.publicId });
  const item = await withUploadCleanup(uploaded, () => MenuItem.create(data));
  created(res, 'Menu item created successfully', item);
});

// GET /api/restaurants/:restaurantId/menu  (public)
exports.list = asyncHandler(async (req, res) => {
  const restaurant = await getRestaurantOrFail(req.params.restaurantId);
  const manager = canManageRestaurant(req.user, restaurant);
  if (!restaurant.isActive && !manager) throw ApiError.notFound('Restaurant not found');

  const { category, search, minPrice, maxPrice, available, sort } = req.query;
  const filter = { restaurant: restaurant._id };
  if (category) filter.category = category;
  if (manager) {
    if (available !== undefined) filter.isAvailable = available;
  } else {
    filter.isAvailable = available === undefined ? true : available; // customers see orderable items by default
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { ingredients: rx }];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const { page, limit, skip } = getPagination(req.query);
  const sortBy = sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };
  const [items, total] = await Promise.all([
    MenuItem.find(filter).populate('category', 'name sortOrder').sort(sortBy).skip(skip).limit(limit),
    MenuItem.countDocuments(filter),
  ]);
  ok(res, 'Menu fetched successfully', items, { pagination: buildPagination({ page, limit }, total) });
});

// GET /api/menu/:menuItemId  (public)
exports.getOne = asyncHandler(async (req, res) => {
  const { item, restaurant } = await loadItem(req.params.menuItemId);
  if (!canManageRestaurant(req.user, restaurant) && !restaurant.isActive) throw ApiError.notFound('Menu item not found');
  await item.populate('category', 'name');
  ok(res, 'Menu item fetched successfully', item);
});

// PATCH /api/menu/:menuItemId
exports.update = asyncHandler(async (req, res) => {
  const { item, restaurant } = await loadItem(req.params.menuItemId);
  assertCanManageRestaurant(req.user, restaurant);
  if (req.body.category) await assertCategoryBelongs(req.body.category, restaurant._id);

  const { image, ...rest } = req.body; // eslint-disable-line no-unused-vars
  item.set(rest);
  if (item.discountPrice != null && item.discountPrice >= item.price) {
    throw ApiError.unprocessable('Validation failed', [{ field: 'discountPrice', message: 'discountPrice must be lower than price' }]);
  }
  // keep availability coherent with stock status
  if ('stockStatus' in req.body && req.body.stockStatus !== 'out_of_stock' && !('isAvailable' in req.body)) item.isAvailable = true;
  if ('isAvailable' in req.body && req.body.isAvailable === false && !('stockStatus' in req.body)) item.stockStatus = 'out_of_stock';
  if ('isAvailable' in req.body && req.body.isAvailable === true && item.stockStatus === 'out_of_stock') item.stockStatus = 'in_stock';
  // everything above was validation – only now is the picture uploaded
  const uploaded = await uploadFromRequest(req, 'areeba/menu');
  const previousImage = applyImageChange(item, req.body, uploaded);
  await withUploadCleanup(uploaded, () => item.save());
  await deleteImage(previousImage);
  ok(res, 'Menu item updated successfully', item);
});

// PATCH /api/menu/:menuItemId/availability
exports.setAvailability = asyncHandler(async (req, res) => {
  const { item, restaurant } = await loadItem(req.params.menuItemId);
  assertCanManageRestaurant(req.user, restaurant);
  item.isAvailable = req.body.isAvailable;
  item.stockStatus = req.body.isAvailable ? (item.stockStatus === 'out_of_stock' ? 'in_stock' : item.stockStatus) : 'out_of_stock';
  await item.save();
  ok(res, `Menu item marked as ${item.isAvailable ? 'available' : 'unavailable'}`, item);
});

// DELETE /api/menu/:menuItemId
exports.remove = asyncHandler(async (req, res) => {
  const { item, restaurant } = await loadItem(req.params.menuItemId);
  assertCanManageRestaurant(req.user, restaurant);
  await item.deleteOne(); // past orders keep their own name/price snapshot; carts drop the item on next read
  await deleteImage(item.imagePublicId);
  ok(res, 'Menu item deleted successfully', null);
});
