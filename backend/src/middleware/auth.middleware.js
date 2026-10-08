const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');

function extractToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme && scheme.toLowerCase() === 'bearer' && token ? token : null;
}

async function loadUserFromToken(token) {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw ApiError.unauthorized('Token expired, please log in again', 'TOKEN_EXPIRED');
    throw ApiError.unauthorized('Invalid token', 'TOKEN_INVALID');
  }

  const user = await User.findById(payload.sub).select('+tokensValidAfter');
  if (!user) throw ApiError.unauthorized('User no longer exists', 'TOKEN_INVALID');
  if (user.isBlocked) throw ApiError.forbidden('Your account has been blocked', 'ACCOUNT_BLOCKED');
  if (user.tokensValidAfter && payload.iat < Math.floor(user.tokensValidAfter.getTime() / 1000)) {
    throw ApiError.unauthorized('Session is no longer valid, please log in again', 'TOKEN_REVOKED');
  }
  return user;
}

/** Requires a valid Bearer token. Attaches the user to req.user. */
const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authorization header with Bearer token is required', 'TOKEN_MISSING');
  req.user = await loadUserFromToken(token);
  next();
});

/** Attaches req.user when a valid token is present, but never fails the request. */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = await loadUserFromToken(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
});

module.exports = { authenticate, optionalAuth };
