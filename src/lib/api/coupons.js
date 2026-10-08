import { api, fetchAll, tokenStore } from "../apiClient";
import { getActiveRestaurantId } from "../activeRestaurant";

const TYPE_TO_LABEL = { percentage: "Percentage", fixed: "Fixed", free_delivery: "Free Delivery" };
const LABEL_TO_TYPE = { Percentage: "percentage", Fixed: "fixed", "Free Delivery": "free_delivery" };

function fromRow(c) {
  const expired =
    (c.expiryDate && new Date(c.expiryDate).getTime() < Date.now()) || (c.usageLimit > 0 && c.usedCount >= c.usageLimit);
  return {
    id: c.id,
    code: c.code,
    type: TYPE_TO_LABEL[c.discountType],
    value: Number(c.discountValue),
    uses: c.usedCount,
    maxUses: c.usageLimit,
    status: expired ? "Expired" : c.isActive ? "Active" : "Paused",
    expiry: c.expiryDate ? String(c.expiryDate).slice(0, 10) : "",
    minOrder: Number(c.minimumOrder),
    scope: c.restaurant && typeof c.restaurant === "object" ? c.restaurant.name : c.restaurant ? "Branch" : "All branches",
  };
}

function toBody(c) {
  return {
    code: String(c.code || "").trim().toUpperCase(),
    discountType: LABEL_TO_TYPE[c.type],
    discountValue: Number(c.value) || 0,
    minimumOrder: Number(c.minOrder) || 0,
    usageLimit: Number(c.maxUses) || 0,
    expiryDate: c.expiry ? `${c.expiry}T23:59:59.000Z` : null,
    isActive: c.status === "Active",
  };
}

export async function listCoupons() {
  return (await fetchAll("/coupons")).map(fromRow);
}

export async function getCouponByCode(code) {
  try {
    const res = await api.get(`/coupons/code/${encodeURIComponent(code)}`);
    return fromRow(res.data);
  } catch (err) {
    if (err.status === 404 || err.status === 403) return null;
    throw err;
  }
}

export async function createCoupon(coupon) {
  const body = toBody(coupon);
  // Super admins create platform-wide coupons; restaurant admins' coupons belong to the branch they manage.
  if (tokenStore.getUser()?.role !== "admin") body.restaurant = getActiveRestaurantId();
  const res = await api.post("/coupons", body);
  return fromRow(res.data);
}

export async function updateCoupon(id, updates) {
  const res = await api.patch(`/coupons/${id}`, toBody(updates));
  return fromRow(res.data);
}

export async function deleteCoupon(id) {
  await api.delete(`/coupons/${id}`);
}
