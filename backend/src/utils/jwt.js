const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id || user.id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    jwtid: crypto.randomUUID(),
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signAccessToken, verifyAccessToken };
