// Remembers which restaurant/branch the admin is currently managing (menu, coupons, POS).
const KEY = "areeba_admin_restaurant";

export function getActiveRestaurantId() {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

export function setActiveRestaurantId(id) {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
