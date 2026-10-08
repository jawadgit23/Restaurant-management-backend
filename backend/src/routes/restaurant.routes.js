const router = require('express').Router();
const restaurant = require('../controllers/restaurant.controller');
const category = require('../controllers/category.controller');
const menu = require('../controllers/menu.controller');
const order = require('../controllers/order.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate, validateObjectId } = require('../middleware/validate.middleware');
const { uploadImageField, parseMultipartBody } = require('../middleware/upload.middleware');
const { ROLES } = require('../utils/constants');
const rv = require('../validators/restaurant.validator');
const cv = require('../validators/category.validator');
const mv = require('../validators/menu.validator');
const ov = require('../validators/order.validator');

const staff = authorize(ROLES.ADMIN, ROLES.RESTAURANT_ADMIN);
// multipart (picture) support: auth first, so strangers can't even stream a file to the server
const picture = [uploadImageField, parseMultipartBody];

// Restaurants
router.get('/', optionalAuth, validate(rv.list), restaurant.list);
router.post('/', authenticate, staff, ...picture, validate(rv.create), restaurant.create);
router.get('/:restaurantId', validateObjectId('restaurantId'), optionalAuth, restaurant.getOne);
router.patch('/:restaurantId', validateObjectId('restaurantId'), authenticate, staff, ...picture, validate(rv.update), restaurant.update);
router.delete('/:restaurantId', validateObjectId('restaurantId'), authenticate, authorize(ROLES.ADMIN), restaurant.remove);

// Categories (nested)
router.get('/:restaurantId/categories', validateObjectId('restaurantId'), optionalAuth, validate(cv.list), category.list);
router.post('/:restaurantId/categories', validateObjectId('restaurantId'), authenticate, staff, ...picture, validate(cv.create), category.create);

// Menu (nested)
router.get('/:restaurantId/menu', validateObjectId('restaurantId'), optionalAuth, validate(mv.list), menu.list);
router.post('/:restaurantId/menu', validateObjectId('restaurantId'), authenticate, staff, ...picture, validate(mv.create), menu.create);

// Orders (nested)
router.get('/:restaurantId/orders', validateObjectId('restaurantId'), authenticate, staff, validate(ov.restaurantOrders), order.restaurantOrders);
router.post('/:restaurantId/orders/pos', validateObjectId('restaurantId'), authenticate, staff, validate(ov.posOrder), order.placePosOrder);

module.exports = router;
