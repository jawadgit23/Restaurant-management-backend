const env = require('../config/env');
const ApiError = require('../utils/ApiError');

let cloudinary;
function client() {
  if (!cloudinary) {
    // eslint-disable-next-line global-require
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
      secure: true,
    });
  }
  return cloudinary;
}

/** Streams an in-memory buffer (from multer) to Cloudinary. Resolves { url, publicId }. */
async function uploadImage(buffer, folder = 'areeba') {
  if (!env.cloudinary.enabled) {
    throw ApiError.badRequest(
      'Image upload is not configured on the server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      [],
      'UPLOAD_NOT_CONFIGURED'
    );
  }
  return new Promise((resolve, reject) => {
    const stream = client().uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // downscale huge photos and let Cloudinary pick the best format/quality for the browser
        transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => {
        if (err) return reject(new ApiError(502, 'Image upload failed. Please try again.', [], 'UPLOAD_FAILED'));
        return resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/** Best-effort removal – never throws (a leftover image must not break a delete/update). */
async function deleteImage(publicId) {
  if (!publicId || !env.cloudinary.enabled) return;
  try {
    await client().uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  } catch (err) {
    if (!env.isTest) console.error('Cloudinary delete failed for', publicId, err.message);
  }
}

module.exports = { uploadImage, deleteImage };
