const ROLES = { CUSTOMER: 'customer', RESTAURANT_ADMIN: 'restaurant_admin', ADMIN: 'admin' };

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const PAYMENT_METHODS = ['cash', 'card', 'online'];
const ORDER_TYPES = ['delivery', 'pickup', 'dine_in', 'takeaway'];
const ORDER_SOURCES = ['online', 'pos'];

module.exports = { ROLES, ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS, ORDER_TYPES, ORDER_SOURCES };
