const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signAccessToken } = require('../utils/jwt');
const { ROLES } = require('../utils/constants');

async function register({ name, email, password, phone }) {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email already registered', [{ field: 'email', message: 'Email already registered' }]);

  // role is NEVER taken from the request – public registration always creates a customer
  const user = await User.create({ name, email, password, phone, role: ROLES.CUSTOMER });
  return { user, accessToken: signAccessToken(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password → no account enumeration
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  if (user.isBlocked) throw ApiError.forbidden('Your account has been blocked. Contact support.', 'ACCOUNT_BLOCKED');

  user.lastLoginAt = new Date();
  await user.save({ validateModifiedOnly: true });
  return { user, accessToken: signAccessToken(user) };
}

/** Invalidates every token issued before now. */
async function revokeAllTokens(userId) {
  await User.updateOne({ _id: userId }, { tokensValidAfter: new Date() });
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect', [{ field: 'currentPassword', message: 'Current password is incorrect' }]);
  }
  if (await user.comparePassword(newPassword)) {
    throw ApiError.unprocessable('Validation failed', [{ field: 'newPassword', message: 'New password must be different from the current password' }]);
  }
  user.password = newPassword;
  user.tokensValidAfter = new Date(); // revoke all existing sessions
  await user.save();
  return { user, accessToken: signAccessToken(user) }; // fresh token for the current device
}

module.exports = { register, login, changePassword, revokeAllTokens };
