const router = require('express').Router();
const c = require('../controllers/coupon.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate, validateObjectId } = require('../middleware/validate.middleware');
const { ROLES } = require('../utils/constants');
const v = require('../validators/coupon.validator');

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.RESTAURANT_ADMIN));

router.get('/', validate(v.list), c.list);
router.post('/', validate(v.create), c.create);
router.get('/code/:code', validate(v.byCode), c.getByCode);
router.patch('/:couponId', validateObjectId('couponId'), validate(v.update), c.update);
router.delete('/:couponId', validateObjectId('couponId'), c.remove);

module.exports = router;
