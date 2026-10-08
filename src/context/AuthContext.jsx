import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isBackendConfigured, tokenStore } from "../lib/apiClient";
import { loginRequest, registerRequest, fetchMe, logoutRequest } from "../lib/api/auth";

const AuthContext = createContext(null);

const STAFF_ROLES = ["admin", "restaurant_admin"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (isBackendConfigured && tokenStore.get() ? tokenStore.getUser() : null));
  const [loading, setLoading] = useState(isBackendConfigured && Boolean(tokenStore.get()));

  const applySession = useCallback((nextUser, token) => {
    if (token) tokenStore.set(token);
    tokenStore.setUser(nextUser);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Validate any stored token once on startup
  useEffect(() => {
    if (!isBackendConfigured || !tokenStore.get()) return undefined;
    let cancelled = false;
    fetchMe()
      .then((me) => !cancelled && applySession(me))
      .catch(() => !cancelled && clearSession())
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  // apiClient fires this when the server rejects the stored token (expired / revoked / blocked)
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  /** staffOnly: used by the /admin login page – customers are rejected. */
  const signIn = async (email, password, { staffOnly = false } = {}) => {
    if (!isBackendConfigured) return { error: { message: "Backend is not configured yet." } };
    try {
      const { user: u, accessToken } = await loginRequest(email, password);
      if (staffOnly && !STAFF_ROLES.includes(u.role)) {
        return { error: { message: "This account does not have access to the admin panel." } };
      }
      applySession(u, accessToken);
      return { error: null, user: u };
    } catch (err) {
      return { error: err };
    }
  };

  const signUp = async ({ name, email, password, phone }) => {
    if (!isBackendConfigured) return { error: { message: "Backend is not configured yet." } };
    try {
      const { user: u, accessToken } = await registerRequest({ name, email, password, phone });
      applySession(u, accessToken);
      return { error: null, user: u };
    } catch (err) {
      return { error: err };
    }
  };

  const signOut = async () => {
    if (!isBackendConfigured) return;
    if (tokenStore.get()) await logoutRequest();
    clearSession();
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isStaff: !!user && STAFF_ROLES.includes(user.role),
      isSuperAdmin: user?.role === "admin",
      isCustomer: user?.role === "customer",
      signIn,
      signUp,
      signOut,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
