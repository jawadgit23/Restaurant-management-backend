const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/apiResponse');
const { getRestaurantOrFail, canManageRestaurant, assertCanManageRestaurant } = require('../services/access.service');
const Restaurant = require('../models/Restaurant');
const { uploadFromRequest, applyImageChange, withUploadCleanup, deleteImage } = require('../services/image.service');

async function loadCategory(id) {
  const category = await Category.findById(id).select('+imagePublicId');
  if (!category) throw ApiError.notFound('Category not found');
  const restaurant = await Restaurant.findById(category.restaurant);
  return { category, restaurant };
}

// POST /api/restaurants/:restaurantId/categories
exports.create = asyncHandler(async (req, res) => {
  const restaurant = await getRestaurantOrFail(req.params.restaurantId);
  assertCanManageRestaurant(req.user, restaurant);
  const uploaded = await uploadFromRequest(req, 'areeba/categories');
  const data = { ...req.body, restaurant: restaurant._id };
  if (uploaded) Object.assign(data, { image: uploaded.url, imagePublicId: uploaded.publicId });
  const category = await withUploadCleanup(uploaded, () => Category.create(data));
  created(res, 'Category created successfully', category);
});

// GET /api/restaurants/:restaurantId/categories  (public)
exports.list = asyncHandler(async (req, res) => {
  const restaurant = await getRestaurantOrFail(req.params.restaurantId);
  const manager = canManageRestaurant(req.user, restaurant);
  if (!restaurant.isActive && !manager) throw ApiError.notFound('Restaurant not found');

  const filter = { restaurant: restaurant._id };
  if (!manager) filter.isActive = true;
  else if (req.query.isActive !== undefined) filter.isActive = req.query.isActive;
  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
  ok(res, 'Categories fetched successfully', categories);
});

// GET /api/categories/:categoryId  (public)
exports.getOne = asyncHandler(async (req, res) => {
  const { category, restaurant } = await loadCategory(req.params.categoryId);
  const manager = canManageRestaurant(req.user, restaurant);
  if (!manager && (!category.isActive || !restaurant.isActive)) throw ApiError.notFound('Category not found');
  ok(res, 'Category fetched successfully', category);
});

// PATCH /api/categories/:categoryId
exports.update = asyncHandler(async (req, res) => {
  const { category, restaurant } = await loadCategory(req.params.categoryId);
  assertCanManageRestaurant(req.user, restaurant);
  const uploaded = await uploadFromRequest(req, 'areeba/categories');
  const previousImage = applyImageChange(category, req.body, uploaded);
  const { image, ...rest } = req.body; // eslint-disable-line no-unused-vars
  category.set(rest);
  await withUploadCleanup(uploaded, () => category.save());
  await deleteImage(previousImage);
  ok(res, 'Category updated successfully', category);
});

// DELETE /api/categories/:categoryId
exports.remove = asyncHandler(async (req, res) => {
  const { category, restaurant } = await loadCategory(req.params.categoryId);
  assertCanManageRestaurant(req.user, restaurant);
  const itemCount = await MenuItem.countDocuments({ category: category._id });
  if (itemCount > 0) {
    throw ApiError.conflict(`This category still has ${itemCount} menu item(s). Move or delete them first.`, [], 'CATEGORY_NOT_EMPTY');
  }
  await category.deleteOne();
  await deleteImage(category.imagePublicId);
  ok(res, 'Category deleted successfully', null);
});
