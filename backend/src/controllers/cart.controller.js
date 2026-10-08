const asyncHandler = require('../utils/asyncHandler');

const cartService = require('../services/cart.service');

const respond = async (res, cart, message, status = 200) => {
  const { data, warnings } = await cartService.buildCartView(cart);
  return res.status(status).json({ success: true, message, data, ...(warnings.length ? { warnings } : {}) });
};

exports.getCart = asyncHandler(async (req, res) => respond(res, await cartService.getOrCreateCart(req.user._id), 'Cart fetched successfully'));

exports.addItem = asyncHandler(async (req, res) => respond(res, await cartService.addItem(req.user._id, req.body), 'Item added to cart', 201));

exports.updateItem = asyncHandler(async (req, res) =>
  respond(res, await cartService.updateItem(req.user._id, req.params.menuItemId, req.body.quantity), 'Cart item updated'));

exports.removeItem = asyncHandler(async (req, res) =>
  respond(res, await cartService.removeItem(req.user._id, req.params.menuItemId), 'Item removed from cart'));

exports.clearCart = asyncHandler(async (req, res) => respond(res, await cartService.clearCart(req.user._id), 'Cart cleared'));

exports.applyCoupon = asyncHandler(async (req, res) => respond(res, await cartService.applyCoupon(req.user._id, req.body.code), 'Coupon applied'));

exports.removeCoupon = asyncHandler(async (req, res) => respond(res, await cartService.removeCoupon(req.user._id), 'Coupon removed'));

