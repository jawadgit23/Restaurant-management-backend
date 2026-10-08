import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BRANCHES as MOCK_BRANCHES } from "../../data/mockData";
import { isBackendConfigured } from "../../lib/apiClient";
import { listPublicBranches } from "../../lib/api/branches";
import { useCart } from "./CartContext";

const RestaurantContext = createContext(null);
const KEY = "areeba_site_restaurant";

const readStored = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

/**
 * Which restaurant/branch the customer is ordering from. A cart can only hold items from one restaurant
 * (the API enforces this too), so switching branch empties the cart after confirmation.
 */
export function RestaurantProvider({ children }) {
  const { items, clearCart } = useCart();
  const [restaurants, setRestaurants] = useState(isBackendConfigured ? [] : MOCK_BRANCHES);
  const [loading, setLoading] = useState(isBackendConfigured);
  const [restaurantId, setRestaurantId] = useState(readStored());

  useEffect(() => {
    if (!isBackendConfigured) return undefined;
    let cancelled = false;
    listPublicBranches()
      .then((list) => {
        if (cancelled) return;
        setRestaurants(list);
        setRestaurantId((current) => (list.some((r) => r.id === current) ? current : list[0]?.id || null));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const selectRestaurant = useCallback(
    (id) => {
      if (id === restaurantId) return;
      if (items.length > 0 && !window.confirm("Switching branch will empty your cart. Continue?")) return;
      if (items.length > 0) clearCart();
      setRestaurantId(id);
      try {
        localStorage.setItem(KEY, id);
      } catch {
        /* ignore */
      }
    },
    [restaurantId, items.length, clearCart]
  );

  const restaurant = restaurants.find((r) => r.id === restaurantId) || restaurants[0] || null;

  const value = useMemo(
    () => ({ restaurants, restaurant, restaurantId: restaurant?.id || null, selectRestaurant, loading }),
    [restaurants, restaurant, selectRestaurant, loading]
  );
  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error("useRestaurant must be used within RestaurantProvider");
  return ctx;
}
