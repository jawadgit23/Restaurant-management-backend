const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const authService = require('../services/auth.service');

exports.getMe = asyncHandler(async (req, res) => ok(res, 'Profile fetched successfully', req.user));

exports.updateMe = asyncHandler(async (req, res) => {
  // validator already whitelisted name/phone only – role/email/password cannot be changed here
  Object.assign(req.user, req.body);
  await req.user.save();
  ok(res, 'Profile updated successfully', req.user);
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { user, accessToken } = await authService.changePassword(req.user._id, req.body);
  ok(res, 'Password changed successfully. Other sessions have been signed out.', { user, accessToken });
});
