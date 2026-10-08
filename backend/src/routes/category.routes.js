const router = require('express').Router();
const c = require('../controllers/category.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate, validateObjectId } = require('../middleware/validate.middleware');
const { uploadImageField, parseMultipartBody } = require('../middleware/upload.middleware');
const { ROLES } = require('../utils/constants');
const v = require('../validators/category.validator');

const staff = authorize(ROLES.ADMIN, ROLES.RESTAURANT_ADMIN);

router.get('/:categoryId', validateObjectId('categoryId'), optionalAuth, c.getOne);
router.patch('/:categoryId', validateObjectId('categoryId'), authenticate, staff, uploadImageField, parseMultipartBody, validate(v.update), c.update);
router.delete('/:categoryId', validateObjectId('categoryId'), authenticate, staff, c.remove);

module.exports = router;
