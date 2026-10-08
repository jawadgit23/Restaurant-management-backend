import { useEffect, useState } from "react";
import { isBackendConfigured } from "../lib/apiClient";
import { listBranches } from "../lib/api/branches";
import { getActiveRestaurantId, setActiveRestaurantId } from "../lib/activeRestaurant";

/**
 * Loads the restaurants the signed-in staff member manages and keeps track of the one currently selected
 * (persisted, so Menu / Coupons / POS all act on the same branch).
 */
export function useActiveRestaurant() {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantId, setId] = useState(getActiveRestaurantId());
  const [loading, setLoading] = useState(isBackendConfigured);

  useEffect(() => {
    if (!isBackendConfigured) return undefined;
    let cancelled = false;
    listBranches()
      .then((list) => {
        if (cancelled) return;
        setRestaurants(list);
        const stored = getActiveRestaurantId();
        const valid = list.find((r) => r.id === stored) ? stored : list[0]?.id || null;
        setActiveRestaurantId(valid);
        setId(valid);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const select = (id) => {
    setActiveRestaurantId(id);
    setId(id);
  };

  return { restaurants, restaurantId, setRestaurantId: select, loading };
}
