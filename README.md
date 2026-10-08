# Areeba Restaurant — Dashboard, Website & API

React (Vite) front end + a Node/Express/MongoDB REST API in [`/backend`](backend/).

| Part | What it is |
| --- | --- |
| `src/` | Admin dashboard (`/admin`), POS (`/pos`) and the public ordering site (`/`) |
| `backend/` | REST API: auth, restaurants, categories, menu, cart, orders, coupons, admin |

## Quick start

```bash
# 1 – API  (needs Node 18+ and a MongoDB: local, Docker or Atlas)
cd backend
cp .env.example .env        # set MONGODB_URI and JWT_SECRET
npm install
npm run seed                # demo restaurants, menu, coupons, users
npm run dev                 # http://localhost:5000/api

# 2 – Front end (new terminal, project root)
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173
```

No MongoDB handy? `docker run -d -p 27017:27017 --name mongo mongo:7`

Without `VITE_API_URL` the UI still runs on its built-in demo data (as before).

## Seeded logins

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@areebarestaurant.pk` | `Admin@12345` |
| Restaurant admin (Nazimabad + North Nazimabad) | `ahmed@areebarestaurant.pk` | `Password123!` |
| Restaurant admin (Gulshan) | `sara@smashhouse.pk` | `Password123!` |
| Customers | `john@example.com`, `fatima@example.com`, `bilal@example.com` | `Password123!` |

Admin panel: `/admin/login` (staff only). Customers sign in / register inside the checkout window on the public site.

## How the UI maps to the API

| UI | API |
| --- | --- |
| Branches page / "Locations" section | Restaurants |
| Food Menu page, POS menu, public menu | `GET/POST/PATCH/DELETE /restaurants/:id/menu`, `/menu/:id` (categories are created on the fly from the category name) |
| Orders page | `GET /admin/orders`, `PATCH /orders/:id/status` (only legal next steps are offered) |
| POS "Generate receipt" | `POST /restaurants/:id/orders/pos` — server re-prices everything |
| Public checkout | cart mirrored to `/cart`, then `POST /orders` — server re-prices everything |
| Coupons page | `/coupons` |

Menu, coupons and POS act on one restaurant at a time; if you manage more than one, a branch picker appears.

### Pictures
Food photos are chosen with a file picker in the Food Menu form and uploaded to Cloudinary by the API (multer). Add your `CLOUDINARY_*` keys to `backend/.env` first.

### Still demo data
These pages are **not** covered by the API spec and stay on sample data: Dashboard charts, Analytics, Customers, Delivery/Riders, Payments, Reviews, Settings. Vendors and Inventory keep working but are stored in the browser (localStorage). The API already has `GET /admin/users` (+ block/unblock) and `GET /admin/dashboard` if you want to wire Customers/Dashboard next.

## Backend docs
See [`backend/README.md`](backend/README.md) (setup, security, design decisions) and [`backend/docs/API.md`](backend/docs/API.md) (every endpoint). Postman collection: `backend/docs/Areeba-Restaurant-API.postman_collection.json`.
