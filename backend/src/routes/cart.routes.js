const router = require('express').Router();
const c = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate, validateObjectId } = require('../middleware/validate.middleware');
const { ROLES } = require('../utils/constants');
const v = require('../validators/cart.validator');

// Carts belong to customers
router.use(authenticate, authorize(ROLES.CUSTOMER));

router.get('/', c.getCart);
router.delete('/', c.clearCart);
router.post('/items', validate(v.addItem), c.addItem);
router.patch('/items/:menuItemId', validateObjectId('menuItemId'), validate(v.updateItem), c.updateItem);
router.delete('/items/:menuItemId', validateObjectId('menuItemId'), validate(v.removeItem), c.removeItem);
router.put('/coupon', validate(v.applyCoupon), c.applyCoupon);
router.delete('/coupon', c.removeCoupon);

module.exports = router;
