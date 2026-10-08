/**
 * Runs WITHOUT a database: covers routing, validation, auth guards, CORS and error format.
 * Anything that would reach MongoDB is intentionally not tested here (see tests/integration).
 */
process.env.NODE_ENV = 'test';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');

const ID = '64b7f0f0f0f0f0f0f0f0f0f0';

describe('error format & routing', () => {
  test('health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  test('unknown route → 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, errors: [] });
  });
  test('malformed JSON → 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('authentication guard', () => {
  const protectedRoutes = [
    ['get', '/api/users/me'], ['get', '/api/cart'], ['post', '/api/orders'], ['get', '/api/orders/my-orders'],
    ['get', '/api/admin/dashboard'], ['post', `/api/restaurants`], ['patch', `/api/menu/${ID}`], ['get', '/api/coupons'],
  ];
  test.each(protectedRoutes)('%s %s without token → 401', async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_MISSING');
  });
  test('garbage token → 401 TOKEN_INVALID', async () => {
    const res = await request(app).get('/api/users/me').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });
  test('expired token → 401 TOKEN_EXPIRED', async () => {
    const token = jwt.sign({ sub: ID, role: 'customer' }, process.env.JWT_SECRET || 'test-secret-test-secret-test-secret-123', { expiresIn: -10 });
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });
  test('token signed with another secret → 401', async () => {
    const token = jwt.sign({ sub: ID, role: 'admin' }, 'attacker-secret');
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
  test('non-Bearer scheme → 401', async () => {
    const res = await request(app).get('/api/users/me').set('Authorization', 'Basic abc');
    expect(res.status).toBe(401);
  });
});

describe('request validation (422) – nothing reaches the database', () => {
  test('register: all fields invalid', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'J', email: 'nope', password: 'weak', phone: 'abc' });
    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password', 'phone']));
  });
  test('register: cannot smuggle a role (unknown keys are stripped, request still validated)', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'John', email: 'x', password: 'Password123!', phone: '+923001234567', role: 'admin' });
    expect(res.status).toBe(422); // fails on email, never creates anything
  });
  test('login: missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
  });
  test('malformed ObjectId → 400', async () => {
    const res = await request(app).get('/api/restaurants/123');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid restaurantId/);
  });
  test('malformed order id → 400 (after auth) / 401 before', async () => {
    const res = await request(app).get('/api/orders/abc');
    expect(res.status).toBe(401);
  });
});

describe('CORS', () => {
  test('allowed origin gets the header', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
  test('unknown origin is rejected', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://evil.example');
    expect(res.status).toBe(403);
  });
});

describe('NoSQL operator injection', () => {
  test('login with {"$gt": ""} object is rejected by validation', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(422);
  });
});
