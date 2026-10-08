const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const make = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max: env.isTest ? 10000 : max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message, errors: [] },
  });

// Brute-force protection on login / register
const authLimiter = make(15 * 60 * 1000, 20, 'Too many authentication attempts, please try again in 15 minutes');
// General API limiter
const apiLimiter = make(15 * 60 * 1000, 1000, 'Too many requests, please slow down');

module.exports = { authLimiter, apiLimiter };
