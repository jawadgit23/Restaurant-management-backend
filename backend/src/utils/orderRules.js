/**
 * Pure business rules for orders – no database access, so they are unit-testable.
 */

// Allowed forward transitions. Anything not listed is rejected.
const TRANSITIONS = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['preparing', 'rejected', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
  rejected: [],
};

// A customer may only cancel before the kitchen starts preparing.
const CUSTOMER_CANCELLABLE = ['pending', 'confirmed'];

function canTransition(from, to) {
  return Array.isArray(TRANSITIONS[from]) && TRANSITIONS[from].includes(to);
}

function isTerminal(status) {
  return (TRANSITIONS[status] || []).length === 0;
}

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Compute the discount a coupon gives on a subtotal.
 * coupon: { discountType: 'percentage'|'fixed'|'free_delivery', discountValue, maximumDiscount }
 * Returns { discount, freeDelivery }
 */
function computeCouponDiscount(coupon, subtotal) {
  if (!coupon) return { discount: 0, freeDelivery: false };
  if (coupon.discountType === 'free_delivery') return { discount: 0, freeDelivery: true };

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maximumDiscount > 0) discount = Math.min(discount, coupon.maximumDiscount);
  } else if (coupon.discountType === 'fixed') {
    discount = coupon.discountValue;
  }
  discount = Math.min(Math.max(discount, 0), subtotal); // never negative, never more than the subtotal
  return { discount: Math.round(discount), freeDelivery: false };
}

/**
 * lines: [{ price, quantity }]  (price = CURRENT price from the database)
 */
function calculateTotals({ lines, deliveryFee = 0, taxRate = 0, coupon = null }) {
  const subtotal = round2(lines.reduce((sum, l) => sum + l.price * l.quantity, 0));
  const { discount, freeDelivery } = computeCouponDiscount(coupon, subtotal);
  const fee = freeDelivery ? 0 : deliveryFee;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round((taxable * taxRate) / 100);
  const total = round2(taxable + tax + fee);
  return { subtotal, discount, tax, deliveryFee: fee, total };
}

/** The price a customer pays for one unit: discountPrice when valid, otherwise price. */
function effectivePrice(item) {
  const { price, discountPrice } = item;
  return discountPrice != null && discountPrice > 0 && discountPrice < price ? discountPrice : price;
}

module.exports = {
  TRANSITIONS,
  CUSTOMER_CANCELLABLE,
  canTransition,
  isTerminal,
  computeCouponDiscount,
  calculateTotals,
  effectivePrice,
  round2,
};
