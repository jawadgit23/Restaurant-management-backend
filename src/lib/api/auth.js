import { api } from "../apiClient";

export const loginRequest = (email, password) => api.post("/auth/login", { email, password }).then((r) => r.data);
export const registerRequest = (payload) => api.post("/auth/register", payload).then((r) => r.data);
export const fetchMe = () => api.get("/users/me").then((r) => r.data);
export const logoutRequest = () => api.post("/auth/logout").catch(() => {});
export const updateProfileRequest = (payload) => api.patch("/users/me", payload).then((r) => r.data);
export const changePasswordRequest = (payload) => api.patch("/users/change-password", payload).then((r) => r.data);
