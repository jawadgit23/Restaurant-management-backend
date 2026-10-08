const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    price: { type: Number, required: true, min: 0 },
    discountPrice: {
      type: Number,
      min: 0,
      default: null,
      validate: {
        validator(v) {
          return v == null || v < this.price;
        },
        message: 'discountPrice must be lower than price',
      },
    },
    image: { type: String, trim: true, default: '' },
    imagePublicId: { type: String, select: false }, // Cloudinary id, needed to replace/delete the picture
    ingredients: { type: [String], default: [] },
    isAvailable: { type: Boolean, default: true, index: true },
    // Dashboard shows "In Stock / Low Stock / Out of Stock"; out_of_stock forces isAvailable=false
    stockStatus: { type: String, enum: ['in_stock', 'low_stock', 'out_of_stock'], default: 'in_stock' },
    preparationTime: { type: Number, min: 0, max: 600, default: 15 }, // minutes
    rating: { type: Number, min: 0, max: 5, default: 0 },
    orderCount: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.pre('save', function syncAvailability(next) {
  if (this.isModified('stockStatus') && this.stockStatus === 'out_of_stock') this.isAvailable = false;
  next();
});

menuItemSchema.index({ restaurant: 1, name: 1 });
menuItemSchema.index({ name: 'text', description: 'text', ingredients: 'text' });

menuItemSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
