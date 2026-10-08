const router = require('express').Router();
const c = require('../controllers/admin.controller');
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate, validateObjectId } = require('../middleware/validate.middleware');
const { ROLES } = require('../utils/constants');
const v = require('../validators/admin.validator');
const ov = require('../validators/order.validator');

router.use(authenticate);

const superAdmin = authorize(ROLES.ADMIN);
const staff = authorize(ROLES.ADMIN, ROLES.RESTAURANT_ADMIN); // results are scoped to the restaurants they own

// Super admin only
router.get('/users', superAdmin, validate(v.users), c.listUsers);
router.patch('/users/:userId/block', superAdmin, validateObjectId('userId'), c.blockUser);
router.patch('/users/:userId/unblock', superAdmin, validateObjectId('userId'), c.unblockUser);
router.patch('/users/:userId/role', superAdmin, validateObjectId('userId'), validate(v.setRole), c.setUserRole);
router.delete('/orders/:orderId', superAdmin, validateObjectId('orderId'), validate(ov.idParam), orderController.remove);

// Scoped for restaurant admins, unrestricted for super admins
router.get('/restaurants', staff, validate(v.restaurants), c.listRestaurants);
router.get('/orders', staff, validate(v.orders), c.listOrders);
router.get('/dashboard', staff, c.dashboard);

module.exports = router;
