# API reference

Base URL `http://localhost:5000/api` · JSON · `Authorization: Bearer <accessToken>` for protected routes.

**Success** `{ "success": true, "message": "...", "data": ..., "pagination"?: {page,limit,total,totalPages}, "warnings"?: [] }`
**Error** `{ "success": false, "message": "...", "errors": [{field,message}], "code"?: "..." }`
Statuses: 200, 201, 400 (malformed id/JSON, business rule), 401 (missing/invalid/expired/revoked token), 403, 404, 409 (conflict / state), 422 (validation), 429, 500.

Legend: 🌐 public · 👤 any signed-in user · 🛒 customer · 🍽 restaurant_admin (own restaurants) or admin · 👑 admin

## Auth
| | | |
|--|--|--|
| 🌐 | `POST /auth/register` | `{name,email,password,phone}` → `{user,accessToken}` (role is always `customer`) |
| 🌐 | `POST /auth/login` | `{email,password}` → `{user,accessToken}` |
| 👤 | `POST /auth/logout` | revokes all tokens issued so far |

Password: 8–72 chars with upper, lower and a digit.

## Users
`GET /users/me` · `PATCH /users/me` `{name?,phone?}` · `PATCH /users/change-password` `{currentPassword,newPassword}` (returns a fresh token; other sessions are revoked)

## Restaurants
| | |
|--|--|
| 🌐 `GET /restaurants` | `page,limit,search,city,isActive*,isOpen,sort` (*only staff can list inactive) |
| 🌐 `GET /restaurants/:restaurantId` | details + `categories` + `menu` |
| 🍽 `POST /restaurants` | `name,address,city` required; owner is the caller (admin may pass `owner`) |
| 🍽 `PATCH /restaurants/:restaurantId` | owner/admin; only admin may change `isActive`/`owner` |
| 👑 `DELETE /restaurants/:restaurantId` | soft delete (deactivate) |

## Categories
🌐 `GET /restaurants/:id/categories` · 🍽 `POST /restaurants/:id/categories` `{name,description?,image?,sortOrder?}` · 🌐 `GET /categories/:id` · 🍽 `PATCH /categories/:id` · 🍽 `DELETE /categories/:id` (409 if it still has items)

## Menu
🌐 `GET /restaurants/:id/menu?category&search&minPrice&maxPrice&available&sort&page&limit` · 🍽 `POST /restaurants/:id/menu` `{category,name,price,discountPrice?,description?,image?,ingredients?[],preparationTime?,stockStatus?}` · 🌐 `GET /menu/:id` · 🍽 `PATCH /menu/:id` · 🍽 `DELETE /menu/:id` · 🍽 `PATCH /menu/:id/availability` `{isAvailable}`

## Cart (🛒 customers only)
`GET /cart` · `POST /cart/items {menuItemId,quantity}` · `PATCH /cart/items/:menuItemId {quantity}` · `DELETE /cart/items/:menuItemId` · `DELETE /cart` · `PUT /cart/coupon {code}` · `DELETE /cart/coupon`
Responses always show **current** DB prices; `warnings` lists price changes / unavailable items.

## Orders
| | |
|--|--|
| 🛒 `POST /orders` | `{deliveryAddress:{address,city,postalCode?}, phone, paymentMethod: cash\|card\|online, notes?, couponCode?}` — uses the server cart |
| 👤 `GET /orders/my-orders?page&limit&status` | own orders |
| 👤 `GET /orders/:orderId` | customer: own · restaurant admin: own restaurants · admin: all |
| 🛒 `PATCH /orders/:orderId/cancel` | only `pending`/`confirmed` |
| 🍽 `PATCH /orders/:orderId/status` | `{status}` — validated transition |
| 🍽 `GET /restaurants/:id/orders?status&from&to&search&page&limit` | restaurant order history |
| 🍽 `POST /restaurants/:id/orders/pos` | `{items:[{menuItemId,quantity}], orderType: dine_in\|takeaway\|delivery, customerName?, phone?, paymentMethod, couponCode?}` |

## Coupons (🍽)
`GET /coupons` · `POST /coupons {code,discountType: percentage|fixed|free_delivery,discountValue,minimumOrder?,maximumDiscount?,expiryDate?,usageLimit?,restaurant?}` · `GET /coupons/code/:code` · `PATCH /coupons/:id` · `DELETE /coupons/:id`. Restaurant admins must set `restaurant` to one they own; `restaurant: null` (platform-wide) is super-admin only.

## Admin
| | |
|--|--|
| 👑 `GET /admin/users?search&role&isBlocked` | |
| 👑 `PATCH /admin/users/:id/block` · `/unblock` · `/role {role}` | |
| 🍽 `GET /admin/restaurants` | scoped; includes last-30-day `stats` |
| 🍽 `GET /admin/orders?status&restaurant&from&to&search` | scoped |
| 🍽 `GET /admin/dashboard` | `totalUsers*, totalRestaurants, totalOrders, totalRevenue (delivered), todaysOrders, pendingOrders, completedOrders, ordersByStatus` (*platform scope only) |
| 👑 `DELETE /admin/orders/:id` | hard delete |

## Pictures (multer → Cloudinary)
Pictures are **only** accepted as an uploaded file, never as a URL. Restaurants, categories and menu items take an optional file in the multipart field **`image`** on:
`POST /restaurants` · `PATCH /restaurants/:id` · `POST /restaurants/:id/categories` · `PATCH /categories/:id` · `POST /restaurants/:id/menu` · `PATCH /menu/:id`

Send `multipart/form-data` instead of JSON (the other fields are the same; `ingredients` may be a JSON array string `["a","b"]` or `a, b`; an empty `discountPrice` means no discount). JSON requests keep working for everything except the picture.
* JPEG, PNG or WebP, max **5 MB**, one file; the real file signature is checked, not just the declared type.
* Uploaded to Cloudinary (resized to max 1600 px, auto quality/format); the response contains the `https://res.cloudinary.com/...` URL in `image`.
* Uploading a new file replaces the old one on Cloudinary. `{"image": ""}` (JSON) removes the picture. Deleting the record deletes its picture.
* The upload happens only after authentication, validation and the ownership check pass, and is rolled back if saving fails.
* Errors: 422 wrong type / too big / not a real image / URL given; 400 `UPLOAD_NOT_CONFIGURED` when the `CLOUDINARY_*` variables are missing; 502 `UPLOAD_FAILED`.
