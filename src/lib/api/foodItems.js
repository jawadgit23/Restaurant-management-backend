import { api, fetchAll } from "../apiClient";
import { getActiveRestaurantId } from "../activeRestaurant";

const STOCK_TO_LABEL = { in_stock: "In Stock", low_stock: "Low Stock", out_of_stock: "Out of Stock" };
const LABEL_TO_STOCK = { "In Stock": "in_stock", "Low Stock": "low_stock", "Out of Stock": "out_of_stock" };

function fromRow(i) {
  return {
    id: i.id,
    restaurantId: String(i.restaurant),
    name: i.name,
    category: i.category && typeof i.category === "object" ? i.category.name : "",
    price: Number(i.price),
    discountPrice: i.discountPrice ?? null,
    photo: i.image || "",
    description: i.description || "",
    stock: STOCK_TO_LABEL[i.stockStatus] || "In Stock",
    rating: Number(i.rating || 0).toFixed(1),
    orders: i.orderCount || 0,
    available: i.isAvailable,
  };
}

async function requireRestaurantId(explicit) {
  const id = explicit || getActiveRestaurantId();
  if (id) return id;
  const first = (await api.get("/restaurants", { limit: 1 })).data?.[0];
  if (!first) throw new Error("No restaurant found. Create a branch first.");
  return first.id;
}

/** Finds a category by name inside a restaurant, creating it when it doesn't exist yet. */
async function resolveCategoryId(restaurantId, name) {
  const wanted = String(name || "").trim();
  if (!wanted) throw new Error("Category is required");
  const { data: cats } = await api.get(`/restaurants/${restaurantId}/categories`);
  const found = cats.find((c) => c.name.toLowerCase() === wanted.toLowerCase());
  if (found) return found.id;
  const created = await api.post(`/restaurants/${restaurantId}/categories`, { name: wanted, sortOrder: cats.length + 1 });
  return created.data.id;
}

function toBody(item, categoryId) {
  const body = {
    category: categoryId,
    name: item.name,
    description: item.description || "",
    price: Number(item.price),
  };
  const stockStatus = LABEL_TO_STOCK[item.stock];
  if (stockStatus) body.stockStatus = stockStatus;
  if (item.available !== undefined) body.isAvailable = stockStatus === "out_of_stock" ? false : Boolean(item.available);

  // Pictures go to Cloudinary through the API as a multipart file. Without a new file the picture is left alone.
  if (item.photoFile instanceof File) {
    const form = new FormData();
    Object.entries(body).forEach(([k, v]) => form.append(k, String(v)));
    form.append("image", item.photoFile);
    return form;
  }
  return body;
}

/** Menu of one restaurant (defaults to the one currently selected in the dashboard). */
export async function listFoodItems(restaurantId) {
  const id = await requireRestaurantId(restaurantId);
  const items = await fetchAll(`/restaurants/${id}/menu`, { sort: "name" });
  return items.map(fromRow);
}

export async function createFoodItem(item) {
  const restaurantId = await requireRestaurantId(item.restaurantId);
  const categoryId = await resolveCategoryId(restaurantId, item.category);
  const res = await api.post(`/restaurants/${restaurantId}/menu`, toBody(item, categoryId));
  return fromRow({ ...res.data, category: { name: item.category } });
}

export async function updateFoodItem(id, updates) {
  const restaurantId = await requireRestaurantId(updates.restaurantId);
  const categoryId = await resolveCategoryId(restaurantId, updates.category);
  const res = await api.patch(`/menu/${id}`, toBody(updates, categoryId));
  return fromRow({ ...res.data, category: { name: updates.category } });
}

export async function deleteFoodItem(id) {
  await api.delete(`/menu/${id}`);
}
