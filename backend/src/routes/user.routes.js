const router = require('express').Router();
const c = require('../controllers/user.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const v = require('../validators/auth.validator');

router.use(authenticate);
router.get('/me', c.getMe);
router.patch('/me', validate(v.updateProfile), c.updateMe);
router.patch('/change-password', authLimiter, validate(v.changePassword), c.changePassword);

module.exports = router;
