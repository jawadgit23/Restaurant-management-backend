const ApiError = require('../utils/ApiError');
const { uploadImage, deleteImage } = require('./upload.service');

/** The declared MIME type is client-controlled, so also check the real file signature. */
function looksLikeRealImage(buf) {
  if (!buf || buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpeg || png || webp;
}

/**
 * Uploads the multer file (if any) to Cloudinary. Call this AFTER validation and the ownership check,
 * so unauthorised or invalid requests never cost an upload.
 * Returns { url, publicId } or null when the request has no file.
 */
async function uploadFromRequest(req, folder) {
  if (!req.file) return null;
  if (!looksLikeRealImage(req.file.buffer)) {
    throw ApiError.unprocessable('Validation failed', [{ field: 'image', message: 'The file is not a valid JPEG, PNG or WebP image' }]);
  }
  return uploadImage(req.file.buffer, folder);
}

/**
 * Applies an image change to a Mongoose document (image + imagePublicId) and returns the previous
 * Cloudinary id that should be deleted once the document has been saved.
 *   uploaded          → new picture replaces the old one
 *   body.image === '' → picture removed
 */
function applyImageChange(doc, body, uploaded) {
  let previous = null;
  if (uploaded) {
    previous = doc.imagePublicId || null;
    doc.image = uploaded.url;
    doc.imagePublicId = uploaded.publicId;
  } else if (body.image === '') {
    previous = doc.imagePublicId || null;
    doc.image = '';
    doc.imagePublicId = undefined;
  }
  return previous;
}

/** Runs `fn`; if it throws, the freshly uploaded picture is removed so Cloudinary has no orphans. */
async function withUploadCleanup(uploaded, fn) {
  try {
    return await fn();
  } catch (err) {
    if (uploaded) await deleteImage(uploaded.publicId);
    throw err;
  }
}

module.exports = { uploadFromRequest, applyImageChange, withUploadCleanup, looksLikeRealImage, deleteImage };
