/**
 * Thin fetch wrapper for the Areeba REST API (see /backend).
 *
 * Set VITE_API_URL (e.g. http://localhost:5000/api) to talk to the real backend.
 * When it is not set the app keeps running on the built-in demo data, exactly like before.
 */
const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export const isBackendConfigured = Boolean(BASE);

const TOKEN_KEY = "areeba_access_token";
const USER_KEY = "areeba_user";

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const tokenStore = {
  get: () => safe(() => localStorage.getItem(TOKEN_KEY)),
  set: (token) => safe(() => localStorage.setItem(TOKEN_KEY, token)),
  clear: () => safe(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }),
  getUser: () => safe(() => JSON.parse(localStorage.getItem(USER_KEY) || "null")),
  setUser: (user) => safe(() => localStorage.setItem(USER_KEY, JSON.stringify(user))),
};

export class ApiError extends Error {
  constructor(message, { status = 0, errors = [], code } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

function buildUrl(path, query) {
  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Returns the parsed JSON envelope: { success, message, data, pagination?, warnings? } */
export async function apiRequest(path, { method = "GET", body, query } = {}) {
  if (!isBackendConfigured) {
    throw new ApiError("Backend is not configured. Set VITE_API_URL in your .env file.");
  }

  const headers = { Accept: "application/json" };
  // FormData (picture uploads): let the browser set the multipart boundary itself
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the server. Check that the backend is running and VITE_API_URL is correct.");
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || (json && json.success === false)) {
    const err = new ApiError(json?.message || `Request failed (${res.status})`, {
      status: res.status,
      errors: json?.errors || [],
      code: json?.code,
    });
    // Surface the first field error, e.g. "price must be a number"
    if (res.status === 422 && err.errors.length) {
      err.message = `${err.message}: ${err.errors.map((e) => e.message).join("; ")}`;
    }
    // A stored token that the server no longer accepts → drop it so the UI falls back to signed-out
    if (res.status === 401 && token && /^TOKEN_/.test(json?.code || "")) {
      tokenStore.clear();
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw err;
  }
  return json;
}

export const api = {
  get: (path, query) => apiRequest(path, { query }),
  post: (path, body) => apiRequest(path, { method: "POST", body }),
  put: (path, body) => apiRequest(path, { method: "PUT", body }),
  patch: (path, body) => apiRequest(path, { method: "PATCH", body }),
  delete: (path) => apiRequest(path, { method: "DELETE" }),
};

/** Walks every page of a paginated endpoint (limit 100 per request, capped at `maxPages`). */
export async function fetchAll(path, query = {}, maxPages = 10) {
  const all = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const res = await api.get(path, { ...query, page, limit: 100 });
    all.push(...(res.data || []));
    if (!res.pagination || page >= res.pagination.totalPages) break;
  }
  return all;
}
