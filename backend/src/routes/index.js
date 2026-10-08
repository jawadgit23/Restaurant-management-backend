const router = require('express').Router();

router.get('/health', (_req, res) => res.json({ success: true, message: 'OK', data: { uptime: process.uptime() } }));

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/restaurants', require('./restaurant.routes'));
router.use('/categories', require('./category.routes'));
router.use('/menu', require('./menu.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/orders', require('./order.routes'));
router.use('/coupons', require('./coupon.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
