/**
 * Picture upload (multer → Cloudinary). No database and no network: the Cloudinary service is mocked
 * and a tiny Express app mounts the real middleware.
 */
process.env.NODE_ENV = 'test';
jest.mock('../../src/services/upload.service', () => ({
  uploadImage: jest.fn(async () => ({ url: 'https://res.cloudinary.com/demo/image/upload/areeba/menu/x.png', publicId: 'areeba/menu/x' })),
  deleteImage: jest.fn(async () => {}),
}));

const express = require('express');
const request = require('supertest');
const upload = require('../../src/services/upload.service');
const { uploadImageField, parseMultipartBody } = require('../../src/middleware/upload.middleware');
const { validate } = require('../../src/middleware/validate.middleware');
const { errorHandler } = require('../../src/middleware/error.middleware');
const { uploadFromRequest, applyImageChange, withUploadCleanup, looksLikeRealImage } = require('../../src/services/image.service');
const menuValidator = require('../../src/validators/menu.validator');

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(32)]);

const app = express();
app.use(express.json());
app.post('/menu', uploadImageField, parseMultipartBody, validate({ body: menuValidator.create.body }), async (req, res, next) => {
  try {
    const uploaded = await uploadFromRequest(req, 'areeba/menu');
    res.json({ body: req.body, uploaded });
  } catch (e) {
    next(e);
  }
});
app.use(errorHandler);

const CAT = 'a'.repeat(24);
const fields = (r) => r.field('category', CAT).field('name', 'Zinger Burger').field('price', '650');

beforeEach(() => jest.clearAllMocks());

describe('multer + parsing', () => {
  test('multipart: fields are coerced, file is uploaded to Cloudinary, URL returned', async () => {
    const res = await fields(request(app).post('/menu'))
      .field('discountPrice', '599')
      .field('ingredients', '["Chicken","Lettuce"]')
      .field('preparationTime', '15')
      .attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.body).toMatchObject({ name: 'Zinger Burger', price: 650, discountPrice: 599, ingredients: ['Chicken', 'Lettuce'], preparationTime: 15 });
    expect(res.body.uploaded).toEqual({ url: expect.stringContaining('res.cloudinary.com'), publicId: 'areeba/menu/x' });
    expect(upload.uploadImage).toHaveBeenCalledTimes(1);
    expect(Buffer.isBuffer(upload.uploadImage.mock.calls[0][0])).toBe(true);
    expect(upload.uploadImage.mock.calls[0][1]).toBe('areeba/menu');
  });
  test('ingredients as comma list, empty discountPrice → null', async () => {
    const res = await fields(request(app).post('/menu')).field('ingredients', 'Chicken, Cheese').field('discountPrice', '');
    expect(res.status).toBe(200);
    expect(res.body.body.ingredients).toEqual(['Chicken', 'Cheese']);
    expect(res.body.body.discountPrice).toBeNull();
  });
  test('JPEG and WebP are accepted', async () => {
    expect((await fields(request(app).post('/menu')).attach('image', JPG, { filename: 'a.jpg', contentType: 'image/jpeg' })).status).toBe(200);
    expect((await fields(request(app).post('/menu')).attach('image', WEBP, { filename: 'a.webp', contentType: 'image/webp' })).status).toBe(200);
  });
  test('no file → nothing is uploaded', async () => {
    const res = await fields(request(app).post('/menu'));
    expect(res.status).toBe(200);
    expect(res.body.uploaded).toBeNull();
    expect(upload.uploadImage).not.toHaveBeenCalled();
  });
  test('JSON requests still work (no picture)', async () => {
    const res = await request(app).post('/menu').send({ category: CAT, name: 'Cola', price: 150 });
    expect(res.status).toBe(200);
  });
});

describe('rejections', () => {
  test('wrong MIME type (pdf) → 422', async () => {
    const res = await fields(request(app).post('/menu')).attach('image', Buffer.from('%PDF-1.4'), { filename: 'a.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('image');
    expect(upload.uploadImage).not.toHaveBeenCalled();
  });
  test('file bigger than 5 MB → 422', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    const res = await fields(request(app).post('/menu')).attach('image', big, { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].message).toMatch(/5 MB/);
    expect(upload.uploadImage).not.toHaveBeenCalled();
  });
  test('wrong field name → 422', async () => {
    const res = await fields(request(app).post('/menu')).attach('photo', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(422);
  });
  test('two files → rejected', async () => {
    const res = await fields(request(app).post('/menu'))
      .attach('image', PNG, { filename: 'a.png', contentType: 'image/png' })
      .attach('image', PNG, { filename: 'b.png', contentType: 'image/png' });
    expect(res.status).toBe(422);
  });
  test('text file renamed to .png (fake MIME, bad signature) → 422 and never reaches Cloudinary', async () => {
    const res = await fields(request(app).post('/menu')).attach('image', Buffer.from('<?php echo 1; ?> not an image at all'), { filename: 'evil.png', contentType: 'image/png' });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].message).toMatch(/not a valid/);
    expect(upload.uploadImage).not.toHaveBeenCalled();
  });
  test('a picture URL in the body is refused – pictures only arrive as files', async () => {
    const res = await request(app).post('/menu').send({ category: CAT, name: 'Cola', price: 150, image: 'https://example.com/x.png' });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].message).toMatch(/Upload the picture as a file/);
  });
  test('validation failure → picture is not uploaded', async () => {
    const res = await request(app).post('/menu').field('category', CAT).field('name', 'x').field('price', '-5').attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(422);
    expect(upload.uploadImage).not.toHaveBeenCalled();
  });
  test('malformed ingredients JSON → 422', async () => {
    const res = await fields(request(app).post('/menu')).field('ingredients', '[oops');
    expect(res.status).toBe(422);
  });
});

describe('image helpers', () => {
  test('signature check', () => {
    expect(looksLikeRealImage(PNG)).toBe(true);
    expect(looksLikeRealImage(JPG)).toBe(true);
    expect(looksLikeRealImage(WEBP)).toBe(true);
    expect(looksLikeRealImage(Buffer.from('GIF89a......'))).toBe(false);
    expect(looksLikeRealImage(Buffer.alloc(4))).toBe(false);
  });
  test('applyImageChange: replace → returns old id; remove → clears; untouched → null', () => {
    const doc = { image: 'old-url', imagePublicId: 'old-id' };
    expect(applyImageChange(doc, {}, { url: 'new-url', publicId: 'new-id' })).toBe('old-id');
    expect(doc).toMatchObject({ image: 'new-url', imagePublicId: 'new-id' });
    expect(applyImageChange(doc, { image: '' }, null)).toBe('new-id');
    expect(doc.image).toBe('');
    expect(doc.imagePublicId).toBeUndefined();
    expect(applyImageChange({ image: 'x', imagePublicId: 'y' }, { name: 'z' }, null)).toBeNull();
  });
  test('withUploadCleanup: failed save removes the fresh upload (no orphans)', async () => {
    await expect(withUploadCleanup({ publicId: 'fresh' }, async () => { throw new Error('db down'); })).rejects.toThrow('db down');
    expect(upload.deleteImage).toHaveBeenCalledWith('fresh');
    upload.deleteImage.mockClear();
    await expect(withUploadCleanup(null, async () => 'ok')).resolves.toBe('ok');
    expect(upload.deleteImage).not.toHaveBeenCalled();
  });
});

describe('Cloudinary not configured (real service)', () => {
  test('clear 400 instead of a crash', async () => {
    jest.resetModules();
    jest.unmock('../../src/services/upload.service');
    const real = require('../../src/services/upload.service');
    await expect(real.uploadImage(PNG)).rejects.toMatchObject({ statusCode: 400, code: 'UPLOAD_NOT_CONFIGURED' });
  });
});
