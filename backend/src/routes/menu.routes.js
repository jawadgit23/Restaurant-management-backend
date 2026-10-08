const router = require('express').Router();
const c = require('../controllers/menu.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate, validateObjectId } = require('../middleware/validate.middleware');
const { uploadImageField, parseMultipartBody } = require('../middleware/upload.middleware');
const { ROLES } = require('../utils/constants');
const v = require('../validators/menu.validator');

const staff = authorize(ROLES.ADMIN, ROLES.RESTAURANT_ADMIN);

router.get('/:menuItemId', validateObjectId('menuItemId'), optionalAuth, c.getOne);
router.patch('/:menuItemId/availability', validateObjectId('menuItemId'), authenticate, staff, validate(v.availability), c.setAvailability);
router.patch('/:menuItemId', validateObjectId('menuItemId'), authenticate, staff, uploadImageField, parseMultipartBody, validate(v.update), c.update);
router.delete('/:menuItemId', validateObjectId('menuItemId'), authenticate, staff, c.remove);

module.exports = router;
