const multer = require('multer');
const ApiError = require('../utils/ApiError');

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const multerInstance = multer({
  storage: multer.memoryStorage(), // nothing is written to disk – the buffer goes straight to Cloudinary
  limits: { fileSize: MAX_BYTES, files: 1, fields: 30, fieldSize: 100 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(ApiError.unprocessable('Validation failed', [{ field: 'image', message: 'Only JPEG, PNG or WebP images are allowed' }]));
    }
    return cb(null, true);
  },
});

const single = multerInstance.single('image');

/**
 * multer for the field "image". JSON requests pass straight through, so one route serves both
 * `application/json` and `multipart/form-data`.
 */
function uploadImageField(req, res, next) {
  single(req, res, (err) => {
    if (!err) return next();
    if (err instanceof ApiError) return next(err);
    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: 'Image must be 5 MB or smaller',
        LIMIT_UNEXPECTED_FILE: 'Send the picture in a single form field named "image"',
        LIMIT_FILE_COUNT: 'Only one image can be uploaded at a time',
      };
      return next(ApiError.unprocessable('Validation failed', [{ field: 'image', message: messages[err.code] || err.message }]));
    }
    return next(err);
  });
}

/**
 * multipart bodies arrive as strings – turn them back into what the Joi schemas expect.
 *   ingredients: '["a","b"]' | 'a, b' | repeated field  → array
 *   discountPrice: ''                                    → null (no discount)
 */
function parseMultipartBody(req, _res, next) {
  if (!req.is('multipart/form-data') || !req.body) return next();
  const body = { ...req.body };

  if (typeof body.ingredients === 'string') {
    const raw = body.ingredients.trim();
    if (raw.startsWith('[')) {
      try {
        body.ingredients = JSON.parse(raw);
      } catch {
        return next(ApiError.unprocessable('Validation failed', [{ field: 'ingredients', message: 'ingredients must be a JSON array or a comma-separated list' }]));
      }
    } else {
      body.ingredients = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    }
  }
  if (body.discountPrice === '' || body.discountPrice === 'null') body.discountPrice = null;

  req.body = body;
  return next();
}

module.exports = { uploadImageField, parseMultipartBody, MAX_BYTES, ALLOWED_MIME };
