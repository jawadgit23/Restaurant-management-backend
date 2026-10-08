const mongoose = require('mongoose');

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    manager: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    city: { type: String, required: true, trim: true, index: true },
    area: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    imagePublicId: { type: String, select: false }, // Cloudinary id, needed to replace/delete the picture
    openingTime: { type: String, match: timeRegex, default: '11:00' },
    closingTime: { type: String, match: timeRegex, default: '23:59' },
    isOpen: { type: Boolean, default: true },
    // isActive=false hides the restaurant and blocks ordering (soft delete / deactivation)
    isActive: { type: Boolean, default: true, index: true },
    // Informational label used by the dashboard ("Under Renovation", etc.)
    status: { type: String, enum: ['active', 'under_renovation', 'closed'], default: 'active' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    openedOn: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

restaurantSchema.index({ name: 'text', description: 'text', city: 'text', area: 'text' });

restaurantSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
