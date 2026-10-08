const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

/** Loads a restaurant or throws 404. */
async function getRestaurantOrFail(restaurantId, { withImageId = false } = {}) {
  if (!mongoose.isValidObjectId(restaurantId)) throw ApiError.badRequest('Invalid restaurantId');
  const query = Restaurant.findById(restaurantId);
  if (withImageId) query.select('+imagePublicId'); // only needed when the picture is replaced
  const restaurant = await query;
  if (!restaurant) throw ApiError.notFound('Restaurant not found');
  return restaurant;
}

/** Super admin → always; restaurant admin → only restaurants they own; everyone else → never. */
function canManageRestaurant(user, restaurant) {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return user.role === ROLES.RESTAURANT_ADMIN && String(restaurant.owner) === String(user._id);
}

function assertCanManageRestaurant(user, restaurant) {
  if (!canManageRestaurant(user, restaurant)) {
    throw ApiError.forbidden('You do not have permission to manage this restaurant');
  }
}

/** Restaurant ids a staff user may see. Returns null for super admin (= unrestricted). */
async function managedRestaurantIds(user) {
  if (user.role === ROLES.ADMIN) return null;
  const rows = await Restaurant.find({ owner: user._id }).select('_id');
  return rows.map((r) => r._id);
}

module.exports = { getRestaurantOrFail, canManageRestaurant, assertCanManageRestaurant, managedRestaurantIds };
