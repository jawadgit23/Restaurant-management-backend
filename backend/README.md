# Areeba Restaurant API

Express + MongoDB (Mongoose) REST API with JWT auth, role-based access control and server-side pricing.

## Setup
```bash
npm install
cp .env.example .env     # MONGODB_URI, JWT_SECRET (>=32 chars in production), CLIENT_URL …
npm run seed             # ⚠ wipes the database, then inserts demo data
npm run dev              # or: npm start
npm test                 # unit + smoke + integration tests
npm run postman          # regenerate docs/*.postman_collection.json
```
`npm test` runs the integration suite against an in-memory MongoDB. `mongodb-memory-server` downloads a `mongod` binary the first time, so that run needs internet access. To use your own database instead, point the tests at it by replacing `MongoMemoryServer.create()` in `tests/integration/api.test.js`.

## Roles
| Role value | Who | Can |
| --- | --- | --- |
| `customer` | default on register | browse, cart, order, cancel own order, edit profile |
| `restaurant_admin` | created by a super admin (or seed) | manage **their own** restaurants, categories, menu, orders, coupons |
| `admin` | super admin | everything + users, activate/deactivate restaurants, platform stats |

Public registration always creates a `customer`. Promote someone with `PATCH /api/admin/users/:id/role`.

## Business rules enforced on the server
* **Prices are never accepted from the client.** Cart and order bodies are validated with Joi and unknown keys (price, total…) are stripped. Checkout re-reads every price from the DB, uses `discountPrice` when valid, and stores a name/price snapshot on the order.
* One restaurant per cart (409 `CART_RESTAURANT_MISMATCH`). Unavailable items, inactive/closed restaurants, empty cart → rejected.
* Order status machine (`utils/orderRules.js`): `pending → confirmed → preparing → ready → out_for_delivery → delivered`; `rejected`/`cancelled` only from allowed states; terminal states are final. Customers may cancel only while `pending`/`confirmed`.
* Cash orders become `paid` on delivery; cancelling a paid order marks it `refunded`.
* Coupons: active, not expired, usage limit (atomic increment), minimum order, restaurant scope, percentage cap.
* Delivery fee `DELIVERY_FEE` (PKR 150) for delivery orders; POS orders add `TAX_RATE_POS` % tax; online orders `TAX_RATE_ONLINE` %.
* Deleting a restaurant is a **soft delete** (deactivated, hidden from the public, history kept).

## Pictures
All pictures are uploaded with **multer** (memory storage, nothing touches the disk) and stored on **Cloudinary**. Fill in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `.env` (free account at cloudinary.com → Dashboard). Without them everything else works; only an upload attempt returns a clear `UPLOAD_NOT_CONFIGURED` error. See `docs/API.md` → *Pictures* for the rules. The seed data keeps its original demo photo links, which are replaced by Cloudinary pictures as you edit items.

## Security
bcrypt (cost 12) · JWT with expiry + per-user revocation (`logout`, password change and block invalidate older tokens) · same error for wrong email/password · rate limiting on auth routes + global · Helmet · strict CORS allow-list (`CLIENT_URL`) · Mongo-operator / prototype-pollution sanitiser · escaped regex for searches · 100 kB body limit · ObjectId validation · ownership checks on every restaurant-scoped route · secrets only from env (`.env` is git-ignored).

## Structure
```
src/
  config/       env.js, database.js
  models/       User Restaurant Category MenuItem Cart Order Coupon
  validators/   Joi schemas
  middleware/   auth, role, validate, error, rateLimit, sanitize, upload
  services/     auth, cart, order, coupon, access, upload
  controllers/  routes/  utils/  seed/
  app.js server.js
tests/          unit/ smoke/ (no DB) integration/ (MongoDB)
docs/           API.md, Postman collection
```

## Extensions beyond the brief
`/api/coupons` (CRUD), `PUT/DELETE /api/cart/coupon`, `POST /api/restaurants/:id/orders/pos` (walk-in orders from the POS), Multipart picture upload (field `image`) on restaurant / category / menu create + update, `PATCH /api/admin/users/:id/role`, `DELETE /api/admin/orders/:id` (super admin). `GET /api/admin/{restaurants,orders,dashboard}` also work for restaurant admins, scoped to the restaurants they own.
Not built: reviews, favorites, notifications, saved addresses (optional in the brief).
