const { canTransition, isTerminal, computeCouponDiscount, calculateTotals, effectivePrice } = require('../../src/utils/orderRules');
const generateOrderNumber = require('../../src/utils/generateOrderNumber');

describe('order status transitions', () => {
  test('allows the happy path', () => {
    const flow = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    for (let i = 0; i < flow.length - 1; i += 1) expect(canTransition(flow[i], flow[i + 1])).toBe(true);
  });
  test('rejects skipping steps and going backwards', () => {
    expect(canTransition('pending', 'preparing')).toBe(false);
    expect(canTransition('pending', 'delivered')).toBe(false);
    expect(canTransition('preparing', 'confirmed')).toBe(false);
    expect(canTransition('delivered', 'pending')).toBe(false);
  });
  test('terminal states cannot change', () => {
    ['delivered', 'cancelled', 'rejected'].forEach((s) => expect(isTerminal(s)).toBe(true));
    expect(canTransition('cancelled', 'pending')).toBe(false);
    expect(canTransition('rejected', 'confirmed')).toBe(false);
  });
  test('unknown status is rejected', () => {
    expect(canTransition('nonsense', 'pending')).toBe(false);
  });
});

describe('effectivePrice', () => {
  test('uses a valid discount price', () => expect(effectivePrice({ price: 650, discountPrice: 599 })).toBe(599));
  test('ignores null / zero / higher discount price', () => {
    expect(effectivePrice({ price: 650, discountPrice: null })).toBe(650);
    expect(effectivePrice({ price: 650, discountPrice: 0 })).toBe(650);
    expect(effectivePrice({ price: 650, discountPrice: 700 })).toBe(650);
  });
});

describe('coupons & totals', () => {
  test('percentage with cap', () => {
    expect(computeCouponDiscount({ discountType: 'percentage', discountValue: 20, maximumDiscount: 100 }, 1000).discount).toBe(100);
    expect(computeCouponDiscount({ discountType: 'percentage', discountValue: 20, maximumDiscount: 0 }, 1000).discount).toBe(200);
  });
  test('fixed discount never exceeds subtotal', () => {
    expect(computeCouponDiscount({ discountType: 'fixed', discountValue: 5000 }, 800).discount).toBe(800);
  });
  test('free delivery', () => {
    expect(computeCouponDiscount({ discountType: 'free_delivery' }, 800)).toEqual({ discount: 0, freeDelivery: true });
  });
  test('no coupon', () => expect(computeCouponDiscount(null, 800)).toEqual({ discount: 0, freeDelivery: false }));

  test('calculateTotals: subtotal + delivery', () => {
    const t = calculateTotals({ lines: [{ price: 650, quantity: 2 }, { price: 350, quantity: 1 }], deliveryFee: 150 });
    expect(t).toEqual({ subtotal: 1650, discount: 0, tax: 0, deliveryFee: 150, total: 1800 });
  });
  test('calculateTotals: coupon + tax', () => {
    const t = calculateTotals({
      lines: [{ price: 1000, quantity: 1 }],
      deliveryFee: 150,
      taxRate: 5,
      coupon: { discountType: 'percentage', discountValue: 10 },
    });
    // 1000 - 100 = 900; tax 5% = 45; + 150
    expect(t).toEqual({ subtotal: 1000, discount: 100, tax: 45, deliveryFee: 150, total: 1095 });
  });
  test('calculateTotals: free-delivery coupon removes the fee', () => {
    const t = calculateTotals({ lines: [{ price: 700, quantity: 1 }], deliveryFee: 150, coupon: { discountType: 'free_delivery' } });
    expect(t.deliveryFee).toBe(0);
    expect(t.total).toBe(700);
  });
});

describe('generateOrderNumber', () => {
  test('format and uniqueness', () => {
    const set = new Set();
    for (let i = 0; i < 500; i += 1) set.add(generateOrderNumber());
    expect(set.size).toBe(500);
    expect([...set][0]).toMatch(/^ORD-\d{6}-[A-Z2-9]{6}$/);
  });
});
