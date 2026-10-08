const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // price when added (informational; checkout always re-reads the DB)
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
