const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/apiResponse');
const authService = require('../services/auth.service');

exports.register = asyncHandler(async (req, res) => {
  const { user, accessToken } = await authService.register(req.body);
  created(res, 'Registration successful', { user, accessToken });
});

exports.login = asyncHandler(async (req, res) => {
  const { user, accessToken } = await authService.login(req.body);
  ok(res, 'Login successful', { user, accessToken });
});

// Stateless JWTs: logout revokes every token issued so far for this user.
exports.logout = asyncHandler(async (req, res) => {
  await authService.revokeAllTokens(req.user._id);
  ok(res, 'Logged out successfully', null);
});
