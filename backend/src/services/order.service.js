const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const generateOrderNumber = require('../utils/generateOrderNumber');
const { calculateTotals, effectivePrice, canTransition, CUSTOMER_CANCELLABLE } = require('../utils/orderRules');
const couponService = require('./coupon.service');
const { ROLES } = require('../utils/constants');

/**
 * Turns [{ menuItemId, quantity }] into priced order lines using ONLY database prices.
 * Fails (409) if anything is missing, unavailable or from another restaurant.
 */
async function resolveLines(restaurantId, requested) {
  // merge duplicates
  const qtyById = new Map();
  for (const r of requested) qtyById.set(String(r.menuItemId), (qtyById.get(String(r.menuItemId)) || 0) + r.quantity);

  const menuItems = await MenuItem.find({ _id: { $in: [...qtyById.keys()] } });
  const byId = new Map(menuItems.map((m) => [String(m._id), m]));

  const problems = [];
  const lines = [];
  for (const [id, quantity] of qtyById) {
    const mi = byId.get(id);
    if (!mi) {
      problems.push({ field: 'items', menuItemId: id, message: 'Menu item no longer exists' });
    } else if (String(mi.restaurant) !== String(restaurantId)) {
      problems.push({ field: 'items', menuItemId: id, message: `"${mi.name}" belongs to a different restaurant` });
    } else if (!mi.isAvailable) {
      problems.push({ field: 'items', menuItemId: id, message: `"${mi.name}" is no longer available` });
    } else {
      const price = effectivePrice(mi);
      lines.push({ menuItem: mi._id, name: mi.name, price, quantity, subtotal: price * quantity });
    }
  }
  if (problems.length) throw ApiError.conflict('Some items in your order are unavailable', problems, 'ITEMS_UNAVAILABLE');
  return lines;
}

async function insertOrder(doc) {
  // order numbers are random; retry on the (very unlikely) collision
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Order.create({ ...doc, orderNumber: generateOrderNumber() });
    } catch (err) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.orderNumber) continue;
      throw err;
    }
  }
  throw new Error('Could not generate a unique order number');
}

async function bumpOrderCounts(lines) {
  await Promise.all(lines.map((l) => MenuItem.updateOne({ _id: l.menuItem }, { $inc: { orderCount: l.quantity } }))).catch(() => {});
}

/** Customer checkout: cart → order. */
async function createOrderFromCart(user, payload) {
  const cart = await Cart.findOne({ user: user._id });
  if (!cart || !cart.items.length) throw ApiError.badRequest('Your cart is empty', [], 'CART_EMPTY');

  const restaurant = await Restaurant.findById(cart.restaurant);
  if (!restaurant || !restaurant.isActive) throw ApiError.conflict('This restaurant is not accepting orders', [], 'RESTAURANT_INACTIVE');
  if (!restaurant.isOpen) throw ApiError.conflict('This restaurant is currently closed', [], 'RESTAURANT_CLOSED');

  const lines = await resolveLines(
    restaurant._id,
    cart.items.map((l) => ({ menuItemId: l.menuItem, quantity: l.quantity }))
  );

  const rawSubtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const couponCode = payload.couponCode || cart.couponCode;
  const coupon = couponCode ? await couponService.validateCoupon(couponCode, restaurant._id, rawSubtotal) : null;

  const totals = calculateTotals({ lines, deliveryFee: env.deliveryFee, taxRate: env.taxRateOnline, coupon });

  if (coupon) await couponService.redeemCoupon(coupon._id);
  let order;
  try {
    order = await insertOrder({
      user: user._id,
      restaurant: restaurant._id,
      source: 'online',
      orderType: 'delivery',
      customerName: payload.customerName || user.name,
      items: lines,
      deliveryAddress: payload.deliveryAddress,
      phone: payload.phone,
      ...totals,
      couponCode: coupon ? coupon.code : null,
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      statusHistory: [{ status: 'pending', by: user._id }],
      notes: payload.notes || '',
    });
  } catch (err) {
    if (coupon) await couponService.releaseCoupon(coupon._id);
    throw err;
  }

  cart.items = [];
  cart.restaurant = null;
  cart.couponCode = null;
  await cart.save();
  await bumpOrderCounts(lines);
  return order;
}

/** Staff-created order (POS terminal). No cart; prices still come from the DB. */
async function createPosOrder(staff, restaurant, payload) {
  if (!restaurant.isActive) throw ApiError.conflict('This restaurant is not active', [], 'RESTAURANT_INACTIVE');

  const lines = await resolveLines(restaurant._id, payload.items);
  const rawSubtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const coupon = payload.couponCode ? await couponService.validateCoupon(payload.couponCode, restaurant._id, rawSubtotal) : null;

  const isDelivery = payload.orderType === 'delivery';
  const totals = calculateTotals({ lines, deliveryFee: isDelivery ? env.deliveryFee : 0, taxRate: env.taxRatePos, coupon });

  if (coupon) await couponService.redeemCoupon(coupon._id);
  try {
    const order = await insertOrder({
      user: null,
      restaurant: restaurant._id,
      source: 'pos',
      orderType: payload.orderType,
      customerName: payload.customerName || 'Walk-in Customer',
      items: lines,
      deliveryAddress: payload.deliveryAddress,
      phone: payload.phone || undefined,
      ...totals,
      couponCode: coupon ? coupon.code : null,
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      statusHistory: [{ status: 'pending', by: staff._id }],
      notes: payload.notes || '',
    });
    await bumpOrderCounts(lines);
    return order;
  } catch (err) {
    if (coupon) await couponService.releaseCoupon(coupon._id);
    throw err;
  }
}

/** Customer cancellation: own order, only while pending/confirmed. */
async function cancelOrder(order, actor) {
  if (String(order.user) !== String(actor._id)) throw ApiError.forbidden('You can only cancel your own orders');
  if (!CUSTOMER_CANCELLABLE.includes(order.orderStatus)) {
    throw ApiError.conflict(`An order that is "${order.orderStatus}" can no longer be cancelled`, [], 'ORDER_NOT_CANCELLABLE');
  }
  return applyStatus(order, 'cancelled', actor);
}

async function updateStatus(order, status, actor) {
  if (order.orderStatus === status) {
    throw ApiError.conflict(`Order is already "${status}"`, [], 'INVALID_TRANSITION');
  }
  if (!canTransition(order.orderStatus, status)) {
    throw ApiError.conflict(`Cannot change order status from "${order.orderStatus}" to "${status}"`, [], 'INVALID_TRANSITION');
  }
  if (status === 'delivered' && order.orderType !== 'delivery' && order.orderStatus !== 'ready') {
    throw ApiError.conflict('Order must be "ready" before it is completed', [], 'INVALID_TRANSITION');
  }
  return applyStatus(order, status, actor);
}

async function applyStatus(order, status, actor) {
  order.orderStatus = status;
  order.statusHistory.push({ status, by: actor._id });
  if (status === 'delivered' && order.paymentMethod === 'cash' && order.paymentStatus === 'pending') order.paymentStatus = 'paid';
  if ((status === 'cancelled' || status === 'rejected') && order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
  await order.save();
  return order;
}

/** Can this user read this order? */
async function canViewOrder(user, order) {
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.RESTAURANT_ADMIN) {
    const r = await Restaurant.findById(order.restaurant).select('owner');
    return Boolean(r) && String(r.owner) === String(user._id);
  }
  return String(order.user) === String(user._id);
}

module.exports = { createOrderFromCart, createPosOrder, cancelOrder, updateStatus, canViewOrder, resolveLines };
