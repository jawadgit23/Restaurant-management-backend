const mongoose = require('mongoose');
const { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS, ORDER_TYPES, ORDER_SOURCES } = require('../utils/constants');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true }, // snapshot
    price: { type: Number, required: true, min: 0 }, // snapshot of the unit price charged
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true }, // null for POS walk-ins
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    source: { type: String, enum: ORDER_SOURCES, default: 'online' },
    orderType: { type: String, enum: ORDER_TYPES, default: 'delivery' },
    customerName: { type: String, trim: true, default: '' },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    deliveryAddress: {
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    phone: { type: String, trim: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: {
      type: [{ status: String, at: { type: Date, default: Date.now }, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, _id: false }],
      default: [],
    },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

orderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Order', orderSchema);
