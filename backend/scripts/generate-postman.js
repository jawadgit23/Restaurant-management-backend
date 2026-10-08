/* Generates docs/Areeba-Restaurant-API.postman_collection.json  →  npm run postman */
const fs = require('fs');
const path = require('path');

const j = (o) => JSON.stringify(o, null, 2);
const folder = (name, item) => ({ name, item });

function req(name, method, url, { body, auth = 'token', tests, desc } = {}) {
  const raw = `{{baseUrl}}${url}`;
  const [p, q] = url.split('?');
  const r = {
    name,
    request: {
      method,
      header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
      url: {
        raw,
        host: ['{{baseUrl}}'],
        path: p.split('/').filter(Boolean),
        ...(q ? { query: q.split('&').map((kv) => ({ key: kv.split('=')[0], value: kv.split('=')[1] })) } : {}),
      },
      ...(desc ? { description: desc } : {}),
      ...(body ? { body: { mode: 'raw', raw: j(body), options: { raw: { language: 'json' } } } } : {}),
    },
  };
  if (auth === 'none') r.request.auth = { type: 'noauth' };
  else r.request.auth = { type: 'bearer', bearer: [{ key: 'token', value: `{{${auth}}}`, type: 'string' }] };
  if (tests) r.event = [{ listen: 'test', script: { type: 'text/javascript', exec: tests.split('\n') } }];
  return r;
}

// multipart request with an optional file part (pick a JPEG/PNG/WebP in Postman's "Select files")
function formReq(name, method, url, fields, { auth = 'token', tests, file = true } = {}) {
  const r = req(name, method, url, { auth, tests });
  r.request.body = {
    mode: 'formdata',
    formdata: [
      ...Object.entries(fields).map(([key, value]) => ({ key, value: String(value), type: 'text' })),
      ...(file ? [{ key: 'image', type: 'file', src: [] }] : []),
    ],
  };
  return r;
}

const expect = (status, extra = '') => `pm.test('status is ${status}', () => pm.response.to.have.status(${status}));\n${extra}`;
const save = (varName, expr) => `pm.collectionVariables.set('${varName}', ${expr});`;

const items = [
  folder('0 · Setup (run seed first: npm run seed)', [
    req('Login – super admin', 'POST', '/auth/login', { auth: 'none', body: { email: 'admin@areebarestaurant.pk', password: 'Admin@12345' }, tests: expect(200, save('adminToken', 'pm.response.json().data.accessToken')) }),
    req('Login – restaurant admin (Nazimabad + North Nazimabad)', 'POST', '/auth/login', { auth: 'none', body: { email: 'ahmed@areebarestaurant.pk', password: 'Password123!' }, tests: expect(200, save('ownerToken', 'pm.response.json().data.accessToken')) }),
    req('Login – restaurant admin 2 (Gulshan)', 'POST', '/auth/login', { auth: 'none', body: { email: 'sara@smashhouse.pk', password: 'Password123!' }, tests: expect(200, save('owner2Token', 'pm.response.json().data.accessToken')) }),
    req('Login – customer (seeded)', 'POST', '/auth/login', { auth: 'none', body: { email: 'john@example.com', password: 'Password123!' }, tests: expect(200, save('token', 'pm.response.json().data.accessToken')) }),
  ]),
  folder('1 · Authentication', [
    req('Register', 'POST', '/auth/register', { auth: 'none', body: { name: 'Test User', email: '{{$timestamp}}@example.com', password: 'Password123!', phone: '+923001234567' }, tests: expect(201, "pm.test('no password in response', () => pm.expect(JSON.stringify(pm.response.json())).to.not.include('Password123'));\n" + save('newUserToken', 'pm.response.json().data.accessToken')) }),
    req('Register – duplicate email (409)', 'POST', '/auth/register', { auth: 'none', body: { name: 'John', email: 'john@example.com', password: 'Password123!', phone: '+923001234567' }, tests: expect(409) }),
    req('Register – invalid body (422)', 'POST', '/auth/register', { auth: 'none', body: { name: 'J', email: 'bad', password: 'weak', phone: 'x' }, tests: expect(422) }),
    req('Login', 'POST', '/auth/login', { auth: 'none', body: { email: 'john@example.com', password: 'Password123!' }, tests: expect(200, save('token', 'pm.response.json().data.accessToken')) }),
    req('Login – wrong password (401)', 'POST', '/auth/login', { auth: 'none', body: { email: 'john@example.com', password: 'Wrong123!' }, tests: expect(401) }),
    req('Get current user', 'GET', '/users/me', { tests: expect(200) }),
    req('Get current user – no token (401)', 'GET', '/users/me', { auth: 'none', tests: expect(401) }),
    req('Update profile', 'PATCH', '/users/me', { body: { name: 'John Updated', phone: '+923009999999' }, tests: expect(200) }),
    req('Change password (revokes other sessions)', 'PATCH', '/users/change-password', { auth: 'newUserToken', body: { currentPassword: 'Password123!', newPassword: 'NewPassword123!' }, tests: expect(200, save('newUserToken', 'pm.response.json().data.accessToken')) }),
    req('Logout', 'POST', '/auth/logout', { auth: 'newUserToken', tests: expect(200) }),
  ]),
  folder('2 · Restaurants', [
    req('List (pagination + search + city)', 'GET', '/restaurants?page=1&limit=10&search=areeba&city=Karachi', { auth: 'none', tests: expect(200, save('restaurantId', 'pm.response.json().data[0].id')) }),
    req('List – open only', 'GET', '/restaurants?isOpen=true', { auth: 'none', tests: expect(200) }),
    req('Get restaurant (with categories + menu)', 'GET', '/restaurants/{{restaurantId}}', { auth: 'none', tests: expect(200) }),
    req('Get restaurant – malformed id (400)', 'GET', '/restaurants/123', { auth: 'none', tests: expect(400) }),
    req('Create – customer forbidden (403)', 'POST', '/restaurants', { body: { name: 'X', address: 'Street 1', city: 'Karachi' }, tests: expect(403) }),
    req('Create restaurant (restaurant admin)', 'POST', '/restaurants', { auth: 'ownerToken', body: { name: 'Pizza Palace', description: 'Wood-fired pizza', address: 'Main Street 1, Clifton', city: 'Karachi', phone: '+923001112233', openingTime: '12:00', closingTime: '23:00' }, tests: expect(201, save('newRestaurantId', 'pm.response.json().data.id')) }),
    req('Update own restaurant', 'PATCH', '/restaurants/{{newRestaurantId}}', { auth: 'ownerToken', body: { description: 'Best pizza in town' }, tests: expect(200) }),
    req("Update someone else's restaurant (403)", 'PATCH', '/restaurants/{{newRestaurantId}}', { auth: 'owner2Token', body: { name: 'Hacked' }, tests: expect(403) }),
    req('Deactivate (soft delete) – owner forbidden (403)', 'DELETE', '/restaurants/{{newRestaurantId}}', { auth: 'ownerToken', tests: expect(403) }),
    req('Deactivate (soft delete) – super admin', 'DELETE', '/restaurants/{{newRestaurantId}}', { auth: 'adminToken', tests: expect(200) }),
    req('Re-activate – super admin', 'PATCH', '/restaurants/{{newRestaurantId}}', { auth: 'adminToken', body: { isActive: true, isOpen: true, status: 'active' }, tests: expect(200) }),
  ]),
  folder('3 · Categories', [
    req('Create category', 'POST', '/restaurants/{{newRestaurantId}}/categories', { auth: 'ownerToken', body: { name: 'Burgers', description: 'Our premium burgers', sortOrder: 1 }, tests: expect(201, save('categoryId', 'pm.response.json().data.id')) }),
    req('Create – duplicate name (409)', 'POST', '/restaurants/{{newRestaurantId}}/categories', { auth: 'ownerToken', body: { name: 'burgers' }, tests: expect(409) }),
    req('Create – other owner (403)', 'POST', '/restaurants/{{newRestaurantId}}/categories', { auth: 'owner2Token', body: { name: 'Drinks' }, tests: expect(403) }),
    req('List categories', 'GET', '/restaurants/{{newRestaurantId}}/categories', { auth: 'none', tests: expect(200) }),
    req('Get category', 'GET', '/categories/{{categoryId}}', { auth: 'none', tests: expect(200) }),
    req('Update category', 'PATCH', '/categories/{{categoryId}}', { auth: 'ownerToken', body: { description: 'Updated description' }, tests: expect(200) }),
  ]),
  folder('4 · Menu', [
    req('Create menu item', 'POST', '/restaurants/{{newRestaurantId}}/menu', { auth: 'ownerToken', body: { category: '{{categoryId}}', name: 'Zinger Burger', description: 'Crispy chicken burger', price: 650, discountPrice: 599, ingredients: ['Chicken', 'Lettuce', 'Cheese', 'Sauce'], preparationTime: 15 }, tests: expect(201, save('menuItemId', 'pm.response.json().data.id')) }),
    req('Create – discount ≥ price (422)', 'POST', '/restaurants/{{newRestaurantId}}/menu', { auth: 'ownerToken', body: { category: '{{categoryId}}', name: 'Bad', price: 100, discountPrice: 150 }, tests: expect(422) }),
    formReq('Create menu item WITH PICTURE (multipart → Cloudinary)', 'POST', '/restaurants/{{newRestaurantId}}/menu', { category: '{{categoryId}}', name: 'Picture Burger', price: 800, discountPrice: 750, ingredients: '["Beef","Cheese"]', preparationTime: 20 }, { auth: 'ownerToken', tests: expect(201, save('pictureItemId', 'pm.response.json().data.id')) }),
    formReq('Replace picture (multipart PATCH)', 'PATCH', '/menu/{{pictureItemId}}', { price: 820 }, { auth: 'ownerToken', tests: expect(200) }),
    req('Remove picture', 'PATCH', '/menu/{{pictureItemId}}', { auth: 'ownerToken', body: { image: '' }, tests: expect(200) }),
    req('Picture as URL is refused (422)', 'PATCH', '/menu/{{pictureItemId}}', { auth: 'ownerToken', body: { image: 'https://example.com/x.png' }, tests: expect(422) }),
    req('Get menu (category + search + price + pagination)', 'GET', '/restaurants/{{newRestaurantId}}/menu?category={{categoryId}}&search=burger&minPrice=200&maxPrice=1000&page=1&limit=20', { auth: 'none', tests: expect(200) }),
    req('Get menu item', 'GET', '/menu/{{menuItemId}}', { auth: 'none', tests: expect(200) }),
    req('Update menu item', 'PATCH', '/menu/{{menuItemId}}', { auth: 'ownerToken', body: { price: 700, discountPrice: 650 }, tests: expect(200) }),
    req('Update – customer forbidden (403)', 'PATCH', '/menu/{{menuItemId}}', { body: { price: 1 }, tests: expect(403) }),
    req('Change availability', 'PATCH', '/menu/{{menuItemId}}/availability', { auth: 'ownerToken', body: { isAvailable: false }, tests: expect(200) }),
    req('Restore availability', 'PATCH', '/menu/{{menuItemId}}/availability', { auth: 'ownerToken', body: { isAvailable: true }, tests: expect(200) }),
  ]),
  folder('5 · Cart (customer)', [
    req('Get cart', 'GET', '/cart', { tests: expect(200) }),
    req('Add item (price in body is ignored)', 'POST', '/cart/items', { body: { menuItemId: '{{menuItemId}}', quantity: 2, price: 1 }, tests: expect(201, "pm.test('price comes from DB', () => pm.expect(pm.response.json().data.items[0].price).to.not.equal(1));") }),
    req('Add item – quantity 0 (422)', 'POST', '/cart/items', { body: { menuItemId: '{{menuItemId}}', quantity: 0 }, tests: expect(422) }),
    req('Update quantity', 'PATCH', '/cart/items/{{menuItemId}}', { body: { quantity: 3 }, tests: expect(200) }),
    req('Apply coupon', 'PUT', '/cart/coupon', { body: { code: 'WELCOME10' }, tests: 'pm.test("200 or 422 (seeded coupon may have a minimum order)", () => pm.expect([200,422]).to.include(pm.response.code));' }),
    req('Remove coupon', 'DELETE', '/cart/coupon', { tests: expect(200) }),
    req('Remove item', 'DELETE', '/cart/items/{{menuItemId}}', { tests: expect(200) }),
    req('Clear cart', 'DELETE', '/cart', { tests: expect(200) }),
  ]),
  folder('6 · Orders', [
    req('Place order – empty cart (400)', 'POST', '/orders', { body: { deliveryAddress: { address: 'House 123, Main Street', city: 'Karachi', postalCode: '75000' }, phone: '+923001234567', paymentMethod: 'cash' }, tests: expect(400) }),
    req('(re)Add item to cart', 'POST', '/cart/items', { body: { menuItemId: '{{menuItemId}}', quantity: 2 }, tests: expect(201) }),
    req('Place order', 'POST', '/orders', { body: { deliveryAddress: { address: 'House 123, Main Street', city: 'Karachi', postalCode: '75000' }, phone: '+923001234567', paymentMethod: 'cash', notes: 'Please call when outside' }, tests: expect(201, save('orderId', 'pm.response.json().data.id')) }),
    req('Get my orders (paginated + status filter)', 'GET', '/orders/my-orders?page=1&limit=10&status=pending', { tests: expect(200) }),
    req('Get order', 'GET', '/orders/{{orderId}}', { tests: expect(200) }),
    req("Get order – other owner's restaurant (403)", 'GET', '/orders/{{orderId}}', { auth: 'owner2Token', tests: expect(403) }),
    req('Restaurant orders (owner)', 'GET', '/restaurants/{{newRestaurantId}}/orders?status=pending&page=1&limit=20', { auth: 'ownerToken', tests: expect(200) }),
    req('Restaurant orders – customer forbidden (403)', 'GET', '/restaurants/{{newRestaurantId}}/orders', { tests: expect(403) }),
    req('Update status → confirmed', 'PATCH', '/orders/{{orderId}}/status', { auth: 'ownerToken', body: { status: 'confirmed' }, tests: expect(200) }),
    req('Update status → delivered (skips steps, 409)', 'PATCH', '/orders/{{orderId}}/status', { auth: 'ownerToken', body: { status: 'delivered' }, tests: expect(409) }),
    req('Update status – customer forbidden (403)', 'PATCH', '/orders/{{orderId}}/status', { body: { status: 'preparing' }, tests: expect(403) }),
    req('Cancel order (customer, while confirmed)', 'PATCH', '/orders/{{orderId}}/cancel', { tests: expect(200) }),
    req('Cancel again (409)', 'PATCH', '/orders/{{orderId}}/cancel', { tests: expect(409) }),
    req('POS order (staff)', 'POST', '/restaurants/{{newRestaurantId}}/orders/pos', { auth: 'ownerToken', body: { items: [{ menuItemId: '{{menuItemId}}', quantity: 1 }], orderType: 'dine_in', paymentMethod: 'cash', customerName: 'Walk-in' }, tests: expect(201) }),
  ]),
  folder('7 · Coupons (staff)', [
    req('List coupons', 'GET', '/coupons', { auth: 'adminToken', tests: expect(200) }),
    req('Create coupon (super admin → platform-wide)', 'POST', '/coupons', { auth: 'adminToken', body: { code: 'POSTMAN{{$randomInt}}', discountType: 'percentage', discountValue: 15, minimumOrder: 500, maximumDiscount: 300, usageLimit: 100 }, tests: expect(201, save('couponId', 'pm.response.json().data.id')) }),
    req('Update coupon', 'PATCH', '/coupons/{{couponId}}', { auth: 'adminToken', body: { isActive: false }, tests: expect(200) }),
    req('Delete coupon', 'DELETE', '/coupons/{{couponId}}', { auth: 'adminToken', tests: expect(200) }),
  ]),
  folder('8 · Admin', [
    req('Users (super admin)', 'GET', '/admin/users?page=1&limit=20&role=customer', { auth: 'adminToken', tests: expect(200, save('customerId', 'pm.response.json().data[0].id')) }),
    req('Users – restaurant admin forbidden (403)', 'GET', '/admin/users', { auth: 'ownerToken', tests: expect(403) }),
    req('Block user', 'PATCH', '/admin/users/{{customerId}}/block', { auth: 'adminToken', tests: expect(200) }),
    req('Unblock user', 'PATCH', '/admin/users/{{customerId}}/unblock', { auth: 'adminToken', tests: expect(200) }),
    req('Restaurants (scoped)', 'GET', '/admin/restaurants', { auth: 'ownerToken', tests: expect(200) }),
    req('Orders (scoped)', 'GET', '/admin/orders?page=1&limit=20', { auth: 'ownerToken', tests: expect(200) }),
    req('Dashboard – platform', 'GET', '/admin/dashboard', { auth: 'adminToken', tests: expect(200) }),
    req('Dashboard – restaurant scope', 'GET', '/admin/dashboard', { auth: 'ownerToken', tests: expect(200) }),
  ]),
];

const collection = {
  info: {
    name: 'Areeba Restaurant API',
    description: 'Run `npm run seed` first, then run folder 0 (Setup) and the folders in order.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000/api' },
    ...['token', 'adminToken', 'ownerToken', 'owner2Token', 'newUserToken', 'restaurantId', 'newRestaurantId', 'categoryId', 'menuItemId', 'pictureItemId', 'orderId', 'couponId', 'customerId'].map((key) => ({ key, value: '' })),
  ],
  item: items,
};

const out = path.join(__dirname, '..', 'docs', 'Areeba-Restaurant-API.postman_collection.json');
fs.writeFileSync(out, j(collection));
console.log('wrote', out);
