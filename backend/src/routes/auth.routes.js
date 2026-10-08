const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const v = require('../validators/auth.validator');

router.post('/register', authLimiter, validate(v.register), c.register);
router.post('/login', authLimiter, validate(v.login), c.login);
router.post('/logout', authenticate, c.logout);

module.exports = router;
