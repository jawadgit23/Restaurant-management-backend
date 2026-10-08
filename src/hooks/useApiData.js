import { useEffect, useState } from "react";
import { isBackendConfigured } from "../lib/apiClient";

/**
 * Loads data from the REST API via `fetchFn` when configured; otherwise falls
 * back to `mockData` immediately so the app stays fully demoable before
 * a real backend is connected. Returns a `refetch` you can call after
 * mutations, plus `usingMock` so pages can show the setup notice.
 */
export function useApiData(fetchFn, mockData, deps = []) {
  const [data, setData] = useState(isBackendConfigured ? [] : mockData);
  const [loading, setLoading] = useState(isBackendConfigured);
  const [error, setError] = useState(null);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!isBackendConfigured) return; // initial state above already covers this case

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard start-of-fetch loading flag
    setLoading(true);
    setError(null);
    fetchFn()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchTick]);

  const refetch = () => setRefetchTick((t) => t + 1);

  return { data, setData, loading, error, refetch, usingMock: !isBackendConfigured };
}
