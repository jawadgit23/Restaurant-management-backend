import { api, fetchAll } from "../apiClient";
import { listBranches } from "./branches";

const STATUS_TO_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};
const LABEL_TO_STATUS = Object.fromEntries(Object.entries(STATUS_TO_LABEL).map(([k, v]) => [v, k]));

const TYPE_TO_LABEL = { delivery: "Delivery", pickup: "Takeaway", takeaway: "Takeaway", dine_in: "Dine-in" };
const LABEL_TO_TYPE = { Delivery: "delivery", Takeaway: "takeaway", "Dine-in": "dine_in" };

const PAYMENT_TO_LABEL = { cash: "Cash", card: "Card", online: "Online" };
function paymentToApi(label = "") {
  const l = label.toLowerCase();
  if (l.includes("jazz") || l.includes("easy") || l.includes("online")) return "online";
  if (l.includes("card")) return "card";
  return "cash";
}

// The dashboard shows the human order number ("ORD-…") but the API addresses orders by database id.
const idByNumber = new Map();

function fromRow(o) {
  idByNumber.set(o.orderNumber, o.id);
  const lineItems = (o.items || []).map((i) => ({ id: i.menuItem, name: i.name, price: Number(i.price), qty: i.quantity }));
  const addr = o.deliveryAddress || {};
  return {
    id: o.orderNumber,
    dbId: o.id,
    source: o.source,
    customer: o.customerName || o.user?.name || "Customer",
    customerPhone: o.phone || "",
    branch: o.restaurant?.name || "",
    orderType: TYPE_TO_LABEL[o.orderType] || "Delivery",
    items: lineItems.reduce((s, i) => s + i.qty, 0),
    lineItems,
    amount: Number(o.total),
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    coupon: o.couponCode,
    tax: Number(o.tax),
    deliveryFee: Number(o.deliveryFee),
    status: STATUS_TO_LABEL[o.orderStatus] || o.orderStatus,
    payment: PAYMENT_TO_LABEL[o.paymentMethod] || o.paymentMethod,
    date: new Date(o.createdAt),
    address: [addr.address, addr.city].filter(Boolean).join(", "),
  };
}

async function dbIdFor(orderNumber) {
  if (idByNumber.has(orderNumber)) return idByNumber.get(orderNumber);
  const res = await api.get("/admin/orders", { search: orderNumber, limit: 1 });
  const found = res.data?.[0];
  if (!found) throw new Error(`Order ${orderNumber} not found`);
  idByNumber.set(found.orderNumber, found.id);
  return found.id;
}

export async function listOrders() {
  return (await fetchAll("/admin/orders")).map(fromRow);
}

/**
 * Staff-created order from the POS terminal. The server recomputes every price and total from the
 * database – the amounts the terminal displays are only a preview.
 */
export async function placeOrder({
  branch, // branch NAME as selected in the POS
  customerName,
  customerPhone,
  customerAddress,
  orderType,
  paymentMethod,
  couponCode,
  items, // [{ id, qty }]
}) {
  const branches = await listBranches();
  const restaurant = branches.find((b) => b.name === branch);
  if (!restaurant) throw new Error(`Branch "${branch}" not found`);

  const res = await api.post(`/restaurants/${restaurant.id}/orders/pos`, {
    items: items.map((i) => ({ menuItemId: i.id, quantity: i.qty })),
    orderType: LABEL_TO_TYPE[orderType] || "dine_in",
    customerName: customerName || undefined,
    phone: customerPhone || undefined,
    deliveryAddress: customerAddress ? { address: customerAddress, city: restaurant.city || "Karachi" } : undefined,
    paymentMethod: paymentToApi(paymentMethod),
    couponCode: couponCode || undefined,
  });
  return res.data.orderNumber;
}

/**
 * Customer checkout from the public site. The browser cart is mirrored into the server cart,
 * then POST /orders turns it into an order using database prices.
 * Returns the created order (orderNumber, total, …).
 */
export async function placeOnlineOrder({ items, name, phone, address, city = "Karachi", paymentMethod, couponCode }) {
  await api.delete("/cart");
  for (const i of items) {
    await api.post("/cart/items", { menuItemId: i.id, quantity: i.qty });
  }
  const res = await api.post("/orders", {
    deliveryAddress: { address, city },
    phone,
    paymentMethod: paymentToApi(paymentMethod),
    couponCode: couponCode || undefined,
    customerName: name || undefined,
  });
  return res.data;
}

export async function updateOrderStatus(orderNumber, statusLabel) {
  const status = LABEL_TO_STATUS[statusLabel] || statusLabel;
  const id = await dbIdFor(orderNumber);
  const res = await api.patch(`/orders/${id}/status`, { status });
  return fromRow(res.data);
}

export async function deleteOrder(orderNumber) {
  const id = await dbIdFor(orderNumber);
  await api.delete(`/admin/orders/${id}`); // super admin only
}
