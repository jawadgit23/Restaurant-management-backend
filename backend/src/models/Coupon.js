const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    // null restaurant = platform-wide coupon (super admin only)
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 },
    discountType: { type: String, enum: ['percentage', 'fixed', 'free_delivery'], required: true },
    discountValue: { type: Number, default: 0, min: 0 },
    minimumOrder: { type: Number, default: 0, min: 0 },
    maximumDiscount: { type: Number, default: 0, min: 0 }, // 0 = no cap
    expiryDate: { type: Date, default: null },
    usageLimit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Coupon', couponSchema);
