const router = require('express').Router();
const c = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate, validateObjectId } = require('../middleware/validate.middleware');
const { ROLES } = require('../utils/constants');
const v = require('../validators/order.validator');

router.use(authenticate);

router.post('/', authorize(ROLES.CUSTOMER), validate(v.placeOrder), c.placeOrder);
router.get('/my-orders', validate(v.myOrders), c.myOrders); // must stay above /:orderId
router.get('/:orderId', validateObjectId('orderId'), c.getOne);
router.patch('/:orderId/cancel', validateObjectId('orderId'), authorize(ROLES.CUSTOMER), c.cancel);
router.patch('/:orderId/status', validateObjectId('orderId'), authorize(ROLES.ADMIN, ROLES.RESTAURANT_ADMIN), validate(v.updateStatus), c.updateStatus);

module.exports = router;
