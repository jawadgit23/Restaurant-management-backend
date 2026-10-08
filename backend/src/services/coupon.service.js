const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');

/**
 * Validates a coupon for a given restaurant + subtotal and returns it.
 * Throws a 422 with a human-readable reason otherwise.
 */
async function validateCoupon(code, restaurantId, subtotal) {
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  const fail = (msg) => ApiError.unprocessable(msg, [{ field: 'couponCode', message: msg }]);

  if (!coupon) throw fail('Invalid coupon code');
  if (!coupon.isActive) throw fail('This coupon is not active');
  if (coupon.expiryDate && coupon.expiryDate.getTime() < Date.now()) throw fail('This coupon has expired');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw fail('This coupon has reached its usage limit');
  if (coupon.restaurant && String(coupon.restaurant) !== String(restaurantId)) throw fail('This coupon is not valid for this restaurant');
  if (subtotal < coupon.minimumOrder) throw fail(`Minimum order for this coupon is Rs ${coupon.minimumOrder}`);
  return coupon;
}

/** Atomically consumes one use (guards against two simultaneous orders taking the last use). */
async function redeemCoupon(couponId) {
  const updated = await Coupon.findOneAndUpdate(
    { _id: couponId, $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  if (!updated) throw ApiError.unprocessable('This coupon has reached its usage limit', [{ field: 'couponCode', message: 'Usage limit reached' }]);
  return updated;
}

async function releaseCoupon(couponId) {
  await Coupon.updateOne({ _id: couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

module.exports = { validateCoupon, redeemCoupon, releaseCoupon };
