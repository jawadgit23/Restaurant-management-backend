/**
 * Full API integration tests. Uses an in-memory MongoDB (mongodb-memory-server downloads a mongod
 * binary on first run, so it needs internet access once).  Run with:  npm test
 */
process.env.NODE_ENV = 'test';
let mockUploadCount = 0;
jest.mock('../../src/services/upload.service', () => ({
  uploadImage: jest.fn(async (_buf, folder) => {
    mockUploadCount += 1;
    return { url: `https://res.cloudinary.com/demo/image/upload/${folder}/img${mockUploadCount}.png`, publicId: `${folder}/img${mockUploadCount}` };
  }),
  deleteImage: jest.fn(async () => {}),
}));
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Coupon = require('../../src/models/Coupon');
const MenuItem = require('../../src/models/MenuItem');
const uploadService = require('../../src/services/upload.service');
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);

let mongod;
const api = () => request(app);
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const PW = 'Password123!';

const ctx = {};

async function register(name, email) {
  const res = await api().post('/api/auth/register').send({ name, email, password: PW, phone: '+923001234567' });
  expect(res.status).toBe(201);
  return res.body.data;
}
async function makeStaff(name, email, role) {
  await User.create({ name, email, password: PW, role, phone: '+923001234567' });
  const res = await api().post('/api/auth/login').send({ email, password: PW });
  return res.body.data;
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Auth', () => {
  test('register → customer, no password leaked, token returned', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'John Doe', email: 'John@Example.com', password: PW, phone: '+923001234567', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('customer'); // role in body ignored
    expect(res.body.data.user.email).toBe('john@example.com');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.accessToken).toBeTruthy();
    ctx.customer = res.body.data;
  });
  test('duplicate email → 409', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'John', email: 'john@example.com', password: PW, phone: '+923001234567' });
    expect(res.status).toBe(409);
  });
  test('password is stored hashed', async () => {
    const u = await User.findOne({ email: 'john@example.com' }).select('+password');
    expect(u.password).not.toBe(PW);
    expect(u.password).toMatch(/^\$2[aby]\$/);
  });
  test('login ok / wrong password / unknown email', async () => {
    const ok = await api().post('/api/auth/login').send({ email: 'john@example.com', password: PW });
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.password).toBeUndefined();
    const bad = await api().post('/api/auth/login').send({ email: 'john@example.com', password: 'Wrong123!' });
    const unknown = await api().post('/api/auth/login').send({ email: 'nobody@example.com', password: PW });
    expect(bad.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(bad.body.message).toBe(unknown.body.message); // no account enumeration
  });
  test('GET/PATCH /users/me', async () => {
    const me = await api().get('/api/users/me').set(auth(ctx.customer.accessToken));
    expect(me.status).toBe(200);
    const upd = await api().patch('/api/users/me').set(auth(ctx.customer.accessToken)).send({ name: 'John Updated', phone: '+923009999999', role: 'admin', email: 'x@y.com' });
    expect(upd.status).toBe(200);
    expect(upd.body.data.name).toBe('John Updated');
    expect(upd.body.data.role).toBe('customer');
    expect(upd.body.data.email).toBe('john@example.com');
  });
  test('change password revokes old tokens, new token works', async () => {
    const reg = await register('Pass Tester', 'pass@example.com');
    const bad = await api().patch('/api/users/change-password').set(auth(reg.accessToken)).send({ currentPassword: 'Nope12345', newPassword: 'NewPassword123!' });
    expect(bad.status).toBe(400);

    await new Promise((r) => setTimeout(r, 1100)); // iat has 1-second resolution
    const res = await api().patch('/api/users/change-password').set(auth(reg.accessToken)).send({ currentPassword: PW, newPassword: 'NewPassword123!' });
    expect(res.status).toBe(200);
    const old = await api().get('/api/users/me').set(auth(reg.accessToken));
    expect(old.status).toBe(401);
    expect(old.body.code).toBe('TOKEN_REVOKED');
    const fresh = await api().get('/api/users/me').set(auth(res.body.data.accessToken));
    expect(fresh.status).toBe(200);
    const login = await api().post('/api/auth/login').send({ email: 'pass@example.com', password: 'NewPassword123!' });
    expect(login.status).toBe(200);
  });
  test('logout revokes the token', async () => {
    const reg = await register('Logout Tester', 'logout@example.com');
    await new Promise((r) => setTimeout(r, 1100));
    expect((await api().post('/api/auth/logout').set(auth(reg.accessToken))).status).toBe(200);
    expect((await api().get('/api/users/me').set(auth(reg.accessToken))).status).toBe(401);
  });
});

describe('Restaurants, categories, menu', () => {
  test('setup staff', async () => {
    ctx.admin = await makeStaff('Super', 'super@example.com', 'admin');
    ctx.owner1 = await makeStaff('Owner One', 'owner1@example.com', 'restaurant_admin');
    ctx.owner2 = await makeStaff('Owner Two', 'owner2@example.com', 'restaurant_admin');
  });

  test('customer cannot create a restaurant (403)', async () => {
    const res = await api().post('/api/restaurants').set(auth(ctx.customer.accessToken)).send({ name: 'X', address: 'Street 1', city: 'Karachi' });
    expect(res.status).toBe(403);
  });
  test('restaurant admin creates restaurants (owner forced to self)', async () => {
    const r1 = await api().post('/api/restaurants').set(auth(ctx.owner1.accessToken)).send({ name: 'Pizza Palace', address: 'Main Street 1', city: 'Karachi', owner: ctx.owner2.user.id });
    expect(r1.status).toBe(201);
    expect(r1.body.data.owner).toBe(ctx.owner1.user.id);
    ctx.r1 = r1.body.data;
    const r2 = await api().post('/api/restaurants').set(auth(ctx.owner2.accessToken)).send({ name: 'Burger Barn', address: 'Side Road 2', city: 'Lahore' });
    expect(r2.status).toBe(201);
    ctx.r2 = r2.body.data;
  });
  test('public listing: pagination, search, city filter', async () => {
    const all = await api().get('/api/restaurants?page=1&limit=1');
    expect(all.status).toBe(200);
    expect(all.body.pagination).toMatchObject({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect((await api().get('/api/restaurants?search=pizza')).body.data).toHaveLength(1);
    expect((await api().get('/api/restaurants?city=lahore')).body.data[0].name).toBe('Burger Barn');
  });
  test("owner cannot modify another owner's restaurant", async () => {
    const res = await api().patch(`/api/restaurants/${ctx.r1.id}`).set(auth(ctx.owner2.accessToken)).send({ name: 'Hacked' });
    expect(res.status).toBe(403);
    const ok = await api().patch(`/api/restaurants/${ctx.r1.id}`).set(auth(ctx.owner1.accessToken)).send({ phone: '+923001112222' });
    expect(ok.status).toBe(200);
  });
  test('owner cannot deactivate; only super admin can', async () => {
    expect((await api().patch(`/api/restaurants/${ctx.r1.id}`).set(auth(ctx.owner1.accessToken)).send({ isActive: false })).status).toBe(403);
    expect((await api().delete(`/api/restaurants/${ctx.r1.id}`).set(auth(ctx.owner1.accessToken))).status).toBe(403);
  });
  test('non-existent restaurant → 404, malformed id → 400', async () => {
    expect((await api().get('/api/restaurants/64b7f0f0f0f0f0f0f0f0f0f0')).status).toBe(404);
    expect((await api().get('/api/restaurants/xyz')).status).toBe(400);
  });

  test('categories: create / duplicate / list / update', async () => {
    const c = await api().post(`/api/restaurants/${ctx.r1.id}/categories`).set(auth(ctx.owner1.accessToken)).send({ name: 'Burgers', description: 'Our premium burgers', sortOrder: 1 });
    expect(c.status).toBe(201);
    ctx.cat1 = c.body.data;
    const dup = await api().post(`/api/restaurants/${ctx.r1.id}/categories`).set(auth(ctx.owner1.accessToken)).send({ name: 'burgers' });
    expect(dup.status).toBe(409);
    const other = await api().post(`/api/restaurants/${ctx.r1.id}/categories`).set(auth(ctx.owner2.accessToken)).send({ name: 'Drinks' });
    expect(other.status).toBe(403);
    const drinks = await api().post(`/api/restaurants/${ctx.r1.id}/categories`).set(auth(ctx.owner1.accessToken)).send({ name: 'Drinks', sortOrder: 2 });
    ctx.cat2 = drinks.body.data;
    const list = await api().get(`/api/restaurants/${ctx.r1.id}/categories`);
    expect(list.body.data.map((x) => x.name)).toEqual(['Burgers', 'Drinks']);
    const upd = await api().patch(`/api/categories/${ctx.cat1.id}`).set(auth(ctx.owner1.accessToken)).send({ description: 'Updated' });
    expect(upd.body.data.description).toBe('Updated');
    expect((await api().get('/api/categories/64b7f0f0f0f0f0f0f0f0f0f0')).status).toBe(404);
  });

  test('menu: create, validation, discount rule, category from another restaurant', async () => {
    const good = await api().post(`/api/restaurants/${ctx.r1.id}/menu`).set(auth(ctx.owner1.accessToken)).send({
      category: ctx.cat1.id, name: 'Zinger Burger', description: 'Crispy chicken burger', price: 650, discountPrice: 599,
      ingredients: ['Chicken', 'Lettuce', 'Cheese', 'Sauce'], preparationTime: 15,
    });
    expect(good.status).toBe(201);
    ctx.zinger = good.body.data;
    ctx.cola = (await api().post(`/api/restaurants/${ctx.r1.id}/menu`).set(auth(ctx.owner1.accessToken)).send({ category: ctx.cat2.id, name: 'Cola', price: 150 })).body.data;

    expect((await api().post(`/api/restaurants/${ctx.r1.id}/menu`).set(auth(ctx.owner1.accessToken)).send({ category: ctx.cat1.id, name: 'Bad', price: -5 })).status).toBe(422);
    expect((await api().post(`/api/restaurants/${ctx.r1.id}/menu`).set(auth(ctx.owner1.accessToken)).send({ category: ctx.cat1.id, name: 'Bad', price: 100, discountPrice: 120 })).status).toBe(422);

    const otherCat = (await api().post(`/api/restaurants/${ctx.r2.id}/categories`).set(auth(ctx.owner2.accessToken)).send({ name: 'Wraps' })).body.data;
    ctx.r2cat = otherCat;
    const wrong = await api().post(`/api/restaurants/${ctx.r1.id}/menu`).set(auth(ctx.owner1.accessToken)).send({ category: otherCat.id, name: 'Wrap', price: 300 });
    expect(wrong.status).toBe(422);
  });
  test('menu listing: search, category, price range, pagination', async () => {
    const base = `/api/restaurants/${ctx.r1.id}/menu`;
    expect((await api().get(`${base}?search=burger`)).body.data).toHaveLength(1);
    expect((await api().get(`${base}?category=${ctx.cat2.id}`)).body.data[0].name).toBe('Cola');
    expect((await api().get(`${base}?minPrice=200&maxPrice=1000`)).body.data.map((i) => i.name)).toEqual(['Zinger Burger']);
    const paged = await api().get(`${base}?limit=1&page=2`);
    expect(paged.body.pagination).toMatchObject({ page: 2, limit: 1, total: 2, totalPages: 2 });
  });
  test('restaurant details include categories and menu', async () => {
    const res = await api().get(`/api/restaurants/${ctx.r1.id}`);
    expect(res.body.data.categories).toHaveLength(2);
    expect(res.body.data.menu).toHaveLength(2);
  });
  test('menu update / availability / foreign owner blocked', async () => {
    expect((await api().patch(`/api/menu/${ctx.zinger.id}`).set(auth(ctx.owner2.accessToken)).send({ price: 1 })).status).toBe(403);
    expect((await api().patch(`/api/menu/${ctx.zinger.id}`).set(auth(ctx.customer.accessToken)).send({ price: 1 })).status).toBe(403);
    const upd = await api().patch(`/api/menu/${ctx.zinger.id}`).set(auth(ctx.owner1.accessToken)).send({ price: 700, discountPrice: 650 });
    expect(upd.body.data.price).toBe(700);
    const off = await api().patch(`/api/menu/${ctx.cola.id}/availability`).set(auth(ctx.owner1.accessToken)).send({ isAvailable: false });
    expect(off.body.data.isAvailable).toBe(false);
    expect((await api().get(`/api/restaurants/${ctx.r1.id}/menu`)).body.data).toHaveLength(1); // customers don't see it
    await api().patch(`/api/menu/${ctx.cola.id}/availability`).set(auth(ctx.owner1.accessToken)).send({ isAvailable: true });
  });
  test('category with items cannot be deleted (409)', async () => {
    expect((await api().delete(`/api/categories/${ctx.cat1.id}`).set(auth(ctx.owner1.accessToken))).status).toBe(409);
  });
});

describe('Cart', () => {
  test('staff cannot use a cart (customers only)', async () => {
    expect((await api().get('/api/cart').set(auth(ctx.owner1.accessToken))).status).toBe(403);
  });
  test('empty cart', async () => {
    const res = await api().get('/api/cart').set(auth(ctx.customer.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });
  test('add item: price comes from the DB, client price ignored', async () => {
    const res = await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: ctx.zinger.id, quantity: 2, price: 1, total: 1 });
    expect(res.status).toBe(201);
    expect(res.body.data.items[0].price).toBe(650); // discountPrice
    expect(res.body.data.subtotal).toBe(1300);
    expect(res.body.data.deliveryFee).toBe(150);
    expect(res.body.data.total).toBe(1450);
  });
  test('quantity < 1 and unknown item', async () => {
    expect((await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: ctx.cola.id, quantity: 0 })).status).toBe(422);
    expect((await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: '64b7f0f0f0f0f0f0f0f0f0f0', quantity: 1 })).status).toBe(404);
  });
  test('item from another restaurant → 409', async () => {
    const other = (await api().post(`/api/restaurants/${ctx.r2.id}/menu`).set(auth(ctx.owner2.accessToken)).send({ category: ctx.r2cat.id, name: 'Chicken Wrap', price: 400 })).body.data;
    ctx.wrap = other;
    const res = await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: other.id, quantity: 1 });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CART_RESTAURANT_MISMATCH');
  });
  test('unavailable item cannot be added', async () => {
    await api().patch(`/api/menu/${ctx.cola.id}/availability`).set(auth(ctx.owner1.accessToken)).send({ isAvailable: false });
    const res = await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: ctx.cola.id, quantity: 1 });
    expect(res.status).toBe(409);
    await api().patch(`/api/menu/${ctx.cola.id}/availability`).set(auth(ctx.owner1.accessToken)).send({ isAvailable: true });
  });
  test('update and remove', async () => {
    await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: ctx.cola.id, quantity: 1 });
    const upd = await api().patch(`/api/cart/items/${ctx.cola.id}`).set(auth(ctx.customer.accessToken)).send({ quantity: 3 });
    expect(upd.body.data.items.find((i) => i.menuItem.id === ctx.cola.id).quantity).toBe(3);
    const del = await api().delete(`/api/cart/items/${ctx.cola.id}`).set(auth(ctx.customer.accessToken));
    expect(del.body.data.items).toHaveLength(1);
    expect((await api().delete(`/api/cart/items/${ctx.cola.id}`).set(auth(ctx.customer.accessToken))).status).toBe(404);
  });
  test('price change after adding → cart shows current price + warning', async () => {
    await MenuItem.updateOne({ _id: ctx.zinger.id }, { discountPrice: null, price: 800 });
    const res = await api().get('/api/cart').set(auth(ctx.customer.accessToken));
    expect(res.body.data.items[0].price).toBe(800);
    expect(res.body.data.items[0].priceChanged).toBe(true);
    expect(res.body.warnings.join(' ')).toMatch(/changed/);
  });
  test('clear cart', async () => {
    const res = await api().delete('/api/cart').set(auth(ctx.customer.accessToken));
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.restaurant).toBeNull();
  });
});

describe('Orders', () => {
  const address = { address: 'House 123, Main Street', city: 'Karachi', postalCode: '75000' };

  test('empty cart → 400', async () => {
    const res = await api().post('/api/orders').set(auth(ctx.customer.accessToken)).send({ deliveryAddress: address, phone: '+923001234567', paymentMethod: 'cash' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CART_EMPTY');
  });

  test('checkout uses DB prices, snapshots items, clears cart', async () => {
    await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: ctx.zinger.id, quantity: 2 });
    await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: ctx.cola.id, quantity: 1 });
    // price rises between cart and checkout
    await MenuItem.updateOne({ _id: ctx.zinger.id }, { price: 900 });

    const res = await api().post('/api/orders').set(auth(ctx.customer.accessToken)).send({
      deliveryAddress: address, phone: '+923001234567', paymentMethod: 'cash', notes: 'Call me',
      total: 1, subtotal: 1, items: [{ price: 1 }], // all ignored
    });
    expect(res.status).toBe(201);
    const o = res.body.data;
    expect(o.orderNumber).toMatch(/^ORD-/);
    expect(o.items.find((i) => i.name === 'Zinger Burger')).toMatchObject({ price: 900, quantity: 2, subtotal: 1800 });
    expect(o.subtotal).toBe(1950);
    expect(o.deliveryFee).toBe(150);
    expect(o.total).toBe(2100);
    expect(o.orderStatus).toBe('pending');
    expect(o.paymentStatus).toBe('pending');
    ctx.order = o;

    const cart = await api().get('/api/cart').set(auth(ctx.customer.accessToken));
    expect(cart.body.data.items).toEqual([]);

    // later price change does not rewrite history
    await MenuItem.updateOne({ _id: ctx.zinger.id }, { price: 1 });
    const again = await api().get(`/api/orders/${o.id}`).set(auth(ctx.customer.accessToken));
    expect(again.body.data.items.find((i) => i.name === 'Zinger Burger').price).toBe(900);
    await MenuItem.updateOne({ _id: ctx.zinger.id }, { price: 700 });
  });

  test('coupon: validation + discount + usage counted', async () => {
    await Coupon.create({ code: 'SAVE10', discountType: 'percentage', discountValue: 10, minimumOrder: 500, usageLimit: 1 });
    await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: ctx.zinger.id, quantity: 1 });
    const bad = await api().post('/api/orders').set(auth(ctx.customer.accessToken)).send({ deliveryAddress: address, phone: '+923001234567', couponCode: 'NOPE' });
    expect(bad.status).toBe(422);
    const ok = await api().post('/api/orders').set(auth(ctx.customer.accessToken)).send({ deliveryAddress: address, phone: '+923001234567', couponCode: 'save10' });
    expect(ok.status).toBe(201);
    expect(ok.body.data.discount).toBe(70); // 10% of 700
    expect(ok.body.data.total).toBe(700 - 70 + 150);
    // limit of 1 now exhausted
    await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: ctx.zinger.id, quantity: 1 });
    const used = await api().post('/api/orders').set(auth(ctx.customer.accessToken)).send({ deliveryAddress: address, phone: '+923001234567', couponCode: 'SAVE10' });
    expect(used.status).toBe(422);
    await api().delete('/api/cart').set(auth(ctx.customer.accessToken));
  });

  test('item became unavailable / restaurant deactivated between cart and checkout', async () => {
    await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: ctx.cola.id, quantity: 1 });
    await MenuItem.updateOne({ _id: ctx.cola.id }, { isAvailable: false });
    const res = await api().post('/api/orders').set(auth(ctx.customer.accessToken)).send({ deliveryAddress: address, phone: '+923001234567' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ITEMS_UNAVAILABLE');
    await MenuItem.updateOne({ _id: ctx.cola.id }, { isAvailable: true });

    const del = await api().delete(`/api/restaurants/${ctx.r1.id}`).set(auth(ctx.admin.accessToken));
    expect(del.status).toBe(200);
    expect(del.body.data.isActive).toBe(false);
    const blocked = await api().post('/api/orders').set(auth(ctx.customer.accessToken)).send({ deliveryAddress: address, phone: '+923001234567' });
    expect(blocked.status).toBe(409);
    expect(blocked.body.code).toBe('RESTAURANT_INACTIVE');
    expect((await api().get(`/api/restaurants/${ctx.r1.id}`)).status).toBe(404); // hidden from public
    expect((await api().get(`/api/restaurants/${ctx.r1.id}`).set(auth(ctx.owner1.accessToken))).status).toBe(200); // owner still sees it
    await api().patch(`/api/restaurants/${ctx.r1.id}`).set(auth(ctx.admin.accessToken)).send({ isActive: true, isOpen: true, status: 'active' });
    await api().delete('/api/cart').set(auth(ctx.customer.accessToken));
  });

  test('my-orders: pagination + status filter', async () => {
    const all = await api().get('/api/orders/my-orders?page=1&limit=10').set(auth(ctx.customer.accessToken));
    expect(all.body.pagination.total).toBeGreaterThanOrEqual(2);
    expect((await api().get('/api/orders/my-orders?status=delivered').set(auth(ctx.customer.accessToken))).body.data).toHaveLength(0);
    expect((await api().get('/api/orders/my-orders?status=bogus').set(auth(ctx.customer.accessToken))).status).toBe(422);
  });

  test('order access rules', async () => {
    const stranger = await register('Stranger', 'stranger@example.com');
    expect((await api().get(`/api/orders/${ctx.order.id}`).set(auth(stranger.accessToken))).status).toBe(403);
    expect((await api().get(`/api/orders/${ctx.order.id}`).set(auth(ctx.owner1.accessToken))).status).toBe(200);
    expect((await api().get(`/api/orders/${ctx.order.id}`).set(auth(ctx.owner2.accessToken))).status).toBe(403);
    expect((await api().get(`/api/orders/${ctx.order.id}`).set(auth(ctx.admin.accessToken))).status).toBe(200);
    expect((await api().patch(`/api/orders/${ctx.order.id}/cancel`).set(auth(stranger.accessToken))).status).toBe(403);
    expect((await api().get('/api/orders/64b7f0f0f0f0f0f0f0f0f0f0').set(auth(ctx.customer.accessToken))).status).toBe(404);
  });

  test('restaurant order list: owner only, filters', async () => {
    const base = `/api/restaurants/${ctx.r1.id}/orders`;
    expect((await api().get(base).set(auth(ctx.customer.accessToken))).status).toBe(403);
    expect((await api().get(base).set(auth(ctx.owner2.accessToken))).status).toBe(403);
    const res = await api().get(`${base}?status=pending&page=1&limit=20`).set(auth(ctx.owner1.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    const search = await api().get(`${base}?search=${ctx.order.orderNumber.slice(0, 12)}`).set(auth(ctx.owner1.accessToken));
    expect(search.body.data.map((o) => o.id)).toContain(ctx.order.id);
    const future = await api().get(`${base}?from=2999-01-01`).set(auth(ctx.owner1.accessToken));
    expect(future.body.data).toHaveLength(0);
  });

  test('status flow: invalid transitions rejected, valid flow works', async () => {
    const url = `/api/orders/${ctx.order.id}/status`;
    const set = (t, status) => api().patch(url).set(auth(t)).send({ status });
    expect((await set(ctx.customer.accessToken, 'confirmed')).status).toBe(403);
    expect((await set(ctx.owner2.accessToken, 'confirmed')).status).toBe(403);
    expect((await set(ctx.owner1.accessToken, 'delivered')).status).toBe(409); // skipping steps
    expect((await set(ctx.owner1.accessToken, 'banana')).status).toBe(422);
    for (const s of ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']) {
      const r = await set(ctx.owner1.accessToken, s);
      expect(r.status).toBe(200);
      expect(r.body.data.orderStatus).toBe(s);
    }
    const done = (await api().get(`/api/orders/${ctx.order.id}`).set(auth(ctx.customer.accessToken))).body.data;
    expect(done.paymentStatus).toBe('paid'); // cash collected on delivery
    expect(done.statusHistory.map((h) => h.status)).toEqual(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']);
    expect((await set(ctx.admin.accessToken, 'pending')).status).toBe(409); // terminal
  });

  test('customer cancellation rules', async () => {
    await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: ctx.cola.id, quantity: 1 });
    const o = (await api().post('/api/orders').set(auth(ctx.customer.accessToken)).send({ deliveryAddress: address, phone: '+923001234567' })).body.data;
    expect((await api().patch(`/api/orders/${o.id}/cancel`).set(auth(ctx.customer.accessToken))).body.data.orderStatus).toBe('cancelled');
    expect((await api().patch(`/api/orders/${o.id}/cancel`).set(auth(ctx.customer.accessToken))).status).toBe(409); // already cancelled

    await api().post('/api/cart/items').set(auth(ctx.customer.accessToken)).send({ menuItemId: ctx.cola.id, quantity: 1 });
    const o2 = (await api().post('/api/orders').set(auth(ctx.customer.accessToken)).send({ deliveryAddress: address, phone: '+923001234567' })).body.data;
    for (const s of ['confirmed', 'preparing']) await api().patch(`/api/orders/${o2.id}/status`).set(auth(ctx.owner1.accessToken)).send({ status: s });
    const late = await api().patch(`/api/orders/${o2.id}/cancel`).set(auth(ctx.customer.accessToken));
    expect(late.status).toBe(409);
    expect(late.body.code).toBe('ORDER_NOT_CANCELLABLE');
  });

  test('POS order: staff only, prices from DB, 5% tax', async () => {
    const url = `/api/restaurants/${ctx.r1.id}/orders/pos`;
    expect((await api().post(url).set(auth(ctx.customer.accessToken)).send({ items: [{ menuItemId: ctx.cola.id, quantity: 1 }] })).status).toBe(403);
    expect((await api().post(url).set(auth(ctx.owner2.accessToken)).send({ items: [{ menuItemId: ctx.cola.id, quantity: 1 }] })).status).toBe(403);
    const res = await api().post(url).set(auth(ctx.owner1.accessToken)).send({ items: [{ menuItemId: ctx.cola.id, quantity: 2, price: 1 }], orderType: 'dine_in', paymentMethod: 'cash' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ source: 'pos', subtotal: 300, tax: 15, deliveryFee: 0, total: 315, customerName: 'Walk-in Customer' });
    const foreign = await api().post(url).set(auth(ctx.owner1.accessToken)).send({ items: [{ menuItemId: ctx.wrap.id, quantity: 1 }] });
    expect(foreign.status).toBe(409); // item belongs to another restaurant
  });
});

describe('Admin & coupons', () => {
  test('admin endpoints are role-protected', async () => {
    expect((await api().get('/api/admin/users').set(auth(ctx.customer.accessToken))).status).toBe(403);
    expect((await api().get('/api/admin/users').set(auth(ctx.owner1.accessToken))).status).toBe(403);
    expect((await api().get('/api/admin/users').set(auth(ctx.admin.accessToken))).status).toBe(200);
    expect((await api().get('/api/admin/dashboard').set(auth(ctx.customer.accessToken))).status).toBe(403);
  });
  test('dashboard: platform vs restaurant scope', async () => {
    const all = await api().get('/api/admin/dashboard').set(auth(ctx.admin.accessToken));
    expect(all.body.data).toMatchObject({ scope: 'platform' });
    expect(all.body.data.totalRevenue).toBeGreaterThan(0);
    const mine = await api().get('/api/admin/dashboard').set(auth(ctx.owner2.accessToken));
    expect(mine.body.data).toMatchObject({ scope: 'restaurant', totalOrders: 0 });
  });
  test('admin orders / restaurants are scoped to owned restaurants', async () => {
    const o1 = await api().get('/api/admin/orders').set(auth(ctx.owner1.accessToken));
    expect(o1.body.data.length).toBeGreaterThan(0);
    expect((await api().get('/api/admin/orders').set(auth(ctx.owner2.accessToken))).body.data).toHaveLength(0);
    expect((await api().get('/api/admin/orders?restaurant=' + ctx.r1.id).set(auth(ctx.owner2.accessToken))).status).toBe(403);
    const rs = await api().get('/api/admin/restaurants').set(auth(ctx.owner2.accessToken));
    expect(rs.body.data.map((r) => r.id)).toEqual([ctx.r2.id]);
  });
  test('block / unblock user: blocked users cannot log in or use old tokens', async () => {
    const victim = await register('Victim', 'victim@example.com');
    await new Promise((r) => setTimeout(r, 50));
    expect((await api().patch(`/api/admin/users/${victim.user.id}/block`).set(auth(ctx.admin.accessToken))).status).toBe(200);
    const login = await api().post('/api/auth/login').send({ email: 'victim@example.com', password: PW });
    expect(login.status).toBe(403);
    expect((await api().get('/api/users/me').set(auth(victim.accessToken))).status).toBe(403);
    expect((await api().patch(`/api/admin/users/${victim.user.id}/unblock`).set(auth(ctx.admin.accessToken))).status).toBe(200);
    expect((await api().post('/api/auth/login').send({ email: 'victim@example.com', password: PW })).status).toBe(200);
    expect((await api().patch(`/api/admin/users/${ctx.admin.user.id}/block`).set(auth(ctx.admin.accessToken))).status).toBe(400); // not yourself
  });
  test('coupons: owner can only manage their own restaurant coupons', async () => {
    const mk = (t, body) => api().post('/api/coupons').set(auth(t)).send(body);
    expect((await mk(ctx.owner1.accessToken, { code: 'NOREST', discountType: 'fixed', discountValue: 50 })).status).toBe(422);
    expect((await mk(ctx.owner1.accessToken, { code: 'MINE50', discountType: 'fixed', discountValue: 50, restaurant: ctx.r2.id })).status).toBe(403);
    const ok = await mk(ctx.owner1.accessToken, { code: 'mine50', discountType: 'fixed', discountValue: 50, restaurant: ctx.r1.id });
    expect(ok.status).toBe(201);
    expect(ok.body.data.code).toBe('MINE50');
    expect((await api().patch(`/api/coupons/${ok.body.data.id}`).set(auth(ctx.owner2.accessToken)).send({ isActive: false })).status).toBe(403);
    expect((await api().post('/api/coupons').set(auth(ctx.owner1.accessToken)).send({ code: 'BIG', discountType: 'percentage', discountValue: 150, restaurant: ctx.r1.id })).status).toBe(422);
    expect((await api().delete(`/api/coupons/${ok.body.data.id}`).set(auth(ctx.owner1.accessToken))).status).toBe(200);
  });
});

describe('Pictures (multer → Cloudinary)', () => {
  const png = { filename: 'p.png', contentType: 'image/png' };

  test('menu item: create with a picture, replace it, remove it, delete the item', async () => {
    const created = await api().post(`/api/restaurants/${ctx.r2.id}/menu`).set(auth(ctx.owner2.accessToken))
      .field('category', ctx.r2cat.id).field('name', 'Picture Wrap').field('price', '500')
      .field('ingredients', '["Chicken","Mayo"]').attach('image', PNG, png);
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    expect(created.body.data.image).toMatch(/^https:\/\/res\.cloudinary\.com\/.+\/areeba\/menu\//);
    expect(created.body.data.ingredients).toEqual(['Chicken', 'Mayo']);
    expect(created.body.data.imagePublicId).toBeUndefined(); // internal id never leaves the server
    const firstId = (await MenuItem.findById(id).select('+imagePublicId')).imagePublicId;

    uploadService.deleteImage.mockClear();
    const replaced = await api().patch(`/api/menu/${id}`).set(auth(ctx.owner2.accessToken)).field('price', '550').attach('image', PNG, png);
    expect(replaced.status).toBe(200);
    expect(replaced.body.data.price).toBe(550);
    expect(replaced.body.data.image).not.toBe(created.body.data.image);
    expect(uploadService.deleteImage).toHaveBeenCalledWith(firstId); // old picture removed from Cloudinary

    const kept = await api().patch(`/api/menu/${id}`).set(auth(ctx.owner2.accessToken)).send({ name: 'Renamed Wrap' });
    expect(kept.body.data.image).toBe(replaced.body.data.image); // JSON edit leaves the picture alone

    uploadService.deleteImage.mockClear();
    const cleared = await api().patch(`/api/menu/${id}`).set(auth(ctx.owner2.accessToken)).send({ image: '' });
    expect(cleared.body.data.image).toBe('');
    expect(uploadService.deleteImage).toHaveBeenCalledTimes(1);

    await api().patch(`/api/menu/${id}`).set(auth(ctx.owner2.accessToken)).attach('image', PNG, png);
    uploadService.deleteImage.mockClear();
    expect((await api().delete(`/api/menu/${id}`).set(auth(ctx.owner2.accessToken))).status).toBe(200);
    expect(uploadService.deleteImage).toHaveBeenCalledTimes(1);
  });

  test('a stranger or customer cannot upload (no Cloudinary call is made)', async () => {
    uploadService.uploadImage.mockClear();
    const url = `/api/restaurants/${ctx.r2.id}/menu`;
    const stranger = await api().post(url).set(auth(ctx.owner1.accessToken)).field('category', ctx.r2cat.id).field('name', 'Nope').field('price', '1').attach('image', PNG, png);
    expect(stranger.status).toBe(403);
    const customer = await api().post(url).set(auth(ctx.customer.accessToken)).field('category', ctx.r2cat.id).field('name', 'Nope').field('price', '1').attach('image', PNG, png);
    expect(customer.status).toBe(403);
    const anon = await api().post(url).field('name', 'Nope').attach('image', PNG, png);
    expect(anon.status).toBe(401);
    expect(uploadService.uploadImage).not.toHaveBeenCalled();
  });

  test('invalid data or a duplicate does not leave an orphan picture', async () => {
    uploadService.uploadImage.mockClear();
    uploadService.deleteImage.mockClear();
    const bad = await api().post(`/api/restaurants/${ctx.r2.id}/menu`).set(auth(ctx.owner2.accessToken)).field('category', ctx.r2cat.id).field('name', 'Bad').field('price', '-1').attach('image', PNG, png);
    expect(bad.status).toBe(422);
    expect(uploadService.uploadImage).not.toHaveBeenCalled();
    // category name is unique per restaurant → the DB save fails AFTER the upload → upload is rolled back
    await api().post(`/api/restaurants/${ctx.r2.id}/categories`).set(auth(ctx.owner2.accessToken)).field('name', 'Pic Cat').attach('image', PNG, png);
    uploadService.deleteImage.mockClear();
    const dup = await api().post(`/api/restaurants/${ctx.r2.id}/categories`).set(auth(ctx.owner2.accessToken)).field('name', 'pic cat').attach('image', PNG, png);
    expect(dup.status).toBe(409);
    expect(uploadService.deleteImage).toHaveBeenCalledTimes(1);
  });

  test('restaurant picture: create (restaurant admin) and update', async () => {
    const r = await api().post('/api/restaurants').set(auth(ctx.owner2.accessToken)).field('name', 'Photo Place').field('address', 'Road 5, Clifton').field('city', 'Karachi').attach('image', PNG, png);
    expect(r.status).toBe(201);
    expect(r.body.data.image).toContain('areeba/restaurants');
    const upd = await api().patch(`/api/restaurants/${r.body.data.id}`).set(auth(ctx.owner2.accessToken)).attach('image', PNG, png);
    expect(upd.status).toBe(200);
    expect(upd.body.data.image).not.toBe(r.body.data.image);
  });

  test('picture URLs and non-image files are refused', async () => {
    const url = await api().patch(`/api/menu/${ctx.cola.id}`).set(auth(ctx.owner1.accessToken)).send({ image: 'https://example.com/x.png' });
    expect(url.status).toBe(422);
    const pdf = await api().patch(`/api/menu/${ctx.cola.id}`).set(auth(ctx.owner1.accessToken)).attach('image', Buffer.from('%PDF-1.4'), { filename: 'a.pdf', contentType: 'application/pdf' });
    expect(pdf.status).toBe(422);
  });
});
