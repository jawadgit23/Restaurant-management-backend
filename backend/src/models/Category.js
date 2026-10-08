const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    image: { type: String, trim: true, default: '' },
    imagePublicId: { type: String, select: false }, // Cloudinary id, needed to replace/delete the picture
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Category names are unique per restaurant (case-insensitive)
categorySchema.index({ restaurant: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

categorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Category', categorySchema);
