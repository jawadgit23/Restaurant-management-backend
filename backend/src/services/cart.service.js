const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { effectivePrice, calculateTotals } = require('../utils/orderRules');
const couponService = require('./coupon.service');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

/** Loads the menu item + restaurant and applies every rule from the spec's "Backend must verify" list. */
async function loadPurchasableItem(menuItemId) {
  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem) throw ApiError.notFound('Menu item not found');
  if (!menuItem.isAvailable) throw ApiError.conflict(`"${menuItem.name}" is currently unavailable`, [], 'ITEM_UNAVAILABLE');

  const restaurant = await Restaurant.findById(menuItem.restaurant);
  if (!restaurant || !restaurant.isActive) throw ApiError.conflict('This restaurant is not accepting orders', [], 'RESTAURANT_INACTIVE');
  return { menuItem, restaurant };
}

/**
 * Builds the response shape. Prices are ALWAYS the current database prices; the price stored in the cart
 * is only used to tell the customer that something changed.
 */
async function buildCartView(cart) {
  await cart.populate([
    { path: 'restaurant', select: 'name city isActive isOpen image' },
    { path: 'items.menuItem', select: 'name image price discountPrice isAvailable restaurant' },
  ]);

  const warnings = [];
  const items = [];
  let dirty = false;

  for (const line of cart.items) {
    const mi = line.menuItem;
    if (!mi) {
      warnings.push('An item in your cart no longer exists and was removed');
      dirty = true;
      continue;
    }
    const currentPrice = effectivePrice(mi);
    const priceChanged = currentPrice !== line.price;
    if (!mi.isAvailable) warnings.push(`"${mi.name}" is no longer available`);
    if (priceChanged) warnings.push(`Price of "${mi.name}" changed from Rs ${line.price} to Rs ${currentPrice}`);
    items.push({
      menuItem: { id: String(mi._id), name: mi.name, image: mi.image, isAvailable: mi.isAvailable },
      quantity: line.quantity,
      price: currentPrice,
      previousPrice: priceChanged ? line.price : undefined,
      lineTotal: currentPrice * line.quantity,
      isAvailable: mi.isAvailable,
      priceChanged,
    });
  }

  if (cart.restaurant && !cart.restaurant.isActive) warnings.push('This restaurant is currently not accepting orders');

  // drop references to deleted items so the cart doesn't keep dangling ids
  if (dirty) {
    cart.items = cart.items.filter((l) => l.menuItem);
    if (!cart.items.length) cart.restaurant = null;
    await cart.save();
  }

  let coupon = null;
  let couponError = null;
  const payable = items.filter((i) => i.isAvailable);
  const rawSubtotal = payable.reduce((s, i) => s + i.price * i.quantity, 0);
  if (cart.couponCode && cart.restaurant) {
    try {
      coupon = await couponService.validateCoupon(cart.couponCode, cart.restaurant._id, rawSubtotal);
    } catch (e) {
      couponError = e.message;
      warnings.push(`Coupon ${cart.couponCode} cannot be applied: ${e.message}`);
    }
  }

  const totals = calculateTotals({
    lines: payable,
    deliveryFee: payable.length ? env.deliveryFee : 0,
    taxRate: env.taxRateOnline,
    coupon,
  });

  return {
    data: {
      id: String(cart._id),
      restaurant: cart.restaurant
        ? { id: String(cart.restaurant._id), name: cart.restaurant.name, city: cart.restaurant.city, isActive: cart.restaurant.isActive }
        : null,
      items,
      couponCode: coupon ? coupon.code : null,
      couponError,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      total: totals.total,
      updatedAt: cart.updatedAt,
    },
    warnings,
  };
}

async function addItem(userId, { menuItemId, quantity }) {
  const { menuItem, restaurant } = await loadPurchasableItem(menuItemId);
  const cart = await getOrCreateCart(userId);

  // one restaurant per cart
  if (cart.items.length && cart.restaurant && String(cart.restaurant) !== String(restaurant._id)) {
    throw ApiError.conflict(
      'Your cart contains items from another restaurant. Clear the cart or finish that order first.',
      [{ field: 'menuItemId', message: 'Item belongs to a different restaurant than the active cart' }],
      'CART_RESTAURANT_MISMATCH'
    );
  }

  const price = effectivePrice(menuItem);
  const existing = cart.items.find((l) => String(l.menuItem) === String(menuItem._id));
  const newQty = (existing ? existing.quantity : 0) + quantity;
  if (newQty > env.maxLineQuantity) {
    throw ApiError.unprocessable('Validation failed', [{ field: 'quantity', message: `Maximum ${env.maxLineQuantity} of the same item per order` }]);
  }

  if (existing) {
    existing.quantity = newQty;
    existing.price = price;
  } else {
    cart.items.push({ menuItem: menuItem._id, quantity, price });
  }
  cart.restaurant = restaurant._id;
  await cart.save();
  return cart;
}

async function updateItem(userId, menuItemId, quantity) {
  const cart = await getOrCreateCart(userId);
  const line = cart.items.find((l) => String(l.menuItem) === String(menuItemId));
  if (!line) throw ApiError.notFound('Item is not in your cart');

  const { menuItem } = await loadPurchasableItem(menuItemId);
  line.quantity = quantity;
  line.price = effectivePrice(menuItem);
  await cart.save();
  return cart;
}

async function removeItem(userId, menuItemId) {
  const cart = await getOrCreateCart(userId);
  const before = cart.items.length;
  cart.items = cart.items.filter((l) => String(l.menuItem) !== String(menuItemId));
  if (cart.items.length === before) throw ApiError.notFound('Item is not in your cart');
  if (!cart.items.length) {
    cart.restaurant = null;
    cart.couponCode = null;
  }
  await cart.save();
  return cart;
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  cart.restaurant = null;
  cart.couponCode = null;
  await cart.save();
  return cart;
}

async function applyCoupon(userId, code) {
  const cart = await getOrCreateCart(userId);
  if (!cart.items.length || !cart.restaurant) throw ApiError.badRequest('Add items to your cart before applying a coupon');
  const view = await buildCartView(cart);
  const subtotal = view.data.items.filter((i) => i.isAvailable).reduce((s, i) => s + i.lineTotal, 0);
  await couponService.validateCoupon(code, cart.restaurant._id || cart.restaurant, subtotal); // throws 422 if invalid
  cart.couponCode = code;
  await cart.save();
  return cart;
}

async function removeCoupon(userId) {
  const cart = await getOrCreateCart(userId);
  cart.couponCode = null;
  await cart.save();
  return cart;
}

module.exports = { getOrCreateCart, buildCartView, addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon, loadPurchasableItem };
