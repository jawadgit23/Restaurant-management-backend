const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    isBlocked: { type: Boolean, default: false },
    // Tokens issued before this moment are rejected (logout / password change = token revocation)
    tokensValidAfter: { type: Date, default: null, select: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.password;
    delete ret.tokensValidAfter;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
